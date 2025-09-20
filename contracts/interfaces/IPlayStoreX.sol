// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPlayStoreX
 * @dev Interface for PlayStoreX Gaming Asset Marketplace
 * @author PlayStoreX Team
 */
interface IPlayStoreX {
    // Events
    event AssetListed(
        uint256 indexed assetId,
        address indexed creator,
        string metadataURI,
        uint256 price,
        uint256 filecoinStorageId,
        bool cdnEnabled
    );
    
    event AssetPurchased(
        uint256 indexed assetId,
        address indexed buyer,
        address indexed creator,
        uint256 price,
        uint256 timestamp
    );
    
    event AssetUpdated(
        uint256 indexed assetId,
        uint256 newPrice,
        string newMetadataURI
    );
    
    event AssetDelisted(
        uint256 indexed assetId,
        address indexed creator
    );
    
    event CreatorRegistered(
        address indexed creator,
        string name,
        string description,
        uint256 feePercentage
    );
    
    event PlatformFeeUpdated(
        uint256 newFeePercentage
    );
    
    event RevenueWithdrawn(
        address indexed creator,
        uint256 amount
    );

    struct AssetInfo {
        uint256 assetId;
        address creator;
        uint256 price;
        uint256 filecoinStorageId;
        bool cdnEnabled;
        bool isActive;
        uint256 createdAt;
        uint256 totalSales;
        uint256 totalRevenue;
    }
    
    struct CreatorInfo {
        address creator;
        uint256 feePercentage;
        bool isActive;
        uint256 totalAssets;
        uint256 totalRevenue;
        uint256 pendingWithdrawal;
    }
    
    struct PurchaseInfo {
        uint256 assetId;
        address buyer;
        uint256 price;
        uint256 timestamp;
        bool isRefunded;
    }

    function listAsset(
        string memory metadataHash,
        uint256 price,
        uint256 filecoinStorageId,
        bool cdnEnabled
    ) external returns (uint256);
    
    function purchaseAsset(uint256 assetId) external payable returns (uint256);
    
    function updateAsset(
        uint256 assetId,
        uint256 newPrice,
        string memory newMetadataHash
    ) external;
    
    function delistAsset(uint256 assetId) external;
    
    function registerCreator(
        string memory metadataHash,
        uint256 feePercentage
    ) external;
    
    function withdrawRevenue() external;
    
    function getAssetInfo(uint256 assetId) external view returns (AssetInfo memory);
    
    function getCreatorInfo(address creator) external view returns (CreatorInfo memory);
    
    function getAssetCount() external view returns (uint256);
    
    function getCreatorAssetCount(address creator) external view returns (uint256);
    
    function getPlatformFee() external view returns (uint256);
    
    function setPlatformFee(uint256 newFeePercentage) external;
    
    function getTotalRevenue() external view returns (uint256);
    
    function getCreatorRevenue(address creator) external view returns (uint256);
    
    function getAssetMetadataHash(uint256 assetId) external view returns (string memory);
    function getCreatorMetadataHash(address creator) external view returns (string memory);
    function updateAssetMetadata(uint256 assetId, string memory newMetadataHash) external;
    function updateCreatorMetadata(string memory newMetadataHash) external;
}
