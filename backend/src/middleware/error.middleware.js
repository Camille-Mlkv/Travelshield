export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Блокчейн ошибки
  if (err.code === 'CALL_EXCEPTION') {
    return res.status(400).json({
      error: 'Blockchain transaction failed',
      reason: err.reason
    });
  }
  
  // Prisma ошибки
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Duplicate entry',
      field: err.meta?.target?.[0]
    });
  }
  
  // JWT ошибки
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Валидация
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.details 
    });
  }
  
  // По умолчанию
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};