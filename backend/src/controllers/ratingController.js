import Rating from '../models/Rating.js';
import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
export const create=asyncHandler(async(req,res)=>{const ride=await Ride.findById(req.params.rideId);if(!ride||ride.status!=='completed')throw new HttpError(409,'Completed ride required');const {rating,review}=req.validated.body;let doc;if(req.auth.role==='user'){if(ride.user.toString()!==req.auth.id||!ride.driver)throw new HttpError(403,'Forbidden');doc=await Rating.create({ride:ride._id,fromRole:'user',fromUser:req.auth.id,toDriver:ride.driver,rating,review});const agg=await Rating.aggregate([{$match:{toDriver:ride.driver}},{$group:{_id:null,avg:{$avg:'$rating'},count:{$sum:1}}}]);if(agg[0])await Driver.updateOne({_id:ride.driver},{$set:{ratingAverage:agg[0].avg,ratingCount:agg[0].count}});}else{if(ride.driver?.toString()!==req.auth.id)throw new HttpError(403,'Forbidden');doc=await Rating.create({ride:ride._id,fromRole:'driver',fromDriver:req.auth.id,toUser:ride.user,rating,review});}res.status(201).json({success:true,rating:doc});});
export const list=asyncHandler(async(req,res)=>res.json({success:true,ratings:await Rating.find({$or:[{toDriver:req.auth.id},{toUser:req.auth.id}]}).sort({createdAt:-1}).limit(100)}));
