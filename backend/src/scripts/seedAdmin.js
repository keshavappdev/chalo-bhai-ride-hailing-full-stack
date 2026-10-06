import { connectDb } from '../config/db.js';
import Admin from '../models/Admin.js';

await connectDb();
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 10) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ chars) in backend/.env before seeding an admin.');
}
let admin = await Admin.findOne({ email });
if (!admin) {
  admin = await Admin.create({ email, name: 'Chalo Bhai Admin', passwordHash: await Admin.hashPassword(password) });
  console.log('Admin created:', email);
} else {
  console.log('Admin already exists:', email);
}
process.exit(0);
