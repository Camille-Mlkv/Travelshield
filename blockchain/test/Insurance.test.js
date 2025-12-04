const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurance contract", function () {
  let owner, user;
  let usdc, usdt, insurance;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // 1️⃣ Деплой MockERC20 токенов
    const MockToken = await ethers.getContractFactory("MockERC20");
    usdc = await MockToken.deploy("Mock USDC", "USDC");
    await usdc.waitForDeployment();

    usdt = await MockToken.deploy("Mock USDT", "USDT");
    await usdt.waitForDeployment();

    // 2️⃣ Перевод токенов на user
    await usdc.transfer(user.address, 1_000_000); // 1_000_000 USDC
    await usdt.transfer(user.address, 1_000_000); // 1_000_000 USDT

    // 3️⃣ Деплой Insurance с адресами токенов
    const Insurance = await ethers.getContractFactory("Insurance");
    insurance = await Insurance.deploy(await usdc.getAddress(), await usdt.getAddress());
    await insurance.waitForDeployment();
  });

  it("should allow buying a policy with USDC", async function () {
    // 4️⃣ Пользователь одобряет контракт на списание токенов
    await usdc.connect(user).approve(await insurance.getAddress(), 10_000);

    // 5️⃣ Пользователь покупает полис
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + 3600; // +1 час
    const tx = await insurance.connect(user).buyPolicy(
      await usdc.getAddress(),
      10_000,
      startDate,
      endDate,
      ethers.encodeBytes32String("test-policy")
    );
    await tx.wait();

    // 6️⃣ Проверяем, что полис создан
    const policy = await insurance.policies(1);
    expect(policy.user).to.equal(user.address);
    expect(policy.premiumPaid).to.equal(10_000);

    // 7️⃣ Проверяем баланс токенов контракта
    const contractBalance = await usdc.balanceOf(await insurance.getAddress());
    expect(contractBalance).to.equal(10_000);
  });

  it("owner should be able to withdraw tokens", async function () {
    // Одобряем и покупаем полис
    await usdc.connect(user).approve(await insurance.getAddress(), 5_000);
    await insurance.connect(user).buyPolicy(
      await usdc.getAddress(),
      5_000,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 3600,
      ethers.encodeBytes32String("policy")
    );

    // Owner выводит токены
    await insurance.connect(owner).withdraw(await usdc.getAddress(), 5_000);

    const ownerBalance = await usdc.balanceOf(owner.address);
    expect(ownerBalance).to.be.gt(0); // owner получил токены
  });
});
