import jwt from 'jsonwebtoken';
import 'dotenv/config'

export class JWTUtil {
  static generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }

  static generateRefreshToken(user) {
    const payload = {
      userId: user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  }
}