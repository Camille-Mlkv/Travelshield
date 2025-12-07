const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurance contract", function () {
  let owner, user, oracle;
  let usdc, usdt, insurance;

  beforeEach(async function () {
    [owner, user, oracle] = await ethers.getSigners();

    // Деплой MockERC20 токенов
    const MockToken = await ethers.getContractFactory("MockERC20");
    usdc = await MockToken.deploy("Mock USDC", "USDC");
    await usdc.waitForDeployment();

    usdt = await MockToken.deploy("Mock USDT", "USDT");
    await usdt.waitForDeployment();

    // Перевод токенов на user
    await usdc.transfer(user.address, 1_000_000);
    await usdt.transfer(user.address, 1_000_000);

    // Деплой Insurance с адресами токенов
    const Insurance = await ethers.getContractFactory("Insurance");
    insurance = await Insurance.deploy(await usdc.getAddress(), await usdt.getAddress());
    await insurance.waitForDeployment();
  });

  it("should allow buying a policy with USDC", async function () {
    await usdc.connect(user).approve(await insurance.getAddress(), 10_000);

    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + 3600; // +1 час
    await insurance.connect(user).buyPolicy(
      await usdc.getAddress(),
      10_000,
      startDate,
      endDate,
      ethers.encodeBytes32String("test-policy")
    );

    const policy = await insurance.policies(1);
    expect(policy.user).to.equal(user.address);
    expect(policy.premiumPaid).to.equal(10_000);

    const contractBalance = await usdc.balanceOf(await insurance.getAddress());
    expect(contractBalance).to.equal(10_000);
  });

  it("owner should be able to withdraw tokens", async function () {
    await usdc.connect(user).approve(await insurance.getAddress(), 5_000);
    await insurance.connect(user).buyPolicy(
      await usdc.getAddress(),
      5_000,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 3600,
      ethers.encodeBytes32String("policy")
    );

    await insurance.connect(owner).withdraw(await usdc.getAddress(), 5_000);

    const ownerBalance = await usdc.balanceOf(owner.address);
    expect(ownerBalance).to.be.gt(0);
  });

  it("should allow owner to add an oracle and oracle to trigger claim", async function () {
    // Добавляем оракула
    await insurance.connect(owner).addOracle(oracle.address);
    const allowed = await insurance.allowedOracles(oracle.address);
    expect(allowed).to.be.true;

    // Пользователь покупает полис
    await usdc.connect(user).approve(await insurance.getAddress(), 20_000);
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + 3600;
    await insurance.connect(user).buyPolicy(
      await usdc.getAddress(),
      20_000,
      startDate,
      endDate,
      ethers.encodeBytes32String("policy-claim")
    );

    // Проверяем, что контракт получил токены
    const contractBalanceBefore = await usdc.balanceOf(await insurance.getAddress());
    expect(contractBalanceBefore).to.equal(20_000);

    // Оракул вызывает markEventOccurred
    const payoutAmount = 10_000;
    await expect(
      insurance.connect(oracle).markEventOccurred(1, "delay", payoutAmount)
    ).to.emit(insurance, "ClaimPaid")
      .withArgs(1, 1, user.address, payoutAmount, await usdc.getAddress(), "delay");

    const policy = await insurance.policies(1);
    expect(policy.user).to.equal(user.address);

    const userBalance = await usdc.balanceOf(user.address);
    expect(userBalance).to.equal(1_000_000 - 20_000 + payoutAmount); // начальный баланс - премия + выплатa
  });

  it("should fail if non-oracle tries to markEventOccurred", async function () {
    await usdc.connect(user).approve(await insurance.getAddress(), 10_000);
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + 3600;
    await insurance.connect(user).buyPolicy(
      await usdc.getAddress(),
      10_000,
      startDate,
      endDate,
      ethers.encodeBytes32String("policy")
    );

    await expect(
      insurance.connect(user).markEventOccurred(1, "delay", 5_000)
    ).to.be.revertedWith("Not an authorized oracle");
  });
});
