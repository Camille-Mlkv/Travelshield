import { Router } from 'express';
import oracleController from '../controllers/oracle.controller.js';

const router = Router();

// Все эндпоинты публичные (для упрощения)
// В продакшене можно добавить базовую аутентификацию или rate limiting

// // Health check
// router.get('/health', OracleController.healthCheck);

// // Статистика
// router.get('/stats', OracleController.getOracleStats);

// Получение всех полисов
router.get('/policies', oracleController.getAllPolicies);

// Получение активных полисов (для оракула)
router.get('/policies/active', oracleController.getActivePolicies);

// Получение деталей конкретного полиса
router.get('/policies/:policyId', oracleController.getPolicyDetails);

export default router;