const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI = [
    "function markEventOccurred(uint256 policyId, string memory eventType) public",
    "event EventTriggered(uint256 policyId, string eventType)"
];

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

async function markEventOccurred(policyId, eventType) {
    try {
        const tx = await contract.markEventOccurred(policyId, eventType);
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`Transaction confirmed: ${tx.hash}`);
    } catch (err) {
        console.error("Error calling contract:", err);
    }
}

module.exports = { markEventOccurred };
