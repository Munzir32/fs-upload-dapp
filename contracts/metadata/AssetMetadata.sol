// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AssetMetadata
 * @dev Example metadata structure to be stored on Filecoin
 * @dev This is a reference for frontend developers on how to structure metadata
 * @author PlayStoreX Team
 */
library AssetMetadata {
    // Example JSON structure to be stored on Filecoin:
    /*
    {
        "name": "Epic Dragon Sword",
        "description": "A legendary sword forged in the fires of Mount Doom...",
        "category": "Weapons",
        "game": "Fantasy RPG",
        "tags": ["sword", "fire", "legendary", "damage"],
        "version": "1.0.0",
        "fileSize": "2.3 MB",
        "image": "ipfs://QmHash...",
        "gallery": [
            "ipfs://QmHash1...",
            "ipfs://QmHash2...",
            "ipfs://QmHash3..."
        ],
        "attributes": [
            {
                "trait_type": "Damage",
                "value": "100"
            },
            {
                "trait_type": "Rarity",
                "value": "Legendary"
            }
        ],
        "creator": {
            "name": "GameMaster",
            "address": "0x...",
            "verified": true
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
    }
    */
    
    // Example Creator metadata structure:
    /*
    {
        "name": "GameMaster",
        "description": "Professional game asset creator with 5+ years experience",
        "avatar": "ipfs://QmAvatarHash...",
        "banner": "ipfs://QmBannerHash...",
        "socialLinks": {
            "twitter": "https://twitter.com/gamemaster",
            "discord": "https://discord.gg/gamemaster",
            "website": "https://gamemaster.io"
        },
        "verified": true,
        "totalAssets": 25,
        "totalSales": 1250,
        "rating": 4.8,
        "joinedAt": "2023-06-01T00:00:00Z"
    }
    */
}
