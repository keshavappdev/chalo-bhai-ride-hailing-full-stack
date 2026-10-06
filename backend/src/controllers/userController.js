import { asyncHandler } from '../utils/asyncHandler.js';
import Ride from '../models/Ride.js';
import { point } from '../utils/geo.js';
export const updateProfile = asyncHandler(async (req,res)=>{
  const allowed=['name','avatarUrl']; for (const k of allowed) if (req.body[k] !== undefined) req.auth.principal[k]=req.body[k];
  await req.auth.principal.save(); res.json({success:true,user:req.auth.principal});
});
export const updateLocation = asyncHandler(async(req,res)=>{ const {lat,lng}=req.body; req.auth.principal.lastKnownLocation=point(lat,lng); await req.auth.principal.save(); res.json({success:true}); });
export const rideHistory = asyncHandler(async(req,res)=>{ const rides=await Ride.find({user:req.auth.id}).populate('driver','name phone ratingAverage avatarUrl').populate('vehicle').sort({createdAt:-1}).limit(100); res.json({success:true,rides}); });
