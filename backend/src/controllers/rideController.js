import { z } from 'zod';
import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Payment from '../models/Payment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { calculateFare } from '../utils/fare.js';
import { point, haversineKm } from '../utils/geo.js';
import Location from '../models/Location.js';
import { getRouteMetrics } from '../services/routingService.js';
import { broadcastRideRequest } from '../services/rideMatchingService.js';
import { createNotification } from '../services/notificationService.js';
import { getIo } from '../sockets/ioStore.js';
import { getSetting } from '../services/settingsService.js';

export const createRideSchema=z.object({body:z.object({pickup:z.object({address:z.string().min(2),lat:z.number(),lng:z.number()}),destination:z.object({address:z.string().min(2),lat:z.number(),lng:z.number()}),requestedVehicleType:z.enum(['bike','auto','car','suv']).default('car'),paymentMethod:z.enum(['cash','online','wallet']).default('cash')}),query:z.any(),params:z.any()});

const populateRide=(q)=>q.populate('user','name phone avatarUrl').populate('driver','name phone avatarUrl ratingAverage currentLocation').populate('vehicle');

export const estimate=asyncHandler(async(req,res)=>{const {pickup,destination}=req.validated.body;const m=await getRouteMetrics(pickup,destination);res.json({success:true,...m,estimatedFare:calculateFare(m.distanceKm,m.durationMinutes)});});
export const create=asyncHandler(async(req,res)=>{
  const active=await Ride.findOne({user:req.auth.id,status:{$in:['searching','accepted','driver_arriving','arrived','in_progress']}}); if(active) throw new HttpError(409,'You already have an active ride');
  const b=req.validated.body; const m=await getRouteMetrics({lat:b.pickup.lat,lng:b.pickup.lng},{lat:b.destination.lat,lng:b.destination.lng});
  const ride=await Ride.create({user:req.auth.id,pickup:{address:b.pickup.address,location:point(b.pickup.lat,b.pickup.lng)},destination:{address:b.destination.address,location:point(b.destination.lat,b.destination.lng)},requestedVehicleType:b.requestedVehicleType,paymentMethod:b.paymentMethod,estimatedDistanceKm:m.distanceKm,estimatedDurationMinutes:m.durationMinutes,estimatedFare:calculateFare(m.distanceKm,m.durationMinutes)});
  const populated=await populateRide(Ride.findById(ride._id)); const candidateCount=await broadcastRideRequest(populated.toObject()); res.status(201).json({success:true,ride:populated,candidateCount});
});
export const active=asyncHandler(async(req,res)=>{const filter=req.auth.role==='user'?{user:req.auth.id}:{driver:req.auth.id};const ride=await populateRide(Ride.findOne({...filter,status:{$in:['searching','accepted','driver_arriving','arrived','in_progress']}}).sort({createdAt:-1}));res.json({success:true,ride});});
export const getOne=asyncHandler(async(req,res)=>{const ride=await populateRide(Ride.findById(req.params.id));if(!ride)throw new HttpError(404,'Ride not found');const allowed=req.auth.role==='admin'||ride.user?._id?.toString()===req.auth.id||ride.driver?._id?.toString()===req.auth.id;if(!allowed)throw new HttpError(403,'Forbidden');res.json({success:true,ride});});
export const accept=asyncHandler(async(req,res)=>{
  const driver=req.auth.principal;if(driver.verificationStatus!=='approved'||!driver.isOnline||driver.isBusy)throw new HttpError(409,'Driver is not available');
  const requested=await Ride.findOne({_id:req.params.id,status:'searching'}).select('requestedVehicleType');if(!requested)throw new HttpError(409,'Ride is no longer available');const vehicle=await Vehicle.findOne({driver:driver._id,isActive:true,type:requested.requestedVehicleType});if(!vehicle)throw new HttpError(409,'No active matching vehicle');
  const ride=await Ride.findOneAndUpdate({_id:req.params.id,status:'searching',driver:null,rejectedDrivers:{$ne:driver._id}},{$set:{driver:driver._id,vehicle:vehicle._id,status:'accepted',acceptedAt:new Date()}},{new:true});
  if(!ride)throw new HttpError(409,'Ride is no longer available');driver.isBusy=true;await driver.save(); const populated=await populateRide(Ride.findById(ride._id));
  getIo().to(`user:${ride.user}`).emit('ride:accepted',populated.toObject());getIo().to(`ride:${ride._id}`).emit('ride:state',populated.toObject());
  await createNotification({role:'user',id:ride.user,title:'Driver accepted your ride',body:`${driver.name} is on the way`,type:'ride',data:{rideId:ride._id}});res.json({success:true,ride:populated});
});
export const reject=asyncHandler(async(req,res)=>{const ride=await Ride.findOneAndUpdate({_id:req.params.id,status:'searching'},{$addToSet:{rejectedDrivers:req.auth.principal._id}},{new:true});if(!ride)throw new HttpError(409,'Ride is no longer available');res.json({success:true});});

const transitions={accepted:['driver_arriving','cancelled'],driver_arriving:['arrived','cancelled'],arrived:['in_progress','cancelled'],in_progress:['completed']};
export const updateStatus=asyncHandler(async(req,res)=>{
  const next=req.validated.body.status; const ride=await Ride.findOne({_id:req.params.id,driver:req.auth.id});if(!ride)throw new HttpError(404,'Ride not found');if(!(transitions[ride.status]||[]).includes(next))throw new HttpError(409,`Cannot transition ${ride.status} -> ${next}`);
  ride.status=next; const now=new Date(); if(next==='arrived')ride.arrivedAt=now;if(next==='in_progress')ride.startedAt=now;
  if(next==='completed'){ride.completedAt=now;const duration=ride.startedAt?Math.max(1,(now-ride.startedAt)/60000):ride.estimatedDurationMinutes;ride.actualDurationMinutes=duration;const samples=await Location.find({ride:ride._id,recordedAt:{$gte:ride.startedAt||ride.acceptedAt||ride.createdAt}}).sort({recordedAt:1}).select('point.coordinates').lean();let measured=0;for(let i=1;i<samples.length;i++){const a=samples[i-1].point.coordinates,b=samples[i].point.coordinates;measured+=haversineKm({lat:a[1],lng:a[0]},{lat:b[1],lng:b[0]});}ride.actualDistanceKm=measured>0.1?measured:ride.estimatedDistanceKm;ride.finalFare=calculateFare(ride.actualDistanceKm,ride.actualDurationMinutes);const commissionPercent=Math.min(100,Math.max(0,Number(await getSetting('commissionPercent',15))||0));const platformFee=Math.round(ride.finalFare*commissionPercent)/100;const driverEarning=Math.round((ride.finalFare-platformFee)*100)/100;await Payment.findOneAndUpdate({ride:ride._id},{ride:ride._id,user:ride.user,driver:ride.driver,amount:ride.finalFare,platformFee,driverEarning,method:ride.paymentMethod,status:ride.paymentMethod==='cash'?'paid':'pending',paidAt:ride.paymentMethod==='cash'?now:undefined},{upsert:true,new:true});await Driver.updateOne({_id:ride.driver},{$set:{isBusy:false}});}
  await ride.save(); const populated=await populateRide(Ride.findById(ride._id)); getIo().to(`ride:${ride._id}`).emit('ride:state',populated.toObject());getIo().to(`user:${ride.user}`).emit('ride:state',populated.toObject());
  await createNotification({role:'user',id:ride.user,title:'Ride update',body:`Ride status: ${next.replace('_',' ')}`,type:'ride',data:{rideId:ride._id,status:next}});res.json({success:true,ride:populated});
});
export const cancel=asyncHandler(async(req,res)=>{const ride=await Ride.findById(req.params.id);if(!ride)throw new HttpError(404,'Ride not found');if(['completed','cancelled'].includes(ride.status))throw new HttpError(409,'Ride already closed');if(ride.status==='in_progress'&&req.auth.role!=='admin')throw new HttpError(409,'An in-progress ride can only be cancelled by an administrator');const permitted=req.auth.role==='admin'||(req.auth.role==='user'&&ride.user.toString()===req.auth.id)||(req.auth.role==='driver'&&ride.driver?.toString()===req.auth.id);if(!permitted)throw new HttpError(403,'Forbidden');ride.status='cancelled';ride.cancellation={by:req.auth.role,reason:req.validated.body.reason||'Cancelled',at:new Date()};await ride.save();if(ride.driver)await Driver.updateOne({_id:ride.driver},{$set:{isBusy:false}});const populated=await populateRide(Ride.findById(ride._id));getIo().to(`ride:${ride._id}`).emit('ride:state',populated.toObject());getIo().to(`user:${ride.user}`).emit('ride:state',populated.toObject());res.json({success:true,ride:populated});});
