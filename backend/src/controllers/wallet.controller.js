import walletService from '../services/wallet.service.js';

class WalletController {

  async addWallet(req, res, next) {
    try {
      const userId = req.user.id;
      const { address, label } = req.body;

      const wallet = await walletService.addWallet(userId, {
        address,
        label,
      });

      res.status(201).json({
        success: true,
        message: 'Кошелек успешно добавлен',
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWallets(req, res, next) {
    try {
      const userId = req.user.id;
    //   const { page = 1, limit = 10, verified } = req.query;

    //   const options = {
    //     page: parseInt(page),
    //     limit: parseInt(limit),
    //     verified: verified ? verified === 'true' : undefined,
    //   };

      const result = await walletService.getUserWallets(userId);

      res.json({
        success: true,
        data: result.wallets,
      });
    } catch (error) {
      next(error);
    }
  }

//   async getWallet(req, res, next) {
//     try {
//       const userId = req.user.id;
//       const { id } = req.params;

//       const wallet = await walletService.getWalletById(id, userId);

//       res.json({
//         success: true,
//         data: wallet,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async updateWallet(req, res, next) {
//     try {
//       const userId = req.user.id;
//       const { id } = req.params;
//       const { label } = req.body;

//       const wallet = await walletService.updateWallet(id, userId, { label });

//       res.json({
//         success: true,
//         message: 'Кошелек успешно обновлен',
//         data: wallet,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async deleteWallet(req, res, next) {
//     try {
//       const userId = req.user.id;
//       const { id } = req.params;

//       const result = await walletService.deleteWallet(id, userId);

//       res.json({
//         success: true,
//         message: result.message,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async verifyWallet(req, res, next) {
//     try {
//       const userId = req.user.id;
//       const { id } = req.params;
//       const { signature } = req.body;

//       const wallet = await walletService.verifyWallet(id, userId, signature);

//       res.json({
//         success: true,
//         message: 'Кошелек успешно верифицирован',
//         data: wallet,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

  async getSignMessage(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const wallet = await walletService.getWalletById(id, userId);

      const signMessage = walletService.generateSignMessage(wallet.address);

      res.json({
        success: true,
        data: {
          message: signMessage.message,
          timestamp: signMessage.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }


//   async getWalletStats(req, res, next) {
//     try {
//       const userId = req.user.id;
//       const stats = await walletService.getWalletStats(userId);

//       res.json({
//         success: true,
//         data: stats,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

  async checkAddress(req, res, next) {
    try {
      const { address } = req.body;

      if (!walletService.isValidEthereumAddress(address)) {
        return res.json({
          success: true,
          data: {
            available: false,
            reason: 'Неверный формат адреса Ethereum',
          },
        });
      }

      const walletRepository = (await import('../repositories/wallet.repository.js')).default;
      const exists = await walletRepository.existsByAddress(address);

      res.json({
        success: true,
        data: {
          available: !exists,
          exists,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WalletController();