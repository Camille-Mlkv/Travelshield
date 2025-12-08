const { ethers } = require("hardhat");

async function main() {
  const MockToken = await ethers.getContractFactory("MockERC20");

  const usdc = await MockToken.deploy("Mock USDC", "USDC");
  await usdc.waitForDeployment();

  const usdt = await MockToken.deploy("Mock USDT", "USDT");
  await usdt.waitForDeployment();

  console.log("Mock USDC deployed at:", await usdc.getAddress());
  console.log("Mock USDT deployed at:", await usdt.getAddress());

  const Insurance = await ethers.getContractFactory("Insurance");
  const insurance = await Insurance.deploy(await usdc.getAddress(), await usdt.getAddress());
  await insurance.waitForDeployment();

  console.log("Insurance deployed at:", await insurance.getAddress());
}

main();
