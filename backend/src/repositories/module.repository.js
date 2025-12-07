import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ModuleRepository {
  async findAll() {
      return prisma.insuranceModule.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          fixed_payout_amount: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
      });
  }

  async findById(id) {
    return prisma.insuranceModule.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        fixed_payout_amount: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}

export default new ModuleRepository();