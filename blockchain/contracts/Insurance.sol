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
        address token; // токен, в котором оплачена премия
    }

    struct Claim {
        uint256 policyId;
        uint256 payoutAmount;
        bool paid;
        uint256 createdAt;
    }

    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;

    mapping(uint256 => Claim) public claims;
    uint256 public claimCount;

    mapping(address => bool) public allowedTokens; // USDC, USDT
    mapping(address => bool) public allowedOracles; // разрешенные оракулы

    address public owner;

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed user,
        uint256 premiumPaid,
        uint256 startDate,
        uint256 endDate,
        bytes32 policyDataHash,
        address token
    );

    event ClaimPaid(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed user,
        uint256 amount,
        address token,
        string eventType
    );

    event OracleAdded(address oracle);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOracle() {
        require(allowedOracles[msg.sender], "Not an authorized oracle");
        _;
    }

    constructor(address usdc, address usdt) {
        owner = msg.sender;
        allowedTokens[usdc] = true;
        allowedTokens[usdt] = true;
    }

    // Покупка полиса пользователем
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
            createdAt: block.timestamp,
            token: token
        });

        emit PolicyCreated(policyCount, msg.sender, amount, startDate, endDate, policyDataHash, token);
    }

    // Добавление нового токена владельцем
    function addAllowedToken(address token) external onlyOwner {
        allowedTokens[token] = true;
    }

    // Добавление нового оракула
    function addOracle(address oracle) external onlyOwner {
        allowedOracles[oracle] = true;
        emit OracleAdded(oracle);
    }

    // Владелец может снять средства с контракта
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(allowedTokens[token], "Token not allowed");
        bool sent = IERC20(token).transfer(owner, amount);
        require(sent, "Withdraw failed");
    }

    // Функция, которую вызывает оракул при наступлении страхового события
    function markEventOccurred(uint256 policyId, string calldata eventType, uint256 payoutAmount) external onlyOracle {
        Policy storage policy = policies[policyId];
        require(policy.user != address(0), "Policy does not exist");
        require(block.timestamp <= policy.endDate, "Policy expired");

        // Создание claim
        claimCount += 1;
        claims[claimCount] = Claim({
            policyId: policyId,
            payoutAmount: payoutAmount,
            paid: false,
            createdAt: block.timestamp
        });

        // Выплата пользователю
        bool sent = IERC20(policy.token).transfer(policy.user, payoutAmount);
        require(sent, "Payout failed");

        claims[claimCount].paid = true;

        emit ClaimPaid(claimCount, policyId, policy.user, payoutAmount, policy.token, eventType);
    }
}
