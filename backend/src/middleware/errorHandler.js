/**
 * Global error handling middleware for Express.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // Handle PostgreSQL specific errors
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Conflict: A record with this unique value already exists.',
      detail: err.detail
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Foreign key violation: Referenced record does not exist.',
      detail: err.detail
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
