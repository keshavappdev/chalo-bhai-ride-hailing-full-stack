import { z } from 'zod';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Admin from '../models/Admin.js';
import { signToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const email = z.string().email();
export const registerUserSchema = z.object({ body: z.object({ name: z.string().min(2), email, phone: z.string().min(7), password: z.string().min(8) }), query: z.any(), params: z.any() });
export const registerDriverSchema = z.object({ body: z.object({
  name: z.string().min(2), email, phone: z.string().min(7), password: z.string().min(8), licenseNumber: z.string().min(3),
  vehicle: z.object({ make: z.string().min(1), model: z.string().min(1), color: z.string().min(1), plateNumber: z.string().min(3), type: z.enum(['bike','auto','car','suv']), year: z.number().int().optional() })
}), query: z.any(), params: z.any() });
export const loginSchema = z.object({ body: z.object({ email, password: z.string().min(1), role: z.enum(['user','driver','admin']) }), query: z.any(), params: z.any() });

const sanitize = (doc, role) => ({ id: doc._id, name: doc.name, email: doc.email, phone: doc.phone, role, verificationStatus: doc.verificationStatus });

export const registerUser = asyncHandler(async (req,res) => {
  const { name,email,phone,password } = req.validated.body;
  if (await User.exists({ $or:[{email},{phone}] })) throw new HttpError(409,'Email or phone already registered');
  const user = await User.create({ name,email,phone,passwordHash: await User.hashPassword(password) });
  res.status(201).json({ success:true, token:signToken({sub:user._id.toString(),role:'user'}), account:sanitize(user,'user') });
});

export const registerDriver = asyncHandler(async (req,res) => {
  const { vehicle, password, ...driverData } = req.validated.body;
  if (await Driver.exists({ $or:[{email:driverData.email},{phone:driverData.phone},{licenseNumber:driverData.licenseNumber}] })) throw new HttpError(409,'Driver identity already registered');
  if (await Vehicle.exists({ plateNumber: vehicle.plateNumber.toUpperCase() })) throw new HttpError(409,'Vehicle plate already registered');
  const driver = await Driver.create({ ...driverData, passwordHash: await Driver.hashPassword(password) });
  await Vehicle.create({ ...vehicle, driver: driver._id });
  res.status(201).json({ success:true, token:signToken({sub:driver._id.toString(),role:'driver'}), account:sanitize(driver,'driver') });
});

export const login = asyncHandler(async (req,res) => {
  const { email,password,role } = req.validated.body;
  const Model = role==='user' ? User : role==='driver' ? Driver : Admin;
  const account = await Model.findOne({email}).select('+passwordHash');
  if (!account || !(await account.comparePassword(password))) throw new HttpError(401,'Invalid credentials');
  if (account.isActive === false) throw new HttpError(403,'Account disabled');
  res.json({ success:true, token:signToken({sub:account._id.toString(),role}), account:sanitize(account,role) });
});

export const me = asyncHandler(async (req,res) => res.json({ success:true, account:sanitize(req.auth.principal,req.auth.role) }));
