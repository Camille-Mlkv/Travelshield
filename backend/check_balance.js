import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

(async () => {
  const tokenUsdc = new ethers.Contract(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );

  const tokenUsdt = new ethers.Contract(
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );

  const userAddress = "0x5eFe4fd7f59da6264EC90426C8c5edD38f05081e";

  const bal1 = await tokenUsdc.balanceOf(userAddress);
  console.log(bal1.toString());

  const bal2 = await tokenUsdt.balanceOf(userAddress);
  console.log(bal2.toString());

  // await provider.send("hardhat_setBalance", [
  //   userAddress,
  //   "0xDE0B6B3A7640000" // 1 ETH в hex (10**18)
  // ]);
  const balance = await provider.getBalance(userAddress);
  console.log(balance);

})();
