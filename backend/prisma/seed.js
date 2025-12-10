console.log('🚀 Starting TravelShield seed script');

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Хешируем пароль для тестового пользователя
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 2. Создаем тестового пользователя
    const user = await prisma.user.upsert({
      where: { email: 'test@travelshield.com' },
      update: {},
      create: {
        email: 'test@travelshield.com',
        name: 'Тестовый Пользователь',
        password_hash: passwordHash,
      },
    });

    console.log(`✅ User created: ${user.email}`);

    // 3. Создаем кошелек для пользователя
    const wallet = await prisma.wallet.create({
      data: {
        address: '0x742d35Cc6634C0532925a3b844Bc9e90F1A902eF',
        label: 'Основной кошелек',
        verified: true,
        user_id: user.id,
      },
    });

    console.log(`✅ Wallet created: ${wallet.address}`);

    // 4. Создаем страховые модули
    const modules = await prisma.insuranceModule.createMany({
      data: [
        {
          name: 'Задержка рейса',
          description: 'Выплата при задержке рейса более 3 часов',
          fixed_payout_amount: 100.00,
        },
        {
          name: 'Отмена рейса',
          description: 'Выплата при отмене рейса',
          fixed_payout_amount: 300.00,
        },
        {
          name: 'Потеря багажа',
          description: 'Выплата при потере багажа',
          fixed_payout_amount: 200.00,
        },
        {
          name: 'Медицинские расходы',
          description: 'Покрытие медицинских расходов за границей',
          fixed_payout_amount: 500.00,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`✅ Created ${modules.count} insurance modules`);

    // 5. Статистика
    const userCount = await prisma.user.count();
    const walletCount = await prisma.wallet.count();
    const moduleCount = await prisma.insuranceModule.count();

    console.log('\n📊 Database Statistics:');
    console.log(`   👤 Users: ${userCount}`);
    console.log(`   👛 Wallets: ${walletCount}`);
    console.log(`   📦 Insurance Modules: ${moduleCount}`);

    console.log('\n🎉 Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });