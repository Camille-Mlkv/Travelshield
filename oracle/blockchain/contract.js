const { ethers } = require("ethers");
const { Wallet, JsonRpcProvider, Contract } = require("ethers");
const { log } = require("../utils/logger");

const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; 
const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
// const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    [
        "function markEventOccurred(uint256 policyId, string calldata eventType, uint256 payoutAmount) external",
        "event ClaimPaid(uint256 indexed claimId, uint256 indexed policyId, address indexed user, uint256 amount, address token, string eventType)"
    ],
    wallet
);

async function markEventOccurred(policyId, eventType, payoutAmount) {
    try {
        log(`Calling markEventOccurred: policy=${policyId}, event=${eventType}, payout=${payoutAmount}`);

        const tx = await contract.markEventOccurred(policyId, eventType, payoutAmount);
        log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        log(`Transaction confirmed. Block: ${receipt.blockNumber}`);
    } catch (err) {
        log("Contract error: " + err.message);
    }
}

module.exports = { markEventOccurred };
