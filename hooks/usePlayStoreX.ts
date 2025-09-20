import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { contractAddress } from '@/contract/contractAddress';
import ABI from '@/contract/abi.json';

export interface ContractEvent {
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: number;
}

export const usePlayStoreX = () => {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addEvent = useCallback((type: ContractEvent['type'], message: string) => {
    setEvents(prev => [...prev, {
      type,
      message,
      timestamp: Date.now()
    }]);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getContract = useCallback((signer: ethers.Signer) => {
    return new ethers.Contract(contractAddress, ABI, signer);
  }, []);

  const checkCreatorRegistration = useCallback(async (contract: ethers.Contract, address: string) => {
    addEvent('info', '👤 Checking creator registration...');
    return await contract.registeredCreators(address);
  }, [addEvent]);

  const registerCreator = useCallback(async (
    contract: ethers.Contract, 
    creatorMetadataHash: string, 
    feePercentage: number = 0
  ) => {
    addEvent('info', '📋 Registering creator on blockchain...');
    const tx = await contract.registerCreator(creatorMetadataHash, feePercentage);
    addEvent('info', '⏳ Waiting for creator registration confirmation...');
    const receipt = await tx.wait();
    addEvent('success', '✅ Creator registered successfully!');
    return receipt;
  }, [addEvent]);

  const listAsset = useCallback(async (
    contract: ethers.Contract,
    metadataHash: string,
    priceInWei: bigint,
    storageId: number,
    cdnEnabled: boolean
  ) => {
    addEvent('info', '🎮 Listing asset on marketplace...');
    const tx = await contract.listAsset(metadataHash, priceInWei, storageId, cdnEnabled);
    addEvent('info', '⏳ Waiting for asset listing confirmation...');
    const receipt = await tx.wait();
    
    const assetId = receipt.logs[0]?.args?.assetId?.toString() || "1";
    addEvent('success', `🎉 Asset listed successfully! Asset ID: ${assetId}`);
    
    return { receipt, assetId, txHash: tx.hash };
  }, [addEvent]);

  const purchaseAsset = useCallback(async (
    contract: ethers.Contract,
    assetId: number,
    priceInWei: bigint
  ) => {
    addEvent('info', '🛒 Purchasing asset...');
    const tx = await contract.purchaseAsset(assetId, { value: priceInWei });
    addEvent('info', '⏳ Waiting for purchase confirmation...');
    const receipt = await tx.wait();
    addEvent('success', '✅ Asset purchased successfully!');
    return { receipt, txHash: tx.hash };
  }, [addEvent]);

  const getAssetInfo = useCallback(async (contract: ethers.Contract, assetId: number) => {
    addEvent('info', `📋 Fetching asset info for ID: ${assetId}`);
    return await contract.getAssetInfo(assetId);
  }, [addEvent]);

  const getAssetMetadataHash = useCallback(async (contract: ethers.Contract, assetId: number) => {
    addEvent('info', `🔗 Fetching metadata hash for asset ID: ${assetId}`);
    return await contract.getAssetMetadataHash(assetId);
  }, [addEvent]);

  return {
    events,
    isLoading,
    setIsLoading,
    addEvent,
    clearEvents,
    getContract,
    checkCreatorRegistration,
    registerCreator,
    listAsset,
    purchaseAsset,
    getAssetInfo,
    getAssetMetadataHash
  };
};
