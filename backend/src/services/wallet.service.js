// src/services/wallet.service.js
import walletRepository from '../repositories/wallet.repository.js';
import { ethers } from 'ethers';

const erc20Abi = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)"
];

class WalletService {

  async addWallet(userId, walletData) {
     try {
    const wallet = ethers.Wallet.createRandom();

    const privateKey = wallet.privateKey;
    const address = wallet.address;

    const saved = await walletRepository.create({
      user_id: userId,
      abel: walletData.label,
      address,
      //privateKey, // У нас в структуре БД его нет, что правильно с т.з. безопасности
      verified: true
    });

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const usdc = new ethers.Contract(process.env.USDC_ADDRESS, erc20Abi, deployer);
    const usdt = new ethers.Contract(process.env.USDT_ADDRESS, erc20Abi, deployer);

    const decimalsUsdc = await usdc.decimals();
    const decimalsUsdt = await usdt.decimals();
    const initialAmountHuman = "500000"; // 500k
    const initialUsdc = ethers.parseUnits(initialAmountHuman, decimalsUsdc);
    const initialUsdt = ethers.parseUnits(initialAmountHuman, decimalsUsdt);

    const deployerAddress = await deployer.getAddress();
    let nonce = await provider.getTransactionCount(deployerAddress, "latest");

    const tx1 = await usdc.transfer(address, initialUsdc, { nonce });
    console.log("USDC transfer sent, hash:", tx1.hash, "nonce:", nonce);
    await tx1.wait();
    console.log("USDC transfer confirmed");
    nonce++;

    const tx2 = await usdt.transfer(address, initialUsdt, { nonce });
    console.log("USDT transfer sent, hash:", tx2.hash, "nonce:", nonce);
    await tx2.wait();
    console.log("USDT transfer confirmed");

    return {
      address,
      privateKey // выведется в консоли - именно он используется в blockchain.service 
    };
    // предлагаю хранить privateKey в БД - это хоть и не best practice, но по другому никак
    // и передавать его в метод buyPolicy в blockchain.service

  } catch (err) {
    console.error("Wallet creation failed:", err);
    throw err;
  }
  }


  async getUserWallets(userId, options = {}) {
    try {
      return await walletRepository.findByUserId(userId, options);
    } catch (error) {
      throw error;
    }
  }

  async getWalletById(walletId, userId) {
    try {
      const wallet = await walletRepository.findById(walletId);
      
      if (!wallet) {
        throw new Error('Кошелек не найден');
      }

      if (wallet.user_id !== userId) {
        throw new Error('Доступ запрещен');
      }

      return wallet;
    } catch (error) {
      throw error;
    }
  }

    isValidEthereumAddress(address) {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  /**
   * Проверка подписи Ethereum (заглушка)
   */
  async verifyEthereumSignature(address, signature) {
    // TODO: Реализовать настоящую проверку подписи
    // Для тестирования возвращаем true
    console.log(`Verifying signature for ${address}: ${signature.substring(0, 20)}...`);
    return true;
  }

  generateSignMessage(address) {
    const timestamp = Date.now();
    const message = `TravelShield: Please sign this message to verify your wallet.\nAddress: ${address}\nTimestamp: ${timestamp}`;
    
    return {
      message,
      timestamp,
    };
  }
}

export default new WalletService();