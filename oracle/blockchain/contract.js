const { ethers } = require("ethers");
require("dotenv").config();
const { log } = require("../utils/logger");

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    [
        "function markEventOccurred(uint256 policyId, string eventType) public",
        "event EventTriggered(uint256 policyId, string eventType)"
    ],
    wallet
);

async function markEventOccurred(policyId, eventType) {
    try {
        log(`Calling markEventOccurred: policy=${policyId}, event=${eventType}`);

        const tx = await contract.markEventOccurred(policyId, eventType);

        log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        log(`Transaction confirmed. Block: ${receipt.blockNumber}`);
    } catch (err) {
        log("Contract error: " + err.message);
    }
}

module.exports = { markEventOccurred };
