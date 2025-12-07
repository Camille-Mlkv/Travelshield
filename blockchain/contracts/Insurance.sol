// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}


contract Insurance {
    struct Policy {
        address user;
        uint256 premiumPaid;
        uint256 startDate;
        uint256 endDate;
        bytes32 policyDataHash; // хеш выбранных модулей и параметров
        uint256 createdAt;
    }

    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;

    mapping(address => bool) public allowedTokens; // USDC, USDT
    address public owner;

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed user,
        uint256 premiumPaid,
        uint256 startDate,
        uint256 endDate,
        bytes32 policyDataHash
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address usdc, address usdt) {
        owner = msg.sender;
        allowedTokens[usdc] = true;
        allowedTokens[usdt] = true;
    }

    function buyPolicy(
        address token,
        uint256 amount,
        uint256 startDate,
        uint256 endDate,
        bytes32 policyDataHash
    ) external {
        require(allowedTokens[token], "Token not allowed");
        require(amount > 0, "Amount must be > 0");
        require(startDate < endDate, "Invalid period");

        // Перевод токенов с кошелька пользователя на контракт
        bool sent = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(sent, "Token transfer failed");

        // Создание записи о полисе
        policyCount += 1;
        policies[policyCount] = Policy({
            user: msg.sender,
            premiumPaid: amount,
            startDate: startDate,
            endDate: endDate,
            policyDataHash: policyDataHash,
            createdAt: block.timestamp
        });

        emit PolicyCreated(policyCount, msg.sender, amount, startDate, endDate, policyDataHash);
    }

    // Owner может добавить новые токены
    function addAllowedToken(address token) external onlyOwner {
        allowedTokens[token] = true;
    }

    // Owner может снять средства с контракта
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(allowedTokens[token], "Token not allowed");
        bool sent = IERC20(token).transfer(owner, amount);
        require(sent, "Withdraw failed");
    }

}
