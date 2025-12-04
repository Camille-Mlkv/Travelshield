// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://v2.hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const USDC_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const USDT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

module.exports = buildModule("InsuranceModule", (m) => {
  const travelInsurance = m.contract("Insurance", [USDC_ADDRESS, USDT_ADDRESS]);

  return { travelInsurance };
});

