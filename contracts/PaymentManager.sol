// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PaymentManager
 * @dev Handles payments, revenue sharing, and subscription management for PlayStoreX
 * @author PlayStoreX Team
 */
contract PaymentManager is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    // Events
    event PaymentProcessed(
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        string paymentType,
        uint256 indexed transactionId
    );
    
    event SubscriptionCreated(
        address indexed subscriber,
        address indexed creator,
        uint256 monthlyAmount,
        uint256 startTime,
        uint256 indexed subscriptionId
    );
    
    event SubscriptionRenewed(
        uint256 indexed subscriptionId,
        uint256 amount,
        uint256 nextRenewalTime
    );
    
    event SubscriptionCancelled(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed creator
    );
    
    event RevenueDistributed(
        address indexed creator,
        uint256 amount,
        uint256 platformFee,
        uint256 creatorRevenue
    );
    
    event PaymentTokenAdded(
        address indexed token,
        string symbol,
        bool isActive
    );
    
    event PaymentTokenRemoved(
        address indexed token
    );

    // Structs
    struct Subscription {
        uint256 subscriptionId;
        address subscriber;
        address creator;
        uint256 monthlyAmount;
        uint256 startTime;
        uint256 nextRenewalTime;
        bool isActive;
        uint256 totalPaid;
    }
    
    struct PaymentToken {
        address tokenAddress;
        string symbol;
        bool isActive;
        uint256 decimals;
    }
    
    struct RevenueShare {
        address creator;
        uint256 totalRevenue;
        uint256 pendingWithdrawal;
        uint256 lastWithdrawal;
    }

    // State variables
    Counters.Counter private _subscriptionIdCounter;
    Counters.Counter private _transactionIdCounter;
    
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10% max
    uint256 public constant FEE_DENOMINATOR = 10000; // 100.00%
    
    uint256 public platformFeePercentage = 250; // 2.5% default
    uint256 public totalPlatformRevenue;
    
    // Mappings
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public userSubscriptions;
    mapping(address => uint256[]) public creatorSubscriptions;
    mapping(address => PaymentToken) public paymentTokens;
    mapping(address => RevenueShare) public revenueShares;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public userBalances;
    
    // Supported payment tokens
    address[] public supportedTokenList;
    address public constant FIL_TOKEN = address(0); // Native FIL (address(0) represents native token)

    constructor() {
        // Add native FIL as supported token
        _addPaymentToken(FIL_TOKEN, "FIL", 18, true);
    }

    /**
     * @dev Process a one-time payment
     * @param recipient Address to receive payment
     * @param amount Amount to pay (in wei for FIL, or token units)
     * @param tokenAddress Token address (address(0) for native FIL)
     * @param paymentType Type of payment (e.g., "asset_purchase", "subscription", etc.)
     * @return transactionId The ID of the transaction
     */
    function processPayment(
        address recipient,
        uint256 amount,
        address tokenAddress,
        string memory paymentType
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(supportedTokens[tokenAddress], "Token not supported");

        _transactionIdCounter.increment();
        uint256 transactionId = _transactionIdCounter.current();

        if (tokenAddress == FIL_TOKEN) {
            // Native FIL payment
            require(msg.value >= amount, "Insufficient FIL payment");
            
            // Calculate fees
            uint256 platformFee = (amount * platformFeePercentage) / FEE_DENOMINATOR;
            uint256 recipientAmount = amount - platformFee;
            
            // Update revenue tracking
            revenueShares[recipient].totalRevenue += recipientAmount;
            revenueShares[recipient].pendingWithdrawal += recipientAmount;
            totalPlatformRevenue += platformFee;
            
            // Transfer payment
            payable(recipient).transfer(recipientAmount);
            
            // Refund excess
            if (msg.value > amount) {
                payable(msg.sender).transfer(msg.value - amount);
            }
        } else {
            // ERC20 token payment
            IERC20 token = IERC20(tokenAddress);
            require(token.balanceOf(msg.sender) >= amount, "Insufficient token balance");
            require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient token allowance");
            
            // Calculate fees
            uint256 platformFee = (amount * platformFeePercentage) / FEE_DENOMINATOR;
            uint256 recipientAmount = amount - platformFee;
            
            // Transfer tokens
            token.safeTransferFrom(msg.sender, address(this), amount);
            
            // Update revenue tracking
            revenueShares[recipient].totalRevenue += recipientAmount;
            revenueShares[recipient].pendingWithdrawal += recipientAmount;
            totalPlatformRevenue += platformFee;
            
            // Transfer to recipient
            token.safeTransfer(recipient, recipientAmount);
        }

        emit PaymentProcessed(msg.sender, recipient, amount, paymentType, transactionId);
        emit RevenueDistributed(recipient, amount, (amount * platformFeePercentage) / FEE_DENOMINATOR, amount - (amount * platformFeePercentage) / FEE_DENOMINATOR);
        
        return transactionId;
    }

    /**
     * @dev Create a subscription
     * @param creator Address of the creator to subscribe to
     * @param monthlyAmount Monthly payment amount
     * @param tokenAddress Token address for payment
     * @return subscriptionId The ID of the subscription
     */
    function createSubscription(
        address creator,
        uint256 monthlyAmount,
        address tokenAddress
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(creator != address(0), "Invalid creator");
        require(monthlyAmount > 0, "Monthly amount must be greater than 0");
        require(supportedTokens[tokenAddress], "Token not supported");

        _subscriptionIdCounter.increment();
        uint256 subscriptionId = _subscriptionIdCounter.current();

        uint256 startTime = block.timestamp;
        uint256 nextRenewalTime = startTime + 30 days; // Monthly renewal

        subscriptions[subscriptionId] = Subscription({
            subscriptionId: subscriptionId,
            subscriber: msg.sender,
            creator: creator,
            monthlyAmount: monthlyAmount,
            startTime: startTime,
            nextRenewalTime: nextRenewalTime,
            isActive: true,
            totalPaid: 0
        });

        userSubscriptions[msg.sender].push(subscriptionId);
        creatorSubscriptions[creator].push(subscriptionId);

        // Process first payment
        if (tokenAddress == FIL_TOKEN) {
            require(msg.value >= monthlyAmount, "Insufficient FIL payment");
            _processSubscriptionPayment(subscriptionId, monthlyAmount, tokenAddress);
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.balanceOf(msg.sender) >= monthlyAmount, "Insufficient token balance");
            require(token.allowance(msg.sender, address(this)) >= monthlyAmount, "Insufficient token allowance");
            _processSubscriptionPayment(subscriptionId, monthlyAmount, tokenAddress);
        }

        emit SubscriptionCreated(msg.sender, creator, monthlyAmount, startTime, subscriptionId);
        
        return subscriptionId;
    }

    /**
     * @dev Process subscription renewal
     * @param subscriptionId ID of the subscription to renew
     */
    function renewSubscription(uint256 subscriptionId) external whenNotPaused nonReentrant {
        Subscription storage subscription = subscriptions[subscriptionId];
        require(subscription.isActive, "Subscription not active");
        require(block.timestamp >= subscription.nextRenewalTime, "Renewal not due yet");
        require(msg.sender == subscription.subscriber, "Not the subscriber");

        uint256 amount = subscription.monthlyAmount;
        address tokenAddress = FIL_TOKEN; // Default to FIL for now
        
        _processSubscriptionPayment(subscriptionId, amount, tokenAddress);
        
        subscription.nextRenewalTime += 30 days;
        
        emit SubscriptionRenewed(subscriptionId, amount, subscription.nextRenewalTime);
    }

    /**
     * @dev Cancel a subscription
     * @param subscriptionId ID of the subscription to cancel
     */
    function cancelSubscription(uint256 subscriptionId) external whenNotPaused {
        Subscription storage subscription = subscriptions[subscriptionId];
        require(subscription.isActive, "Subscription not active");
        require(msg.sender == subscription.subscriber || msg.sender == subscription.creator, "Not authorized");

        subscription.isActive = false;

        emit SubscriptionCancelled(subscriptionId, subscription.subscriber, subscription.creator);
    }

    /**
     * @dev Withdraw accumulated revenue
     * @param tokenAddress Token address to withdraw (address(0) for FIL)
     */
    function withdrawRevenue(address tokenAddress) external whenNotPaused nonReentrant {
        require(supportedTokens[tokenAddress], "Token not supported");
        
        RevenueShare storage revenue = revenueShares[msg.sender];
        require(revenue.pendingWithdrawal > 0, "No pending withdrawal");

        uint256 amount = revenue.pendingWithdrawal;
        revenue.pendingWithdrawal = 0;
        revenue.lastWithdrawal = block.timestamp;

        if (tokenAddress == FIL_TOKEN) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(tokenAddress).safeTransfer(msg.sender, amount);
        }

        emit RevenueDistributed(msg.sender, amount, 0, amount);
    }

    /**
     * @dev Add a new payment token
     * @param tokenAddress Address of the token contract
     * @param symbol Token symbol
     * @param decimals Token decimals
     * @param isActive Whether the token is active
     */
    function addPaymentToken(
        address tokenAddress,
        string memory symbol,
        uint256 decimals,
        bool isActive
    ) external onlyOwner {
        _addPaymentToken(tokenAddress, symbol, decimals, isActive);
    }

    /**
     * @dev Internal function to add payment token
     */
    function _addPaymentToken(
        address tokenAddress,
        string memory symbol,
        uint256 decimals,
        bool isActive
    ) internal {
        paymentTokens[tokenAddress] = PaymentToken({
            tokenAddress: tokenAddress,
            symbol: symbol,
            isActive: isActive,
            decimals: decimals
        });
        
        supportedTokens[tokenAddress] = true;
        
        if (tokenAddress != FIL_TOKEN) {
            supportedTokenList.push(tokenAddress);
        }

        emit PaymentTokenAdded(tokenAddress, symbol, isActive);
    }

    /**
     * @dev Remove a payment token
     * @param tokenAddress Address of the token to remove
     */
    function removePaymentToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != FIL_TOKEN, "Cannot remove FIL token");
        require(supportedTokens[tokenAddress], "Token not supported");

        supportedTokens[tokenAddress] = false;
        paymentTokens[tokenAddress].isActive = false;

        // Remove from supported token list
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            if (supportedTokenList[i] == tokenAddress) {
                supportedTokenList[i] = supportedTokenList[supportedTokenList.length - 1];
                supportedTokenList.pop();
                break;
            }
        }

        emit PaymentTokenRemoved(tokenAddress);
    }

    /**
     * @dev Set platform fee percentage
     * @param newFeePercentage New fee percentage (0-1000, where 1000 = 10%)
     */
    function setPlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_PLATFORM_FEE, "Fee percentage too high");
        platformFeePercentage = newFeePercentage;
    }

    /**
     * @dev Internal function to process subscription payment
     */
    function _processSubscriptionPayment(
        uint256 subscriptionId,
        uint256 amount,
        address tokenAddress
    ) internal {
        Subscription storage subscription = subscriptions[subscriptionId];
        
        if (tokenAddress == FIL_TOKEN) {
            require(msg.value >= amount, "Insufficient FIL payment");
            
            // Calculate fees
            uint256 platformFee = (amount * platformFeePercentage) / FEE_DENOMINATOR;
            uint256 creatorAmount = amount - platformFee;
            
            // Update revenue tracking
            revenueShares[subscription.creator].totalRevenue += creatorAmount;
            revenueShares[subscription.creator].pendingWithdrawal += creatorAmount;
            totalPlatformRevenue += platformFee;
            
            // Transfer payment
            payable(subscription.creator).transfer(creatorAmount);
            
            // Refund excess
            if (msg.value > amount) {
                payable(msg.sender).transfer(msg.value - amount);
            }
        } else {
            IERC20 token = IERC20(tokenAddress);
            
            // Calculate fees
            uint256 platformFee = (amount * platformFeePercentage) / FEE_DENOMINATOR;
            uint256 creatorAmount = amount - platformFee;
            
            // Transfer tokens
            token.safeTransferFrom(msg.sender, address(this), amount);
            
            // Update revenue tracking
            revenueShares[subscription.creator].totalRevenue += creatorAmount;
            revenueShares[subscription.creator].pendingWithdrawal += creatorAmount;
            totalPlatformRevenue += platformFee;
            
            // Transfer to creator
            token.safeTransfer(subscription.creator, creatorAmount);
        }
        
        subscription.totalPaid += amount;
    }

    // View functions
    function getSubscription(uint256 subscriptionId) external view returns (Subscription memory) {
        return subscriptions[subscriptionId];
    }

    function getUserSubscriptions(address user) external view returns (uint256[] memory) {
        return userSubscriptions[user];
    }

    function getCreatorSubscriptions(address creator) external view returns (uint256[] memory) {
        return creatorSubscriptions[creator];
    }

    function getRevenueShare(address creator) external view returns (RevenueShare memory) {
        return revenueShares[creator];
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokenList;
    }

    function getPaymentToken(address tokenAddress) external view returns (PaymentToken memory) {
        return paymentTokens[tokenAddress];
    }

    function getPlatformFee() external view returns (uint256) {
        return platformFeePercentage;
    }

    function getTotalPlatformRevenue() external view returns (uint256) {
        return totalPlatformRevenue;
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address tokenAddress) external onlyOwner {
        if (tokenAddress == FIL_TOKEN) {
            payable(owner()).transfer(address(this).balance);
        } else {
            IERC20(tokenAddress).safeTransfer(owner(), IERC20(tokenAddress).balanceOf(address(this)));
        }
    }

    // Receive function to accept FIL payments
    receive() external payable {}
}
