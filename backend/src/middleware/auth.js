import { verifyToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Admin from '../models/Admin.js';

const models = { user: User, driver: Driver, admin: Admin };
export async function auth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Authentication required');
    const payload = verifyToken(token);
    const Model = models[payload.role];
    if (!Model) throw new HttpError(401, 'Invalid authentication role');
    const principal = await Model.findById(payload.sub);
    if (!principal || principal.isActive === false) throw new HttpError(401, 'Account unavailable');
    req.auth = { id: principal._id.toString(), role: payload.role, principal };
    next();
  } catch (err) { next(err.status ? err : new HttpError(401, 'Invalid or expired token')); }
}

export const allow = (...roles) => (req, _res, next) => roles.includes(req.auth?.role) ? next() : next(new HttpError(403, 'Forbidden'));
