import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { point } from '../utils/geo.js';
import Location from '../models/Location.js';
import Ride from '../models/Ride.js';
import Payment from '../models/Payment.js';
import Driver from '../models/Driver.js';

export const updateProfile = asyncHandler(async(req,res)=>{ for (const k of ['name','avatarUrl']) if(req.body[k]!==undefined) req.auth.principal[k]=req.body[k]; await req.auth.principal.save(); res.json({success:true,driver:req.auth.principal}); });
export const setOnline = asyncHandler(async(req,res)=>{
  const driver=req.auth.principal; if(driver.verificationStatus!=='approved') throw new HttpError(403,'Driver must be approved before going online');
  driver.isOnline=Boolean(req.body.isOnline); if(req.body.lat!=null&&req.body.lng!=null){driver.currentLocation=point(req.body.lat,req.body.lng);driver.lastLocationAt=new Date();}
  await driver.save(); res.json({success:true,isOnline:driver.isOnline});
});
export const updateLocation = asyncHandler(async(req,res)=>{
  const {lat,lng,heading=0,speed,accuracy,rideId}=req.body; const driver=req.auth.principal; driver.currentLocation=point(lat,lng);driver.heading=heading;driver.lastLocationAt=new Date();await driver.save();
  await Location.create({driver:driver._id,ride:rideId||undefined,point:point(lat,lng),heading,speed,accuracy});
  res.json({success:true});
});
export const history = asyncHandler(async(req,res)=>{const rides=await Ride.find({driver:req.auth.id}).populate('user','name phone avatarUrl').populate('vehicle').sort({createdAt:-1}).limit(100);res.json({success:true,rides});});
export const earnings = asyncHandler(async(req,res)=>{
  const rows=await Payment.aggregate([{ $match:{driver:req.auth.principal._id,status:'paid'}},{ $group:{_id:null,total:{$sum:{$ifNull:['$driverEarning','$amount']}},gross:{$sum:'$amount'},platformFee:{$sum:{$ifNull:['$platformFee',0]}},rides:{$sum:1}} }]);
  const recent=await Payment.find({driver:req.auth.id,status:'paid'}).populate('ride').sort({paidAt:-1,createdAt:-1}).limit(50);
  res.json({success:true,summary:rows[0]||{total:0,rides:0},recent});
});
export const nearby = asyncHandler(async(req,res)=>{ const lat=Number(req.query.lat),lng=Number(req.query.lng),radius=Math.min(50000,Math.max(100,Number(req.query.radius||7000)));if(!Number.isFinite(lat)||lat<-90||lat>90||!Number.isFinite(lng)||lng<-180||lng>180||!Number.isFinite(radius))throw new HttpError(422,'Valid lat, lng and radius are required');const drivers=await Driver.find({verificationStatus:'approved',isOnline:true,isBusy:false,lastLocationAt:{$gte:new Date(Date.now()-60000)},currentLocation:{$near:{$geometry:point(lat,lng),$maxDistance:radius}}}).select('name avatarUrl ratingAverage currentLocation').limit(30);res.json({success:true,drivers}); });
