import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { NonceManager } from 'ethers';

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider); // funding wallet

    this.erc20Abi = [
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function name() view returns (string)",
      "function nonces(address owner) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ];

    this.insuranceAbi = [
      "function buyPolicy(address token, uint256 amount, uint256 startDate, uint256 endDate, bytes32 policyDataHash) external returns (uint256)",
      "function policies(uint256) view returns (address user, uint256 premiumPaid, uint256 startDate, uint256 endDate, bytes32 policyDataHash, uint256 createdAt, address token)",
      "function claims(uint256) view returns (uint256 policyId, uint256 payoutAmount, bool paid, uint256 createdAt)",
      "function policyCount() view returns (uint256)",
      "function claimCount() view returns (uint256)",
      "function allowedTokens(address) view returns (bool)",
      "function allowedOracles(address) view returns (bool)",
      "function owner() view returns (address)",
      "event PolicyCreated(uint256 indexed policyId, address indexed user, uint256 premiumPaid, uint256 startDate, uint256 endDate, bytes32 policyDataHash, address token)",
      "event ClaimPaid(uint256 indexed claimId, uint256 indexed policyId, address indexed user, uint256 amount, address token, string eventType)",
      "event OracleAdded(address oracle)"
    ];

    if (!process.env.USDC_ADDRESS || !process.env.USDT_ADDRESS || !process.env.CONTRACT_ADDRESS) {
      console.warn("USDC_ADDRESS, USDT_ADDRESS or CONTRACT_ADDRESS missing in .env. Make sure to set them for this service to work.");
    }

    if (process.env.USDC_ADDRESS) {
      this.usdc = new ethers.Contract(process.env.USDC_ADDRESS, this.erc20Abi, this.wallet);
    }
    if (process.env.USDT_ADDRESS) {
      this.usdt = new ethers.Contract(process.env.USDT_ADDRESS, this.erc20Abi, this.wallet);
    }
    if (process.env.CONTRACT_ADDRESS) {
      this.contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, this.insuranceAbi, this.wallet);
    }
  }

  computePolicyDataHash(policy) {
    try {
      const dataToHash = {
        offchainId: policy.id,
        userId: policy.userId,
        walletId: policy.walletId,
        moduleId: policy.insuranceModuleId,
        coverageAmount: policy.coverageAmount,
        premiumAmount: policy.premiumAmount,
        startDate: Math.floor(new Date(policy.startDate).getTime() / 1000),
        endDate: Math.floor(new Date(policy.endDate).getTime() / 1000),
        currency: policy.currency || 'USDC',
        createdAt: Math.floor(new Date(policy.createdAt).getTime() / 1000)
      };

      console.log('Data to hash:', dataToHash);

      const abiCoder = ethers.AbiCoder.defaultAbiCoder();

      const encodedData = abiCoder.encode(
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
          ethers.parseUnits(dataToHash.coverageAmount.toString(), 6),
          ethers.parseUnits(dataToHash.premiumAmount.toString(), 6),
          dataToHash.startDate,
          dataToHash.endDate,
          dataToHash.currency,
          dataToHash.createdAt
        ]
      );

      const hash = ethers.keccak256(encodedData);
      console.log('Computed hash:', hash);
      return hash;
    } catch (error) {
      console.error('Error computing policy hash:', error);
      throw error;
    }
  }


async buyPolicy(tokenAddress, amountHuman, startDate, endDate, policyDataHash, walletAddress) {
  const insuranceAddress = process.env.CONTRACT_ADDRESS;
  const privateKey = "0x74196a4751e15d4a0137c807a45be441bd6fb3757d167e4dc27f343db2963f56"; // пользовательский!
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet(privateKey, provider);

  const token = new ethers.Contract(tokenAddress, this.erc20Abi, signer);
  const insurance = new ethers.Contract(process.env.CONTRACT_ADDRESS, this.insuranceAbi, signer);

  const decimals = await token.decimals();
  const amount = ethers.parseUnits(amountHuman.toString(), decimals);

  const balance = await token.balanceOf(walletAddress);
  console.log(balance);
  if (balance < amount) throw new Error("Недостаточно токенов на кошельке");

  let nonce = await provider.getTransactionCount(walletAddress, "latest");
  console.log(nonce);

  const allowance = await token.allowance(walletAddress, insuranceAddress);
  if (allowance < amount) {
    const approveTx = await token.approve(insuranceAddress, amount, { nonce });
    console.log("Approve sent, hash:", approveTx.hash, "nonce:", nonce);
    await approveTx.wait();
    console.log("Approve confirmed");
    nonce++; 
  }

  const buyTx = await insurance.buyPolicy(
    tokenAddress,
    amount,
    BigInt(startDate),
    BigInt(endDate),
    policyDataHash,
    { nonce }
  );
  console.log("buyPolicy sent, hash:", buyTx.hash, "nonce:", nonce);

  const receipt = await buyTx.wait();

  let policyId;
    for (const log of receipt.logs) {
      try {
        const parsedLog = this.contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'PolicyCreated') {
          policyId = parsedLog.args.policyId;
          console.log('Found PolicyCreated event, policyId:', policyId.toString());
          break;
        }
      } catch (e) {
      }
  }

  logger.info(`Policy purchased on chain. Tx: ${buyTx.hash}, PolicyId: ${policyId?.toString()}`);

  return { 
    txHash: buyTx.hash, 
    policyId: policyId ? BigInt(policyId) : undefined 
  };
}


  async getPolicy(policyId) {
    try {
      const policyData = await this.contract.policies(policyId);

      return {
        user: policyData.user,
        premiumPaid: ethers.formatUnits(policyData.premiumPaid, 6),
        startDate: new Date(Number(policyData.startDate) * 1000),
        endDate: new Date(Number(policyData.endDate) * 1000),
        policyDataHash: policyData.policyDataHash,
        token: policyData.token,
        createdAt: new Date(Number(policyData.createdAt) * 1000),
        isActive: new Date(Number(policyData.endDate) * 1000) > new Date()
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
        policyId: BigInt(claimData.policyId),
        payoutAmount: ethers.formatUnits(claimData.payoutAmount, 6),
        paid: claimData.paid,
        createdAt: new Date(Number(claimData.createdAt) * 1000)
      };
    } catch (error) {
      logger.error('Error fetching claim from chain:', error);
      throw error;
    }
  }

  listenToEvents(callback) {
    // Подписываемся на события контракта
    this.contract.on('PolicyCreated', 
      (policyId, user, premiumPaid, startDate, endDate, policyDataHash, token, event) => {
        callback({
          event: 'PolicyCreated',
          policyId: BigInt(policyId),
          user,
          premiumPaid: ethers.formatUnits(premiumPaid, 6),
          startDate: new Date(Number(startDate) * 1000),
          endDate: new Date(Number(endDate) * 1000),
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
          claimId: BigInt(claimId),
          policyId: BigInt(policyId),
          user,
          amount: ethers.formatUnits(amount, 6),
          token,
          eventType,
          transactionHash: event.transactionHash
        });
      }
    );

    this.contract.on('OracleAdded', 
      (oracle, event) => {
        callback({
          event: 'OracleAdded',
          oracle,
          transactionHash: event.transactionHash
        });
      }
    );

    // Возвращаем функцию для отписки
    return () => {
      this.contract.removeAllListeners();
    };
  }

  async testConnection() {
    try {
      console.log('Testing blockchain connection...');

      // 1. Проверяем подключение к ноде
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`Connected to network. Current block: ${blockNumber}`);

      // 2. Проверяем баланс кошелька
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`Wallet ${this.wallet.address} balance: ${ethers.formatEther(balance)} ETH`);

      // 3. Проверяем доступ к контракту
      try {
        const owner = await this.contract.owner();
        console.log(`Contract owner: ${owner}`);

        const policyCount = await this.contract.policyCount();
        console.log(`Total policies in contract: ${policyCount}`);

        return {
          success: true,
          network: 'connected',
          blockNumber,
          wallet: this.wallet.address,
          balance: ethers.formatEther(balance),
          contractOwner: owner,
          policyCount: Number(policyCount)
        };
      } catch (contractError) {
        console.log('Contract exists but may not have all functions:', contractError.message);
        return {
          success: true,
          network: 'connected',
          blockNumber,
          wallet: this.wallet.address,
          balance: ethers.formatEther(balance),
          contractAccess: 'limited'
        };
      }
    } catch (error) {
      console.error('Blockchain connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new BlockchainService();
