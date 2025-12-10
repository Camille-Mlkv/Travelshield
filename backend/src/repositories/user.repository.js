import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class UserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password_hash: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        updated_at: true,
        wallets: {
          select: {
            id: true,
            address: true,
            label: true,
            verified: true,
          },
        },
      },
    });
  }

  async create(userData) {
    return prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password_hash: userData.password_hash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async existsByEmail(email) {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  async update(id, updateData) {
    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}

const userRepository = new UserRepository();
export default userRepository;
