import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token on protected routes.
 * Constraint: All routes except /api/auth/login must use the verifyToken middleware.
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. No token provided or invalid format.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token.'
    });
  }
};

/**
 * Middleware to restrict route access by role(s).
 * @param  {...string} roles Allowed roles ('admin', 'manager', 'loan_officer', 'cashier')
 */
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Unauthorized: User authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access requires one of the following roles: [${roles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
};

export default {
  verifyToken,
  allowRoles,
};
