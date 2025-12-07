// src/routes/wallet.routes.js
import express from 'express';
import walletController from '../controllers/wallet.controller.js';
import walletValidator from '../validators/wallet.validator.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);
router.get(
  '/',
  walletController.getWallets
);

router.post(
  '/check-address',
  validate(walletValidator.checkAddress),
  walletController.checkAddress
);

router.post(
  '/',
  validate(walletValidator.addWallet),
  walletController.addWallet
);

// // Получение статистики
// router.get(
//   '/stats',
//   walletController.getWalletStats
// );

// // Маршруты для конкретного кошелька
// router.get(
//   '/:id',
//   walletController.getWallet
// );

// router.put(
//   '/:id',
//   validate(walletValidator.updateWallet),
//   walletController.updateWallet
// );

// router.delete(
//   '/:id',
//   walletController.deleteWallet
// );

// Верификация кошелька
router.get(
  '/:id/sign-message',
  walletController.getSignMessage
);

// router.post(
//   '/:id/verify',
//   validate(walletValidator.verifyWallet),
//   walletController.verifyWallet
// );

export default router;