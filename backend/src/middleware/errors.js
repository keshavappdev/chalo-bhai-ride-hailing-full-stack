export function notFound(req, _res, next) { const e = new Error(`Route not found: ${req.method} ${req.originalUrl}`); e.status = 404; next(e); }
export function errorHandler(err, _req, res, _next) {
  const status = err.status || (err.name === 'ValidationError' ? 422 : 500);
  if (process.env.NODE_ENV !== 'test') console.error(err);
  res.status(status).json({ success: false, message: err.message || 'Server error', details: err.details || undefined });
}
