import { ethers } from 'ethers';

export const PLAYSTORE_X_ABI = [
  "function listAsset(string memory metadataHash, uint256 price, uint256 filecoinStorageId, bool cdnEnabled) external returns (uint256)",
  "function registerCreator(string memory metadataHash, uint256 feePercentage) external",
  "function updateAsset(uint256 assetId, uint256 newPrice, string memory newMetadataHash) external",
  "function delistAsset(uint256 assetId) external",
  "function purchaseAsset(uint256 assetId) external payable returns (uint256)",
  "function withdrawRevenue() external",
  "function getAssetInfo(uint256 assetId) external view returns (tuple(uint256 assetId, address creator, uint256 price, uint256 filecoinStorageId, bool cdnEnabled, bool isActive, uint256 createdAt, uint256 totalSales, uint256 totalRevenue))",
  "function getAssetMetadataHash(uint256 assetId) external view returns (string memory)",
  "function getCreatorMetadataHash(address creator) external view returns (string memory)",
  "function getCreatorRevenue(address creator) external view returns (uint256)",
  "function registeredCreators(address creator) external view returns (bool)",
  "event AssetListed(uint256 indexed assetId, address indexed creator, string metadataHash, uint256 price, uint256 filecoinStorageId, bool cdnEnabled)",
  "event AssetPurchased(uint256 indexed assetId, address indexed buyer, address indexed creator, uint256 price, uint256 timestamp)",
  "event CreatorRegistered(address indexed creator, string metadataHash, string description, uint256 feePercentage)",
  "event AssetUpdated(uint256 indexed assetId, uint256 newPrice, string newMetadataHash)",
  "event AssetDelisted(uint256 indexed assetId, address indexed creator)"
];

export const CONTRACT_ADDRESSES = {
  CALIBRATION: {
    PLAYSTORE_X: '0xA594a708B0240E24266d91ac990E40Eb2369Bd8C',
    USDFC: '0x80B98d3aa09ffff255c3ba4A241111Ff1262F045'
  },
  MAINNET: {
    PLAYSTORE_X: '0xA594a708B0240E24266d91ac990E40Eb2369Bd8C',
    USDFC: '0x...'
  }
};

export function getPlayStoreXContract(signer: ethers.Signer, network: 'calibration' | 'mainnet' = 'calibration') {
  const address = CONTRACT_ADDRESSES[network.toUpperCase() as keyof typeof CONTRACT_ADDRESSES].PLAYSTORE_X;
  if (!address || address === '0x...') {
    throw new Error('Contract address not set. Please update CONTRACT_ADDRESSES in contractUtils.ts');
  }
  return new ethers.Contract(address, PLAYSTORE_X_ABI, signer);
}
export async function listAsset(
  signer: ethers.Signer,
  metadataHash: string,
  priceInFIL: number,
  filecoinStorageId: string,
  cdnEnabled: boolean,
  network: 'calibration' | 'mainnet' = 'calibration'
) {
  const contract = getPlayStoreXContract(signer, network);
  const priceInWei = ethers.parseEther(priceInFIL.toString());
  const storageId = parseInt(filecoinStorageId, 10);
  
  const tx = await contract.listAsset(
    metadataHash,
    priceInWei,
    storageId,
    cdnEnabled
  );
  
  const receipt = await tx.wait();
  return receipt;
}
export async function registerCreator(
  signer: ethers.Signer,
  metadataHash: string,
  feePercentage: number = 0,
  network: 'calibration' | 'mainnet' = 'calibration'
) {
  const contract = getPlayStoreXContract(signer, network);
  
  const tx = await contract.registerCreator(
    metadataHash,
    feePercentage
  );
  
  const receipt = await tx.wait();
  return receipt;
}
export async function purchaseAsset(
  signer: ethers.Signer,
  assetId: number,
  priceInFIL: number,
  network: 'calibration' | 'mainnet' = 'calibration'
) {
  const contract = getPlayStoreXContract(signer, network);
  const priceInWei = ethers.parseEther(priceInFIL.toString());
  
  const tx = await contract.purchaseAsset(assetId, {
    value: priceInWei
  });
  
  const receipt = await tx.wait();
  return receipt;
}
export async function getAssetInfo(
  provider: ethers.Provider,
  assetId: number,
  network: 'calibration' | 'mainnet' = 'calibration'
) {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES[network.toUpperCase() as keyof typeof CONTRACT_ADDRESSES].PLAYSTORE_X,
    PLAYSTORE_X_ABI,
    provider
  );
  
  return await contract.getAssetInfo(assetId);
}
export async function getAssetMetadataHash(
  provider: ethers.Provider,
  assetId: number,
  network: 'calibration' | 'mainnet' = 'calibration'
) {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES[network.toUpperCase() as keyof typeof CONTRACT_ADDRESSES].PLAYSTORE_X,
    PLAYSTORE_X_ABI,
    provider
  );
  
  return await contract.getAssetMetadataHash(assetId);
}
export async function isCreatorRegistered(
  provider: ethers.Provider,
  address: string,
  network: 'calibration' | 'mainnet' = 'calibration'
) {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES[network.toUpperCase() as keyof typeof CONTRACT_ADDRESSES].PLAYSTORE_X,
    PLAYSTORE_X_ABI,
    provider
  );
  
  return await contract.registeredCreators(address);
}

export function formatFIL(wei: string | bigint): string {
  return ethers.formatEther(wei);
}

export function parseFIL(fil: string | number): bigint {
  return ethers.parseEther(fil.toString());
}
