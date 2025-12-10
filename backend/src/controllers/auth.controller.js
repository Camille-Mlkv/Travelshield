import authService from "../services/auth.service.js";

class AuthController {

  async register(req, res, next) {
    try {
      const { email, password, name, walletAddress } = req.body;

      const result = await authService.register({
        email,
        password,
        name,
        walletAddress,
      });

      res.status(201).json({
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.json({
        success: true,
        message: 'Успешный вход в систему',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await authService.getProfile(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      await authService.logout(token);

      res.json({
        success: true,
        message: 'Успешный выход из системы',
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req, res, next) {
    try {
      // Если middleware прошел, значит токен валидный
      res.json({
        success: true,
        message: 'Токен действителен',
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

const authController = new AuthController();
export default authController;
