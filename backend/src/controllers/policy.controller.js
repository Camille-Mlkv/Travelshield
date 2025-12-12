import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import blockchainService from '../services/blockchain.service.js';

const prisma = new PrismaClient();

class PoliciesController {
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

      console.log('Creating policy for user:', userId);

      // Находим кошелек пользователя
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        return res.status(404).json({ 
          success: false,
          error: 'Wallet not found' 
        });
      }

      const policy = await prisma.policy.create({
        data: {
          userId,
          walletId,
          insuranceModuleId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          coverageAmount: parseFloat(coverageAmount),
          premiumAmount: parseFloat(premiumAmount),
          currency: currency || 'USDC',
          policyData: policyData || {},
          status: 'DRAFT'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Policy created as draft',
        policyId: policy.id,
        status: policy.status,
        userWallet: wallet.address
      });
    } catch (error) {
      console.error('Create policy error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create policy' 
      });
    }
  }

  async payPolicy(req, res) {
    try {
      const { policyId, tokenAddress } = req.body;
      
      console.log('Pay policy request:', { policyId, tokenAddress });

      // Находим полис
      const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: { wallet: true }
      });

      if (!policy) {
        return res.status(404).json({ 
          success: false,
          error: 'Policy not found' 
        });
      }

      if (policy.status !== 'DRAFT') {
        return res.status(400).json({ 
          success: false,
          error: `Policy is not in DRAFT status (current: ${policy.status})` 
        });
      }

      const userAddress = policy.wallet.address;
      console.log('User wallet address:', userAddress);

      // Обновляем статус
      await prisma.policy.update({
        where: { id: policyId },
        data: { 
          status: 'AWAITING_ONCHAIN',
          tokenAddress 
        }
      });

      // Вычисляем хэш
      const policyDataHash = blockchainService.computePolicyDataHash(policy);
      
      // Даты в timestamp
      const startTimestamp = Math.floor(new Date(policy.startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(policy.endDate).getTime() / 1000);

      // Пробуем купить полис
      const { txHash, policyId: chainPolicyId } = await blockchainService.buyPolicy(
        tokenAddress,
        policy.premiumAmount,
        startTimestamp,
        endTimestamp,
        policyDataHash,
        userAddress
      );

      // Обновляем полис
      const updatedPolicy = await prisma.policy.update({
        where: { id: policyId },
        data: {
          onchainTxHash: txHash,
          policyDataHash,
          ...(chainPolicyId && { chainPolicyId }),
          status: chainPolicyId ? 'ACTIVE' : 'AWAITING_ONCHAIN'
        }
      });

      res.status(200).json({
        success: true,
        message: chainPolicyId ? 'Policy purchased successfully' : 'Payment in progress',
        txHash,
        chainPolicyId: chainPolicyId?.toString(),
        status: updatedPolicy.status
      });
    } catch (error) {
      console.error('Pay policy error:', error);
      
      // Возвращаем в DRAFT при ошибке
      await prisma.policy.update({
        where: { id: req.body.policyId },
        data: { status: 'DRAFT' }
      });

      res.status(500).json({
        success: false,
        error: error.message,
        // userMessage: this.getUserFriendlyError(error.message)
      });
    }
  };

  // Вспомогательный метод для понятных сообщений об ошибках
  getUserFriendlyError(errorMessage) {
    if (errorMessage.includes('Token approval required')) {
      return 'Please approve the contract to spend your tokens first. Go to your wallet and approve the transaction.';
    } else if (errorMessage.includes('Insufficient token balance')) {
      return 'Insufficient token balance. Please add more tokens to your wallet.';
    } else if (errorMessage.includes('Token not allowed')) {
      return 'This token is not accepted for payments.';
    } else if (errorMessage.includes('Not approved')) {
      return 'Token approval required. Please approve the contract first.';
    }
    return 'Payment failed. Please try again.';
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