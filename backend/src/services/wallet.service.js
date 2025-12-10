// src/services/wallet.service.js
import walletRepository from '../repositories/wallet.repository.js';

class WalletService {

  async addWallet(userId, walletData) {
    try {
      if (!this.isValidEthereumAddress(walletData.address)) {
        throw new Error('Неверный формат адреса Ethereum');
      }

      const existingWallet = await walletRepository.findByAddress(walletData.address);
      if (existingWallet) {
        throw new Error('Этот кошелек уже привязан к другому пользователю');
      }

      const wallet = await walletRepository.create({
        address: walletData.address,
        label: walletData.label,
        verified: false, 
        user_id: userId,
      });

      return wallet;
    } catch (error) {
      throw error;
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

//   async updateWallet(walletId, userId, updateData) {
//     try {
//       // Проверяем существование и принадлежность кошелька
//       const wallet = await walletRepository.findById(walletId);
      
//       if (!wallet) {
//         throw new Error('Кошелек не найден');
//       }

//       if (wallet.user_id !== userId) {
//         throw new Error('Доступ запрещен');
//       }

//       // Обновляем только разрешенные поля
//       const allowedUpdates = ['label'];
//       const filteredUpdates = {};
      
//       Object.keys(updateData).forEach(key => {
//         if (allowedUpdates.includes(key)) {
//           filteredUpdates[key] = updateData[key];
//         }
//       });

//       // Если нет полей для обновления
//       if (Object.keys(filteredUpdates).length === 0) {
//         throw new Error('Нет данных для обновления');
//       }

//       const updatedWallet = await walletRepository.update(walletId, filteredUpdates);
//       return updatedWallet;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Удаление кошелька
//    */
//   async deleteWallet(walletId, userId) {
//     try {
//       // Проверяем существование и принадлежность кошелька
//       const wallet = await walletRepository.findById(walletId);
      
//       if (!wallet) {
//         throw new Error('Кошелек не найден');
//       }

//       if (wallet.user_id !== userId) {
//         throw new Error('Доступ запрещен');
//       }

//       // Проверяем есть ли активные полисы
//       const activePolicies = wallet.policies?.filter(
//         policy => policy.status === 'ACTIVE' || policy.status === 'AWAITING_ONCHAIN'
//       );

//       if (activePolicies && activePolicies.length > 0) {
//         throw new Error('Нельзя удалить кошелек с активными полисами');
//       }

//       await walletRepository.delete(walletId);
//       return { success: true, message: 'Кошелек успешно удален' };
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Верификация кошелька (заглушка для будущей реализации)
//    */
//   async verifyWallet(walletId, userId, signature) {
//     try {
//       // TODO: Реализовать проверку подписи
//       // Пока просто отмечаем как верифицированный
//       const wallet = await walletRepository.findById(walletId);
      
//       if (!wallet) {
//         throw new Error('Кошелек не найден');
//       }

//       if (wallet.user_id !== userId) {
//         throw new Error('Доступ запрещен');
//       }

//       // Симуляция проверки подписи
//       const isSignatureValid = await this.verifyEthereumSignature(
//         wallet.address,
//         signature
//       );

//       if (!isSignatureValid) {
//         throw new Error('Неверная подпись');
//       }

//       const updatedWallet = await walletRepository.update(walletId, {
//         verified: true,
//       });

//       return updatedWallet;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Получение статистики по кошелькам
//    */
//   async getWalletStats(userId) {
//     try {
//       return await walletRepository.getUserWalletStats(userId);
//     } catch (error) {
//       throw error;
//     }
//   }
}

export default new WalletService();