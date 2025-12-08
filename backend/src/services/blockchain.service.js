import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    const abi = [
      // Функции
      "function buyPolicy(address token, uint256 amount, uint256 startDate, uint256 endDate, bytes32 policyDataHash) external returns (uint256)",
      "function policies(uint256) view returns (address user, uint256 premiumPaid, uint256 startDate, uint256 endDate, bytes32 policyDataHash, uint256 createdAt, address token)",
      "function claims(uint256) view returns (uint256 policyId, uint256 payoutAmount, bool paid, uint256 createdAt)",
      "function policyCount() view returns (uint256)",
      "function claimCount() view returns (uint256)",
      "function allowedTokens(address) view returns (bool)",
      "function allowedOracles(address) view returns (bool)",
      "function owner() view returns (address)",
      "function addAllowedToken(address token) external",
      "function addOracle(address oracle) external",
      "function withdraw(address token, uint256 amount) external",
      "function markEventOccurred(uint256 policyId, string calldata eventType, uint256 payoutAmount) external",
      
      // События
      "event PolicyCreated(uint256 indexed policyId, address indexed user, uint256 premiumPaid, uint256 startDate, uint256 endDate, bytes32 policyDataHash, address token)",
      "event ClaimPaid(uint256 indexed claimId, uint256 indexed policyId, address indexed user, uint256 amount, address token, string eventType)",
      "event OracleAdded(address oracle)"
    ];
    
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      this.wallet
    );
  }

  computePolicyDataHash(policy) {
    const dataToHash = {
      offchainId: policy.id,
      userId: policy.userId,
      walletId: policy.walletId,
      moduleId: policy.insuranceModuleId,
      coverageAmount: policy.coverageAmount,
      premiumAmount: policy.premiumAmount,
      startDate: Math.floor(new Date(policy.startDate).getTime() / 1000),
      endDate: Math.floor(new Date(policy.endDate).getTime() / 1000),
      currency: policy.currency,
      createdAt: Math.floor(new Date(policy.createdAt).getTime() / 1000)
    };

    const encodedData = ethers.utils.defaultAbiCoder.encode(
      [
        'string',  'string',  'string',  'string',
        'uint256', 'uint256', 'uint256', 'uint256',
        'string',  'uint256'
      ],
      [
        dataToHash.offchainId,
        dataToHash.userId,
        dataToHash.walletId,
        dataToHash.moduleId,
        ethers.utils.parseUnits(dataToHash.coverageAmount.toString(), 6),
        ethers.utils.parseUnits(dataToHash.premiumAmount.toString(), 6),
        dataToHash.startDate,
        dataToHash.endDate,
        dataToHash.currency,
        dataToHash.createdAt
      ]
    );

    return ethers.utils.keccak256(encodedData);
  }

  async buyPolicy(
    tokenAddress,
    amount,
    startDate,
    endDate,
    policyDataHash
  ){
    try {
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 6);

      const isTokenAllowed = await this.contract.allowedTokens(tokenAddress);
      if (!isTokenAllowed) {
        throw new Error(`Token ${tokenAddress} is not allowed`);
      }

      const tx = await this.contract.buyPolicy(
        tokenAddress,
        amountInWei,
        startDate,
        endDate,
        policyDataHash,
        { gasLimit: 500000 }
      );
      
      const receipt = await tx.wait();
      const event = receipt.events?.find((e) => e.event === 'PolicyCreated');
      const policyId = event?.args?.policyId;
      
      logger.info(`Policy purchased on chain. Tx: ${tx.hash}, PolicyId: ${policyId?.toString()}`);
      
      return { 
        txHash: tx.hash, 
        policyId: policyId ? policyId.toBigInt() : undefined 
      };
    } catch (error) {
      logger.error('Error buying policy on chain:', error);
      throw error;
    }
  }

  async getPolicy(policyId) {
    try {
      const policyData = await this.contract.policies(policyId);
      
      return {
        user: policyData.user,
        premiumPaid: ethers.utils.formatUnits(policyData.premiumPaid, 6),
        startDate: new Date(policyData.startDate.toNumber() * 1000),
        endDate: new Date(policyData.endDate.toNumber() * 1000),
        policyDataHash: policyData.policyDataHash,
        token: policyData.token,
        createdAt: new Date(policyData.createdAt.toNumber() * 1000),
        isActive: new Date(policyData.endDate.toNumber() * 1000) > new Date()
      };
    } catch (error) {
      logger.error('Error fetching policy from chain:', error);
      throw error;
    }
  }

  async getClaim(claimId) {
    try {
      const claimData = await this.contract.claims(claimId);
      
      return {
        policyId: claimData.policyId.toBigInt(),
        payoutAmount: ethers.utils.formatUnits(claimData.payoutAmount, 6),
        paid: claimData.paid,
        createdAt: new Date(claimData.createdAt.toNumber() * 1000)
      };
    } catch (error) {
      logger.error('Error fetching claim from chain:', error);
      throw error;
    }
  }

  listenToEvents(callback) {
    this.contract.on('PolicyCreated', 
      (policyId, user, premiumPaid, startDate, endDate, policyDataHash, token, event) => {
        callback({
          event: 'PolicyCreated',
          policyId: policyId.toBigInt(),
          user,
          premiumPaid: ethers.utils.formatUnits(premiumPaid, 6),
          startDate: new Date(startDate.toNumber() * 1000),
          endDate: new Date(endDate.toNumber() * 1000),
          policyDataHash,
          token,
          transactionHash: event.transactionHash
        });
      }
    );

    this.contract.on('ClaimPaid', 
      (claimId, policyId, user, amount, token, eventType, event) => {
        callback({
          event: 'ClaimPaid',
          claimId: claimId.toBigInt(),
          policyId: policyId.toBigInt(),
          user,
          amount: ethers.utils.formatUnits(amount, 6),
          token,
          eventType,
          transactionHash: event.transactionHash
        });
      }
    );

    return () => {
      this.contract.removeAllListeners('PolicyCreated');
      this.contract.removeAllListeners('ClaimPaid');
    };
  }
}

export default new BlockchainService();
