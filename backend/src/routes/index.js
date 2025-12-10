import express from 'express'
import authRoutes from './auth.routes.js';
import walletRoutes from './wallet.routes.js';
import moduleRoutes from './module.routes.js';
import oracleRoutes from './oracle.routes.js';
import policyRoutes from './policy.routes.js';

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
router.use('/oracle', oracleRoutes);
router.use('/policy', policyRoutes)


export default router;