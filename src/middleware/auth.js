export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader === 'Invalid token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}