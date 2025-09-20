
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IPlayStoreX.sol";
import "./interfaces/IGamingAssetNFT.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PlayStoreX
 * @dev Main marketplace contract for gaming assets on Filecoin
 * @author PlayStoreX Team
 */
contract PlayStoreX is IPlayStoreX, ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;

    // State variables
    Counters.Counter private _assetIdCounter;
    Counters.Counter private _purchaseIdCounter;
    
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10% max
    uint256 public constant FEE_DENOMINATOR = 10000; // 100.00%
    
    uint256 public platformFeePercentage = 250; // 2.5% default
    uint256 public totalPlatformRevenue;
    
    // Mappings
    mapping(uint256 => AssetInfo) public assets;
    mapping(address => CreatorInfo) public creators;
    mapping(uint256 => PurchaseInfo) public purchases;
    mapping(address => uint256[]) public creatorAssets;
    mapping(address => uint256[]) public buyerPurchases;
    mapping(address => bool) public registeredCreators;
    
    // Modifiers
    modifier onlyCreator() {
        require(registeredCreators[msg.sender], "Not a registered creator");
        _;
    }
    
    modifier assetExists(uint256 assetId) {
        require(assets[assetId].creator != address(0), "Asset does not exist");
        _;
    }
    
    modifier assetActive(uint256 assetId) {
        require(assets[assetId].isActive, "Asset is not active");
        _;
    }

    constructor() {
        // Initialize with owner as first creator for testing
        _registerCreator(msg.sender, "PlayStoreX Platform", "Official PlayStoreX platform creator", 0);
    }

    /**
     * @dev List a new gaming asset for sale
     * @param metadataURI IPFS/metadata URI for the asset
     * @param price Price in FIL (in wei)
     * @param filecoinStorageId Filecoin storage deal ID
     * @param cdnEnabled Whether CDN is enabled for fast retrieval
     * @return assetId The ID of the newly created asset
     */
    function listAsset(
        string memory metadataURI,
        uint256 price,
        uint256 filecoinStorageId,
        bool cdnEnabled
    ) external override onlyCreator whenNotPaused nonReentrant returns (uint256) {
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(price > 0, "Price must be greater than 0");
        require(filecoinStorageId > 0, "Filecoin storage ID must be valid");

        _assetIdCounter.increment();
        uint256 assetId = _assetIdCounter.current();

        assets[assetId] = AssetInfo({
            assetId: assetId,
            creator: msg.sender,
            metadataURI: metadataURI,
            price: price,
            filecoinStorageId: filecoinStorageId,
            cdnEnabled: cdnEnabled,
            isActive: true,
            createdAt: block.timestamp,
            totalSales: 0,
            totalRevenue: 0
        });

        creatorAssets[msg.sender].push(assetId);
        creators[msg.sender].totalAssets++;

        emit AssetListed(assetId, msg.sender, metadataURI, price, filecoinStorageId, cdnEnabled);
        
        return assetId;
    }

    /**
     * @dev Purchase a gaming asset
     * @param assetId The ID of the asset to purchase
     * @return purchaseId The ID of the purchase transaction
     */
    function purchaseAsset(uint256 assetId) 
        external 
        override 
        payable 
        assetExists(assetId) 
        assetActive(assetId) 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        AssetInfo storage asset = assets[assetId];
        require(msg.value >= asset.price, "Insufficient payment");
        require(msg.sender != asset.creator, "Cannot purchase own asset");

        _purchaseIdCounter.increment();
        uint256 purchaseId = _purchaseIdCounter.current();

        // Calculate fees
        uint256 platformFee = (asset.price * platformFeePercentage) / FEE_DENOMINATOR;
        uint256 creatorRevenue = asset.price - platformFee;

        // Update asset statistics
        asset.totalSales++;
        asset.totalRevenue += asset.price;

        // Update creator statistics
        creators[asset.creator].totalRevenue += creatorRevenue;
        creators[asset.creator].pendingWithdrawal += creatorRevenue;

        // Update platform revenue
        totalPlatformRevenue += platformFee;

        // Record purchase
        purchases[purchaseId] = PurchaseInfo({
            assetId: assetId,
            buyer: msg.sender,
            price: asset.price,
            timestamp: block.timestamp,
            isRefunded: false
        });

        buyerPurchases[msg.sender].push(purchaseId);

        // Transfer payment to creator (minus platform fee)
        payable(asset.creator).transfer(creatorRevenue);

        // Refund excess payment
        if (msg.value > asset.price) {
            payable(msg.sender).transfer(msg.value - asset.price);
        }

        emit AssetPurchased(assetId, msg.sender, asset.creator, asset.price, block.timestamp);
        
        return purchaseId;
    }

    /**
     * @dev Update asset information
     * @param assetId The ID of the asset to update
     * @param newPrice New price for the asset
     * @param newMetadataURI New metadata URI
     */
    function updateAsset(
        uint256 assetId,
        uint256 newPrice,
        string memory newMetadataURI
    ) external override assetExists(assetId) whenNotPaused {
        AssetInfo storage asset = assets[assetId];
        require(msg.sender == asset.creator, "Only creator can update asset");
        require(newPrice > 0, "Price must be greater than 0");
        require(bytes(newMetadataURI).length > 0, "Metadata URI cannot be empty");

        asset.price = newPrice;
        asset.metadataURI = newMetadataURI;

        emit AssetUpdated(assetId, newPrice, newMetadataURI);
    }

    /**
     * @dev Delist an asset from the marketplace
     * @param assetId The ID of the asset to delist
     */
    function delistAsset(uint256 assetId) external override assetExists(assetId) whenNotPaused {
        AssetInfo storage asset = assets[assetId];
        require(msg.sender == asset.creator, "Only creator can delist asset");

        asset.isActive = false;

        emit AssetDelisted(assetId, msg.sender);
    }

    /**
     * @dev Register as a creator
     * @param name Creator's display name
     * @param description Creator's description
     * @param feePercentage Creator's fee percentage (0-1000, where 1000 = 10%)
     */
    function registerCreator(
        string memory name,
        string memory description,
        uint256 feePercentage
    ) external override whenNotPaused {
        require(!registeredCreators[msg.sender], "Already registered as creator");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(feePercentage <= 1000, "Fee percentage too high");

        _registerCreator(msg.sender, name, description, feePercentage);
    }

    /**
     * @dev Internal function to register a creator
     */
    function _registerCreator(
        address creator,
        string memory name,
        string memory description,
        uint256 feePercentage
    ) internal {
        creators[creator] = CreatorInfo({
            creator: creator,
            name: name,
            description: description,
            feePercentage: feePercentage,
            isActive: true,
            totalAssets: 0,
            totalRevenue: 0,
            pendingWithdrawal: 0
        });

        registeredCreators[creator] = true;

        emit CreatorRegistered(creator, name, description, feePercentage);
    }

    /**
     * @dev Withdraw accumulated revenue
     */
    function withdrawRevenue() external override onlyCreator whenNotPaused nonReentrant {
        CreatorInfo storage creator = creators[msg.sender];
        require(creator.pendingWithdrawal > 0, "No pending withdrawal");

        uint256 amount = creator.pendingWithdrawal;
        creator.pendingWithdrawal = 0;

        payable(msg.sender).transfer(amount);

        emit RevenueWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Set platform fee percentage (only owner)
     * @param newFeePercentage New fee percentage (0-1000, where 1000 = 10%)
     */
    function setPlatformFee(uint256 newFeePercentage) external override onlyOwner {
        require(newFeePercentage <= MAX_PLATFORM_FEE, "Fee percentage too high");

        platformFeePercentage = newFeePercentage;

        emit PlatformFeeUpdated(newFeePercentage);
    }

    // View functions
    function getAssetInfo(uint256 assetId) external view override returns (AssetInfo memory) {
        return assets[assetId];
    }

    function getCreatorInfo(address creator) external view override returns (CreatorInfo memory) {
        return creators[creator];
    }

    function getAssetCount() external view override returns (uint256) {
        return _assetIdCounter.current();
    }

    function getCreatorAssetCount(address creator) external view override returns (uint256) {
        return creatorAssets[creator].length;
    }

    function getPlatformFee() external view override returns (uint256) {
        return platformFeePercentage;
    }

    function getTotalRevenue() external view override returns (uint256) {
        return totalPlatformRevenue;
    }

    function getCreatorRevenue(address creator) external view override returns (uint256) {
        return creators[creator].totalRevenue;
    }

    function getCreatorAssets(address creator) external view returns (uint256[] memory) {
        return creatorAssets[creator];
    }

    function getBuyerPurchases(address buyer) external view returns (uint256[] memory) {
        return buyerPurchases[buyer];
    }

    function getPurchaseInfo(uint256 purchaseId) external view returns (PurchaseInfo memory) {
        return purchases[purchaseId];
    }

    // Emergency functions (only owner)
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Receive function to accept FIL payments
    receive() external payable {}
}
