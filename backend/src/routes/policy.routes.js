import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import policyController from '../controllers/policy.controller.js';

const router = Router();

// Создание полиса
router.post('/', authMiddleware.authenticate, policyController.createPolicy);

// Оплата полиса
router.post('/pay', authMiddleware.authenticate, policyController.payPolicy);

// Получение хэша полиса
router.get('/:id/hash', authMiddleware.authenticate, policyController.getPolicyHash);

// Получение списка полисов пользователя
router.get('/user/:userId', authMiddleware.authenticate, policyController.getUserPolicies);

// Получение деталей полиса
router.get('/:id', authMiddleware.authenticate, policyController.getPolicyDetails);

export default router;