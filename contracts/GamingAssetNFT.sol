// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IGamingAssetNFT.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GamingAssetNFT
 * @dev NFT contract for gaming assets with Filecoin storage integration
 * @author PlayStoreX Team
 */
contract GamingAssetNFT is 
    IGamingAssetNFT, 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    Ownable, 
    Pausable 
{
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
   
    mapping(uint256 => string) private _assetMetadataHashes;
    mapping(uint256 => uint256) private _filecoinStorageIds;
    mapping(uint256 => bool) private _cdnEnabled;
    mapping(bytes32 => uint256[]) private _gameAssets;
    mapping(bytes32 => uint256[]) private _categoryAssets;
    
    // Mapping from owner to token IDs
    mapping(address => uint256[]) private _ownerAssets;
    
    // Modifiers
    modifier tokenExists(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _baseTokenURI = "https://api.playstorex.io/metadata/";
    }

    /**
     * @dev Mint a new gaming asset NFT
     * @param to Address to mint the NFT to
     * @param metadataHash IPFS hash pointing to metadata stored on Filecoin
     * @param filecoinStorageId Filecoin storage deal ID
     * @param cdnEnabled Whether CDN is enabled for fast retrieval
     * @return tokenId The ID of the newly minted token
     */
    function mintAsset(
        address to,
        string memory metadataHash,
        uint256 filecoinStorageId,
        bool cdnEnabled
    ) external override onlyOwner whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataHash).length > 0, "Metadata hash cannot be empty");
        require(filecoinStorageId > 0, "Filecoin storage ID must be valid");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataHash);

        _assetMetadataHashes[tokenId] = metadataHash;
        _filecoinStorageIds[tokenId] = filecoinStorageId;
        _cdnEnabled[tokenId] = cdnEnabled;

        emit AssetMinted(tokenId, to, metadataHash, filecoinStorageId, cdnEnabled);
        
        return tokenId;
    }

    /**
     * @dev Mint a new gaming asset NFT with full metadata
     * @param to Address to mint the NFT to
     * @param metadataURI IPFS/metadata URI for the asset
     * @param filecoinStorageId Filecoin storage deal ID
     * @param cdnEnabled Whether CDN is enabled for fast retrieval
     * @param name Asset name
     * @param description Asset description
     * @param category Asset category
     * @param gameId Game ID this asset belongs to
     * @param version Asset version
     * @return tokenId The ID of the newly minted token
     */
    function mintAssetWithMetadata(
        address to,
        string memory metadataURI,
        uint256 filecoinStorageId,
        bool cdnEnabled,
        string memory name,
        string memory description,
        string memory category,
        string memory gameId,
        string memory version
    ) external onlyOwner whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(filecoinStorageId > 0, "Filecoin storage ID must be valid");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");
        require(bytes(gameId).length > 0, "Game ID cannot be empty");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Store asset metadata
        _assetMetadata[tokenId] = AssetMetadata({
            name: name,
            description: description,
            category: category,
            gameId: gameId,
            version: version,
            filecoinStorageId: filecoinStorageId,
            cdnEnabled: cdnEnabled,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        // Add to game and category mappings
        _gameAssets[gameId].push(tokenId);
        _categoryAssets[category].push(tokenId);

        emit AssetMinted(tokenId, to, metadataURI, filecoinStorageId, cdnEnabled);
        
        return tokenId;
    }

    /**
     * @dev Transfer asset to another address
     * @param tokenId Token ID to transfer
     * @param to Address to transfer to
     */
    function transferAsset(uint256 tokenId, address to) external override tokenExists(tokenId) whenNotPaused {
        require(to != address(0), "Cannot transfer to zero address");
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");

        address from = ownerOf(tokenId);
        
        // Update owner mappings
        _removeFromOwnerAssets(from, tokenId);
        _ownerAssets[to].push(tokenId);

        _transfer(from, to, tokenId);

        emit AssetTransferred(tokenId, from, to);
    }

    /**
     * @dev Update asset metadata
     * @param tokenId Token ID to update
     * @param newMetadataURI New metadata URI
     */
    function updateMetadata(uint256 tokenId, string memory newMetadataURI) 
        external 
        override 
        tokenExists(tokenId) 
        whenNotPaused 
    {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");
        require(bytes(newMetadataURI).length > 0, "Metadata URI cannot be empty");

        _setTokenURI(tokenId, newMetadataURI);
        _assetMetadata[tokenId].updatedAt = block.timestamp;

        emit MetadataUpdated(tokenId, newMetadataURI);
    }

    /**
     * @dev Update asset metadata details
     * @param tokenId Token ID to update
     * @param name New asset name
     * @param description New asset description
     * @param category New asset category
     * @param gameId New game ID
     * @param version New asset version
     */
    function updateAssetDetails(
        uint256 tokenId,
        string memory name,
        string memory description,
        string memory category,
        string memory gameId,
        string memory version
    ) external tokenExists(tokenId) whenNotPaused {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");
        require(bytes(gameId).length > 0, "Game ID cannot be empty");

        AssetMetadata storage metadata = _assetMetadata[tokenId];
        
        // Update category mapping if changed
        if (keccak256(bytes(metadata.category)) != keccak256(bytes(category))) {
            _removeFromCategoryAssets(metadata.category, tokenId);
            _categoryAssets[category].push(tokenId);
        }
        
        // Update game mapping if changed
        if (keccak256(bytes(metadata.gameId)) != keccak256(bytes(gameId))) {
            _removeFromGameAssets(metadata.gameId, tokenId);
            _gameAssets[gameId].push(tokenId);
        }

        metadata.name = name;
        metadata.description = description;
        metadata.category = category;
        metadata.gameId = gameId;
        metadata.version = version;
        metadata.updatedAt = block.timestamp;
    }

    function getAssetMetadataHash(uint256 tokenId) external view tokenExists(tokenId) returns (string memory) {
        return _assetMetadataHashes[tokenId];
    }

    function getFilecoinStorageId(uint256 tokenId) external view override tokenExists(tokenId) returns (uint256) {
        return _filecoinStorageIds[tokenId];
    }

    function isCDNEnabled(uint256 tokenId) external view override tokenExists(tokenId) returns (bool) {
        return _cdnEnabled[tokenId];
    }

    function getAssetCount() external view override returns (uint256) {
        return _tokenIdCounter.current();
    }

    function getAssetsByOwner(address owner) external view override returns (uint256[] memory) {
        return _ownerAssets[owner];
    }

    function getAssetsByGame(string memory gameId) external view override returns (uint256[] memory) {
        bytes32 gameHash = keccak256(abi.encodePacked(gameId));
        return _gameAssets[gameHash];
    }

    function getAssetsByCategory(string memory category) external view override returns (uint256[] memory) {
        bytes32 categoryHash = keccak256(abi.encodePacked(category));
        return _categoryAssets[categoryHash];
    }


    // Internal helper functions
    function _removeFromOwnerAssets(address owner, uint256 tokenId) internal {
        uint256[] storage assets = _ownerAssets[owner];
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == tokenId) {
                assets[i] = assets[assets.length - 1];
                assets.pop();
                break;
            }
        }
    }

    function _removeFromGameAssets(string memory gameId, uint256 tokenId) internal {
        uint256[] storage assets = _gameAssets[gameId];
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == tokenId) {
                assets[i] = assets[assets.length - 1];
                assets.pop();
                break;
            }
        }
    }

    function _removeFromCategoryAssets(string memory category, uint256 tokenId) internal {
        uint256[] storage assets = _categoryAssets[category];
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == tokenId) {
                assets[i] = assets[assets.length - 1];
                assets.pop();
                break;
            }
        }
    }

    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0) && to != address(0)) {
            _removeFromOwnerAssets(from, tokenId);
            _ownerAssets[to].push(tokenId);
        } else if (to != address(0)) {
            _ownerAssets[to].push(tokenId);
        }
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Owner functions
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
