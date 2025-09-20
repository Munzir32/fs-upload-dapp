
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
 * @dev Marketplace contract for gaming assets on Filecoin
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
    
    mapping(uint256 => AssetInfo) public assets;
    mapping(address => CreatorInfo) public creators;
    mapping(uint256 => PurchaseInfo) public purchases;
    mapping(address => uint256[]) public creatorAssets;
    mapping(address => uint256[]) public buyerPurchases;
    mapping(address => bool) public registeredCreators;
    mapping(uint256 => string) public assetMetadataHashes;
    mapping(address => string) public creatorMetadataHashes;
    
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
        _registerCreator(msg.sender, "", 0);
    }

    /**
     * @dev List a new gaming asset for sale
     * @param metadataHash IPFS hash pointing to metadata stored on Filecoin
     * @param price Price in FIL (in wei)
     * @param filecoinStorageId Filecoin storage deal ID
     * @param cdnEnabled Whether CDN is enabled for fast retrieval
     * @return assetId The ID of the newly created asset
     */
    function listAsset(
        string memory metadataHash,
        uint256 price,
        uint256 filecoinStorageId,
        bool cdnEnabled
    ) external override onlyCreator whenNotPaused nonReentrant returns (uint256) {
        require(bytes(metadataHash).length > 0, "Metadata hash cannot be empty");
        require(price > 0, "Price must be greater than 0");
        require(filecoinStorageId > 0, "Filecoin storage ID must be valid");

        _assetIdCounter.increment();
        uint256 assetId = _assetIdCounter.current();

        assets[assetId] = AssetInfo({
            assetId: assetId,
            creator: msg.sender,
            price: price,
            filecoinStorageId: filecoinStorageId,
            cdnEnabled: cdnEnabled,
            isActive: true,
            createdAt: block.timestamp,
            totalSales: 0,
            totalRevenue: 0
        });

        assetMetadataHashes[assetId] = metadataHash;

        creatorAssets[msg.sender].push(assetId);
        creators[msg.sender].totalAssets++;

        emit AssetListed(assetId, msg.sender, metadataHash, price, filecoinStorageId, cdnEnabled);
        
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
     * @param newMetadataHash New metadata hash pointing to updated metadata on Filecoin
     */
    function updateAsset(
        uint256 assetId,
        uint256 newPrice,
        string memory newMetadataHash
    ) external override assetExists(assetId) whenNotPaused {
        AssetInfo storage asset = assets[assetId];
        require(msg.sender == asset.creator, "Only creator can update asset");
        require(newPrice > 0, "Price must be greater than 0");
        require(bytes(newMetadataHash).length > 0, "Metadata hash cannot be empty");

        asset.price = newPrice;
        assetMetadataHashes[assetId] = newMetadataHash;

        emit AssetUpdated(assetId, newPrice, newMetadataHash);
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
     * @param metadataHash IPFS hash pointing to creator metadata stored on Filecoin
     * @param feePercentage Creator's fee percentage (0-1000, where 1000 = 10%)
     */
    function registerCreator(
        string memory metadataHash,
        uint256 feePercentage
    ) external override whenNotPaused {
        require(!registeredCreators[msg.sender], "Already registered as creator");
        require(bytes(metadataHash).length > 0, "Metadata hash cannot be empty");
        require(feePercentage <= 1000, "Fee percentage too high");

        _registerCreator(msg.sender, metadataHash, feePercentage);
    }

    function _registerCreator(
        address creator,
        string memory metadataHash,
        uint256 feePercentage
    ) internal {
        creators[creator] = CreatorInfo({
            creator: creator,
            feePercentage: feePercentage,
            isActive: true,
            totalAssets: 0,
            totalRevenue: 0,
            pendingWithdrawal: 0
        });

        creatorMetadataHashes[creator] = metadataHash;
        registeredCreators[creator] = true;

        emit CreatorRegistered(creator, metadataHash, "", feePercentage);
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

    function getAssetMetadataHash(uint256 assetId) external view override returns (string memory) {
        require(assets[assetId].creator != address(0), "Asset does not exist");
        return assetMetadataHashes[assetId];
    }

    function getCreatorMetadataHash(address creator) external view override returns (string memory) {
        require(registeredCreators[creator], "Creator not registered");
        return creatorMetadataHashes[creator];
    }

    function updateAssetMetadata(uint256 assetId, string memory newMetadataHash) external override assetExists(assetId) whenNotPaused {
        AssetInfo storage asset = assets[assetId];
        require(msg.sender == asset.creator, "Only creator can update metadata");
        require(bytes(newMetadataHash).length > 0, "Metadata hash cannot be empty");

        assetMetadataHashes[assetId] = newMetadataHash;
        emit AssetUpdated(assetId, asset.price, newMetadataHash);
    }

    function updateCreatorMetadata(string memory newMetadataHash) external override onlyCreator whenNotPaused {
        require(bytes(newMetadataHash).length > 0, "Metadata hash cannot be empty");
        creatorMetadataHashes[msg.sender] = newMetadataHash;
        emit CreatorRegistered(msg.sender, newMetadataHash, "", creators[msg.sender].feePercentage);
    }

    receive() external payable {}
}
