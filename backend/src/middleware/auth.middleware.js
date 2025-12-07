import { JWTUtil } from '../utils/jwt.js';
import userRepository from '../repositories/user.repository.js';

export const authMiddleware = {
  authenticate: async (req, res, next) => {
    try {
      const token = JWTUtil.extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Токен не предоставлен',
        });
      }

      const decoded = JWTUtil.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: 'Недействительный токен',
        });
      }

      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Пользователь не найден',
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Ошибка аутентификации',
      });
    }
  },

  /**
   * Optional authentication (для публичных маршрутов)
   */
  optionalAuth: async (req, res, next) => {
    try {
      const token = JWTUtil.extractToken(req.headers.authorization);
      
      if (token) {
        const decoded = JWTUtil.verifyToken(token);
        if (decoded) {
          const user = await userRepository.findById(decoded.userId);
          if (user) {
            req.user = {
              id: user.id,
              email: user.email,
            };
          }
        }
      }
      
      next();
    } catch (error) {
      // Игнорируем ошибки для optional аутентификации
      next();
    }
  },
};