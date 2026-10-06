import { verifyToken } from '../utils/jwt.js';import Driver from '../models/Driver.js';import Ride from '../models/Ride.js';import Location from '../models/Location.js';import { point } from '../utils/geo.js';import { setIo } from './ioStore.js';

export function configureSockets(io){
  setIo(io);
  io.use((socket,next)=>{try{const token=socket.handshake.auth?.token||socket.handshake.headers.authorization?.replace('Bearer ','');if(!token)throw new Error('Missing token');socket.auth=verifyToken(token);next();}catch(e){next(new Error('Unauthorized'));}});
  io.on('connection',(socket)=>{
    const {sub,role}=socket.auth;socket.join(`${role}:${sub}`);if(role==='admin')socket.join('admins');
    socket.on('ride:join',async({rideId})=>{const ride=await Ride.findById(rideId);if(!ride)return;const allowed=role==='admin'||ride.user.toString()===sub||ride.driver?.toString()===sub;if(allowed)socket.join(`ride:${rideId}`);});
    socket.on('driver:location',async(data,ack)=>{try{if(role!=='driver')throw new Error('Driver only');const {lat,lng,heading=0,speed,accuracy,rideId}=data;await Driver.updateOne({_id:sub},{$set:{currentLocation:point(lat,lng),heading,lastLocationAt:new Date()}});await Location.create({driver:sub,ride:rideId||undefined,point:point(lat,lng),heading,speed,accuracy});io.to('admins').emit('admin:driver_location',{driverId:sub,lat,lng,heading,rideId,at:new Date().toISOString()});if(rideId){const ride=await Ride.findOne({_id:rideId,driver:sub});if(ride){ride.lastDriverLocation=point(lat,lng);await ride.save();io.to(`ride:${rideId}`).emit('ride:driver_location',{rideId,driverId:sub,lat,lng,heading,at:new Date().toISOString()});io.to(`user:${ride.user}`).emit('ride:driver_location',{rideId,driverId:sub,lat,lng,heading,at:new Date().toISOString()});}}ack?.({ok:true});}catch(e){ack?.({ok:false,error:e.message});}});
    socket.on('disconnect',()=>{if(role==='driver'){setTimeout(async()=>{const sockets=await io.in(`driver:${sub}`).fetchSockets();if(sockets.length===0)await Driver.updateOne({_id:sub},{$set:{isOnline:false}});},30000);}});
  });
}
