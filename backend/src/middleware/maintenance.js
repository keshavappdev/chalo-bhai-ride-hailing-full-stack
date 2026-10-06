import { getSetting } from '../services/settingsService.js';
import { verifyToken } from '../utils/jwt.js';

let cache = { at: 0, enabled: false, supportPhone: '' };

async function state() {
  if (Date.now() - cache.at < 5000) return cache;
  const [enabled, supportPhone] = await Promise.all([
    getSetting('maintenanceMode', false),
    getSetting('supportPhone', '')
  ]);
  cache = { at: Date.now(), enabled: Boolean(enabled), supportPhone: String(supportPhone || '') };
  return cache;
}

export async function maintenanceGuard(req, res, next) {
  try {
    const current = await state();
    if (!current.enabled) return next();

    // Admin login must remain possible during maintenance.
    if (req.path === '/api/auth/login' && req.body?.role === 'admin') return next();

    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      try {
        const payload = verifyToken(header.slice(7));
        if (payload.role === 'admin') return next();
      } catch (_) {}
    }

    return res.status(503).json({
      success: false,
      message: 'Service is temporarily in maintenance mode',
      supportPhone: current.supportPhone || undefined
    });
  } catch (err) {
    next(err);
  }
}
