import { BlockchainService } from '../services/blockchain.service';
import { PrismaClient, PolicyStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import blockchainService from '../services/blockchain.service';

const prisma = new PrismaClient();

class BlockchainListener {
  start() {
    logger.info('Starting blockchain listener...');
    
    const unsubscribe = blockchainService.listenToEvents(async (event) => {
      logger.info(`Received blockchain event: ${event.event}`);

      try {
        switch (event.event) {
          case 'PolicyCreated':
            await this.handlePolicyCreated(event);
            break;
            
          case 'ClaimPaid':
            await this.handleClaimPaid(event);
            break;
        }
      } catch (error) {
        logger.error(`Error processing blockchain event ${event.event}:`, error);
      }
    });

    process.on('SIGINT', () => {
      unsubscribe();
      logger.info('Blockchain listener stopped');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      unsubscribe();
      logger.info('Blockchain listener stopped');
      process.exit(0);
    });

    logger.info('Blockchain listener started successfully');
  }

  async handlePolicyCreated(event) {
    try {
      const { policyId, policyDataHash, transactionHash, token } = event;
      
      logger.info(`Processing PolicyCreated: policyId=${policyId}, hash=${policyDataHash}`);
      
      const policy = await prisma.policy.findFirst({
        where: {
          policyDataHash: policyDataHash
        }
      });

      if (policy) {
        await prisma.policy.update({
          where: { id: policy.id },
          data: {
            status: 'ACTIVE',
            chainPolicyId: policyId,
            tokenAddress: token,
            onchainTxHash: transactionHash
          }
        });
        
        logger.info(`Policy ${policy.id} marked as ACTIVE with chainPolicyId: ${policyId}`);
      } else {
        logger.warn(`No policy found for hash: ${policyDataHash}`);
      }
    } catch (error) {
      logger.error('Error handling PolicyCreated event:', error);
    }
  }

  async handleClaimPaid(event) {
    try {
      const { claimId, policyId, user, amount, token, eventType, transactionHash } = event;
      
      logger.info(`Processing ClaimPaid: claimId=${claimId}, policyId=${policyId}`);
      
      const policy = await prisma.policy.findFirst({
        where: {
          chainPolicyId: policyId
        }
      });

      if (policy) {
        await prisma.policy.update({
          where: { id: policy.id },
          data: {
            status: 'CLAIMED',
            claimTxHash: transactionHash
          }
        });

        await prisma.claim.upsert({
          where: {
            chainClaimId: claimId
          },
          create: {
            policyId: policy.id,
            chainPolicyId: policyId,
            chainClaimId: claimId,
            payoutAmount: parseFloat(amount),
            eventType,
            txHash: transactionHash,
            paid: true
          },
          update: {
            paid: true,
            txHash: transactionHash,
            payoutAmount: parseFloat(amount)
          }
        });
        
        logger.info(`Policy ${policy.id} marked as CLAIMED. Claim ${claimId} processed.`);
      } else {
        logger.warn(`No policy found for chainPolicyId: ${policyId}`);
        
        await prisma.claim.create({
          data: {
            chainPolicyId: policyId,
            chainClaimId: claimId,
            payoutAmount: parseFloat(amount),
            eventType,
            txHash: transactionHash,
            paid: true,
            metadata: {
              userAddress: user,
              token: token
            }
          }
        });
      }
    } catch (error) {
      logger.error('Error handling ClaimPaid event:', error);
    }
  }
}

export default new BlockchainListener();