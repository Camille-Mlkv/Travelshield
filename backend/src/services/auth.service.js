import * as bcrypt from 'bcrypt';
import { JWTUtil } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';
import userRepository from '../repositories/user.repository.js';

const prisma = new PrismaClient();

class AuthService {
  async register(userData) {
    try {
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Пользователь с таким email уже существует');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      const user = await userRepository.create({
        email: userData.email,
        name: userData.name,
        password_hash: passwordHash,
      });

      if (userData.walletAddress) {
        await prisma.wallet.create({
          data: {
            address: userData.walletAddress,
            label: 'Основной кошелек',
            verified: false,
            user_id: user.id,
          },
        });
      }

      const token = JWTUtil.generateToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Неверный email или пароль');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Неверный email или пароль');
      }

      const token = JWTUtil.generateToken(user);
      const userInfo = await userRepository.findById(user.id);

      return {
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          wallets: userInfo.wallets,
          created_at: userInfo.created_at,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async logout(token) {
    return true;
  }

//   async changePassword(userId, currentPassword, newPassword) {
//     try {
//       const user = await userRepository.findByEmail(userId);
//       if (!user) {
//         throw new Error('Пользователь не найден');
//       }

//       const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
//       if (!isValidPassword) {
//         throw new Error('Неверный текущий пароль');
//       }

//       // Хешируем новый пароль
//       const salt = await bcrypt.genSalt(10);
//       const newPasswordHash = await bcrypt.hash(newPassword, salt);

//       // Обновляем пароль
//       await userRepository.update(user.id, {
//         password_hash: newPasswordHash,
//       });

//       return true;
//     } catch (error) {
//       throw error;
//     }
//   }
}

const authService = new AuthService();
export default authService;
