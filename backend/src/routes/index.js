import express from 'express'
import authRoutes from './auth.routes.js';
import walletRoutes from './wallet.routes.js';
import moduleRoutes from './module.routes.js'

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TravelShield API',
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/wallets', walletRoutes);
router.use('/modules', moduleRoutes);


// TODO: Добавить другие маршруты
// router.use('/policies', policyRoutes);


export default router;