import Vehicle from '../models/Vehicle.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
export const mine=asyncHandler(async(req,res)=>res.json({success:true,vehicles:await Vehicle.find({driver:req.auth.id})}));
export const updateMine=asyncHandler(async(req,res)=>{const v=await Vehicle.findOneAndUpdate({_id:req.params.id,driver:req.auth.id},{$set:req.validated.body},{new:true,runValidators:true});if(!v)throw new HttpError(404,'Vehicle not found');res.json({success:true,vehicle:v});});
