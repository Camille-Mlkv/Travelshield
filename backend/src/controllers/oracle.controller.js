import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class OracleController {
  // Публичный эндпоинт для получения активных полисов
  async getActivePolicies(req, res) {
    try {
      const now = new Date();
      
      // Получаем активные полисы
      const activePolicies = await prisma.policy.findMany({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
          chainPolicyId: { not: null }
        },
        include: {
          insuranceModule: true,
          wallet: true
        }
      });

      // Форматируем данные для оракула
      const policiesForOracle = activePolicies.map(policy => ({
        chainPolicyId: policy.chainPolicyId.toString(),
        userAddress: policy.wallet.address,
        moduleType: policy.insuranceModule.coverageType,
        startDate: policy.startDate.toISOString(),
        endDate: policy.endDate.toISOString(),
        // Добавляем данные из policyData для более точной проверки
        flightNumber: (policy.policyData)?.flightNumber || null,
        baggageReference: (policy.policyData)?.baggageReference || null,
        bookingReference: (policy.policyData)?.bookingReference || null,
        // Расчетные данные для оракула
        maxPayout: policy.coverageAmount,
        premiumPaid: policy.premiumAmount
      }));

      res.status(200).json({
        success: true,
        count: policiesForOracle.length,
        policies: policiesForOracle,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching active policies:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  // Публичный эндпоинт для получения всех полисов (включая завершенные)
  async getAllPolicies(req, res) {
    try {
      const policies = await prisma.policy.findMany({
        include: {
          insuranceModule: true,
          wallet: true,
          claims: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100 // Ограничиваем количество для производительности
      });

      res.status(200).json({
        success: true,
        count: policies.length,
        policies: policies.map(policy => ({
          id: policy.id,
          chainPolicyId: policy.chainPolicyId?.toString(),
          userAddress: policy.wallet.address,
          status: policy.status,
          moduleType: policy.insuranceModule.coverageType,
          startDate: policy.startDate,
          endDate: policy.endDate,
          coverageAmount: policy.coverageAmount,
          premiumAmount: policy.premiumAmount,
          claimsCount: policy.claims.length,
          createdAt: policy.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching all policies:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  // Публичный эндпоинт для получения деталей конкретного полиса
  async getPolicyDetails(req, res) {
    try {
      const { policyId } = req.params;
      
      // Ищем по chainPolicyId или внутреннему ID
      const policy = await prisma.policy.findFirst({
        where: {
          OR: [
            { chainPolicyId: BigInt(policyId) },
            { id: policyId }
          ]
        },
        include: {
          insuranceModule: true,
          wallet: true,
          claims: {
            orderBy: { createdAt: 'desc' }
          },
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      if (!policy) {
        return res.status(404).json({ 
          success: false,
          error: 'Policy not found' 
        });
      }

      res.status(200).json({
        success: true,
        policy: {
          id: policy.id,
          chainPolicyId: policy.chainPolicyId?.toString(),
          userAddress: policy.wallet.address,
          userEmail: policy.user.email,
          status: policy.status,
          moduleType: policy.insuranceModule.coverageType,
          moduleName: policy.insuranceModule.name,
          startDate: policy.startDate,
          endDate: policy.endDate,
          coverageAmount: policy.coverageAmount,
          premiumAmount: policy.premiumAmount,
          policyData: policy.policyData,
          tokenAddress: policy.tokenAddress,
          onchainTxHash: policy.onchainTxHash,
          claims: policy.claims.map(claim => ({
            id: claim.id,
            chainClaimId: claim.chainClaimId?.toString(),
            payoutAmount: claim.payoutAmount,
            eventType: claim.eventType,
            paid: claim.paid,
            txHash: claim.txHash,
            createdAt: claim.createdAt
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching policy details:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

//   // Публичный эндпоинт для получения статистики
//   async getOracleStats(req, res) {
//     try {
//       // Используем raw query для статистики
//       const stats = await prisma.$queryRaw`
//         SELECT 
//           COUNT(*) as total_policies,
//           COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_policies,
//           COUNT(CASE WHEN status = 'CLAIMED' THEN 1 END) as claimed_policies,
//           COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_policies,
//           COUNT(DISTINCT user_id) as unique_users,
//           COALESCE(SUM(coverage_amount), 0) as total_coverage,
//           COALESCE(SUM(premium_amount), 0) as total_premium,
//           COUNT(DISTINCT chain_policy_id) as onchain_policies
//         FROM policies
//       `;

//       // Последние выплаты
//       const recentClaims = await prisma.claim.findMany({
//         where: {
//           paid: true
//         },
//         orderBy: { createdAt: 'desc' },
//         take: 10,
//         include: {
//           policy: {
//             include: {
//               insuranceModule: true
//             }
//           }
//         }
//       });

//       res.status(200).json({
//         success: true,
//         stats: stats[0],
//         recentClaims: recentClaims.map(claim => ({
//           id: claim.id,
//           policyId: claim.policyId,
//           chainPolicyId: claim.chainPolicyId?.toString(),
//           chainClaimId: claim.chainClaimId?.toString(),
//           moduleType: claim.policy.insuranceModule.coverageType,
//           payoutAmount: claim.payoutAmount,
//           eventType: claim.eventType,
//           createdAt: claim.createdAt
//         })),
//         timestamp: new Date().toISOString()
//       });
//     } catch (error) {
//       console.error('Error fetching oracle stats:', error);
//       res.status(500).json({ 
//         success: false,
//         error: 'Internal server error' 
//       });
//     }
//   }

//   // Публичный эндпоинт для проверки здоровья
//   static async healthCheck(req: Request, res: Response) {
//     try {
//       // Проверяем подключение к базе
//       await prisma.$queryRaw`SELECT 1`;
      
//       res.status(200).json({
//         success: true,
//         status: 'healthy',
//         timestamp: new Date().toISOString(),
//         services: {
//           database: 'connected',
//           api: 'running'
//         }
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         status: 'unhealthy',
//         error: 'Database connection failed',
//         timestamp: new Date().toISOString()
//       });
//     }
//   }
}

export default new OracleController();