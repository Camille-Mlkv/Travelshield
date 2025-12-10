import express from 'express'
import authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { authValidator } from '../validators/auth.validator.js';

const router = express.Router();
router.post(
  '/signup',
  validate(authValidator.register),
  authController.register
);

router.post(
  '/signin',
  validate(authValidator.login),
  authController.login
);

// router.get(
//   '/verify',
//   authMiddleware.authenticate,
//   authController.verifyToken
// );

// Защищенные маршруты
router.get(
  '/profile',
  authMiddleware.authenticate,
  authController.getProfile
);

router.post(
  '/logout',
  authMiddleware.authenticate,
  authController.logout
);

export default router;
