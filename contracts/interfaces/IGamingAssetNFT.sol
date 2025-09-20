// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IGamingAssetNFT
 * @dev Interface for Gaming Asset NFT Contract
 * @author PlayStoreX Team
 */
interface IGamingAssetNFT {
    // Events
    event AssetMinted(
        uint256 indexed tokenId,
        address indexed to,
        string metadataURI,
        uint256 filecoinStorageId,
        bool cdnEnabled
    );
    
    event AssetTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    
    event MetadataUpdated(
        uint256 indexed tokenId,
        string newMetadataURI
    );

    // Structs
    struct AssetMetadata {
        string name;
        string description;
        string category;
        string gameId;
        string version;
        uint256 filecoinStorageId;
        bool cdnEnabled;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Functions
    function mintAsset(
        address to,
        string memory metadataURI,
        uint256 filecoinStorageId,
        bool cdnEnabled
    ) external returns (uint256);
    
    function transferAsset(
        uint256 tokenId,
        address to
    ) external;
    
    function updateMetadata(
        uint256 tokenId,
        string memory newMetadataURI
    ) external;
    
    function getAssetMetadata(uint256 tokenId) external view returns (AssetMetadata memory);
    
    function getFilecoinStorageId(uint256 tokenId) external view returns (uint256);
    
    function isCDNEnabled(uint256 tokenId) external view returns (bool);
    
    function getAssetCount() external view returns (uint256);
    
    function getAssetsByOwner(address owner) external view returns (uint256[] memory);
    
    function getAssetsByGame(string memory gameId) external view returns (uint256[] memory);
    
    function getAssetsByCategory(string memory category) external view returns (uint256[] memory);
}
