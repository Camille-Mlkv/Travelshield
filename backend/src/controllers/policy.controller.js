import { PrismaClient, PolicyStatus } from '@prisma/client';
import { ethers } from 'ethers';
import blockchainService from '../services/blockchain.service.js';

const prisma = new PrismaClient();

class PoliciesController {
  // Создание полиса в статусе DRAFT
  async createPolicy(req, res) {
    try {
      const {
        userId,
        walletId,
        insuranceModuleId,
        startDate,
        endDate,
        coverageAmount,
        premiumAmount,
        currency,
        policyData
      } = req.body;

      // Проверяем существование модуля
      const module = await prisma.insuranceModule.findUnique({
        where: { id: insuranceModuleId },
      });

      if (!module) {
        return res.status(404).json({ error: 'Insurance module not found' });
      }

      // Проверяем лимиты модуля
      if (coverageAmount < module.minCoverage || coverageAmount > module.maxCoverage) {
        return res.status(400).json({ 
          error: `Coverage amount must be between ${module.minCoverage} and ${module.maxCoverage}` 
        });
      }

      // Проверяем длительность
      const durationDays = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (durationDays < module.minDuration || durationDays > module.maxDuration) {
        return res.status(400).json({ 
          error: `Policy duration must be between ${module.minDuration} and ${module.maxDuration} days` 
        });
      }

      // Создаем полис
      const policy = await prisma.policy.create({
        data: {
          userId,
          walletId,
          insuranceModuleId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          coverageAmount,
          premiumAmount,
          currency,
          policyData: policyData || {},
          status: 'DRAFT'
        },
        include: {
          insuranceModule: true,
          wallet: true
        }
      });

      // Вычисляем хэш данных полиса
      const policyDataHash = blockchainService.computePolicyDataHash(policy);

      // Обновляем полис с хэшем
      const updatedPolicy = await prisma.policy.update({
        where: { id: policy.id },
        data: { policyDataHash }
      });

      res.status(201).json({
        message: 'Policy created as draft',
        policyId: policy.id,
        policyDataHash,
        status: policy.status
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Оплата полиса и вызов buyPolicy в контракте
  async payPolicy(req, res) {
    try {
      const { policyId, tokenAddress } = req.body;
      
      const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: { 
          wallet: true,
          insuranceModule: true 
        }
      });

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      if (policy.status !== 'DRAFT') {
        return res.status(400).json({ error: 'Policy is not in DRAFT status' });
      }

      if (!policy.policyDataHash) {
        return res.status(400).json({ error: 'Policy data hash not found' });
      }

      // Проверяем, разрешен ли токен
      const isTokenAllowed = await blockchainService.isTokenAllowed(tokenAddress);
      if (!isTokenAllowed) {
        return res.status(400).json({ error: 'Token is not allowed for payments' });
      }

      // Конвертируем даты в timestamp
      const startDateTimestamp = Math.floor(new Date(policy.startDate).getTime() / 1000);
      const endDateTimestamp = Math.floor(new Date(policy.endDate).getTime() / 1000);

      // Вызываем buyPolicy в контракте
      const { txHash, policyId: chainPolicyId } = await blockchainService.buyPolicy(
        tokenAddress,
        policy.premiumAmount,
        startDateTimestamp,
        endDateTimestamp,
        policy.policyDataHash
      );

      // Обновляем полис
      const updatedPolicy = await prisma.policy.update({
        where: { id: policyId },
        data: {
          status: 'AWAITING_ONCHAIN',
          tokenAddress,
          onchainTxHash: txHash,
          ...(chainPolicyId && { chainPolicyId })
        }
      });

      res.status(200).json({
        message: 'Payment initiated successfully',
        txHash,
        chainPolicyId: chainPolicyId?.toString(),
        status: updatedPolicy.status,
        policyDataHash: policy.policyDataHash
      });
    } catch (error) {
      console.error('Payment error:', error);
      
      // Обновляем статус полиса в случае ошибки
      await prisma.policy.update({
        where: { id: req.body.policyId },
        data: { status: 'DRAFT' } // Возвращаем в DRAFT при ошибке
      });

      res.status(500).json({ 
        error: error.message || 'Failed to process payment' 
      });
    }
  }

  // Получение списка полисов пользователя
  async getUserPolicies(req, res) {
    try {
      const userId = req.params.userId;
      
      const policies = await prisma.policy.findMany({
        where: { userId },
        include: {
          insuranceModule: true,
          wallet: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Добавляем данные из блокчейна для полисов, которые есть в контракте
      const policiesWithChainData = await Promise.all(
        policies.map(async (policy) => {
          let onChainData = null;
          
          if (policy.chainPolicyId) {
            try {
              onChainData = await blockchainService.getPolicy(policy.chainPolicyId);
            } catch (error) {
              console.error('Failed to fetch on-chain data for policy', policy.id);
            }
          }

          return {
            ...policy,
            onChainData
          };
        })
      );

      res.status(200).json(policiesWithChainData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получение деталей полиса
  async getPolicyDetails(req, res) {
    try {
      const { id } = req.params;
      
      const policy = await prisma.policy.findUnique({
        where: { id },
        include: {
          insuranceModule: true,
          wallet: true,
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      // Получаем данные из блокчейна, если есть chainPolicyId
      let onChainData = null;
      if (policy.chainPolicyId) {
        try {
          onChainData = await blockchainService.getPolicy(policy.chainPolicyId);
        } catch (error) {
          console.error('Failed to fetch on-chain data:', error);
        }
      }

      // Получаем общее количество полисов в контракте
      let totalPolicies = null;
      try {
        totalPolicies = await blockchainService.getPolicyCount();
      } catch (error) {
        console.error('Failed to fetch total policies:', error);
      }

      res.status(200).json({
        ...policy,
        onChainData,
        blockchainStats: {
          totalPolicies: totalPolicies?.toString(),
          isOnChain: !!policy.chainPolicyId
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получение хэша данных полиса
  async getPolicyHash(req, res) {
    try {
      const { id } = req.params;
      
      const policy = await prisma.policy.findUnique({
        where: { id },
        include: { wallet: true }
      });

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      const policyDataHash = blockchainService.computePolicyDataHash(policy);

      res.status(200).json({
        policyId: policy.id,
        policyDataHash,
        originalHash: policy.policyDataHash
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new PoliciesController();