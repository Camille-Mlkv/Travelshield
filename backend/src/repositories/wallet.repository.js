import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class WalletRepository {
  async create(walletData) {
    return prisma.wallet.create({
      data: {
        address: walletData.address,
        label: walletData.label || 'Main Wallet',
        verified: walletData.verified || false,
        user_id: walletData.user_id,
      },
      select: {
        id: true,
        address: true,
        label: true,
        verified: true,
        user_id: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findByAddress(address) {
    return prisma.wallet.findUnique({
      where: { address },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async findById(id) {
    return prisma.wallet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        policies: {
          select: {
            id: true,
            status: true,
            premium_amount: true,
            created_at: true,
          },
        },
      },
    });
  }

  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, verified } = options;
    const skip = (page - 1) * limit;

    const where = { user_id: userId };
    if (verified !== undefined) {
      where.verified = verified;
    }

    const [wallets, total] = await Promise.all([
      prisma.wallet.findMany({
        where,
        select: {
          id: true,
          address: true,
          label: true,
          verified: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              policies: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.wallet.count({ where }),
    ]);

    return {
      wallets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

//   async update(id, updateData) {
//     return prisma.wallet.update({
//       where: { id },
//       data: updateData,
//       select: {
//         id: true,
//         address: true,
//         label: true,
//         verified: true,
//         user_id: true,
//         created_at: true,
//         updated_at: true,
//       },
//     });
//   }

//   async delete(id) {
//     return prisma.wallet.delete({
//       where: { id },
//     });
//   }

  /**
   * Проверка существует ли кошелек с таким адресом
   */
  async existsByAddress(address) {
    const count = await prisma.wallet.count({
      where: { address },
    });
    return count > 0;
  }

//   /**
//    * Получение статистики по кошелькам пользователя
//    */
//   async getUserWalletStats(userId) {
//     const totalWallets = await prisma.wallet.count({
//       where: { user_id: userId },
//     });

//     const verifiedWallets = await prisma.wallet.count({
//       where: {
//         user_id: userId,
//         verified: true,
//       },
//     });

//     const walletsWithPolicies = await prisma.wallet.count({
//       where: {
//         user_id: userId,
//         policies: {
//           some: {},
//         },
//       },
//     });

//     return {
//       total: totalWallets,
//       verified: verifiedWallets,
//       with_policies: walletsWithPolicies,
//     };
//   }
}

export default new WalletRepository();