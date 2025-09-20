import { ethers } from 'ethers';

/**
 * Check USDFC balance for a given address
 */
export const checkUSDFCBalance = async (
  provider: ethers.Provider,
  address: string
): Promise<{
  balance: bigint;
  balanceFormatted: string;
  hasBalance: boolean;
}> => {
  try {
    // USDFC contract address on Filecoin Calibration
    const USDFC_ADDRESS = '0x80B98d3aa09ffff255c3ba4A241111Ff1262F045';
    
    // USDFC ABI (minimal for balance check)
    const USDFC_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    const usdfcContract = new ethers.Contract(USDFC_ADDRESS, USDFC_ABI, provider);
    
    const [balance, decimals] = await Promise.all([
      usdfcContract.balanceOf(address),
      usdfcContract.decimals()
    ]);
    
    const formattedBalance = ethers.formatUnits(balance, decimals);
    const hasBalance = balance > 0n;
    
    return {
      balance,
      balanceFormatted: formattedBalance,
      hasBalance
    };
  } catch (error) {
    console.error('Error checking USDFC balance:', error);
    return {
      balance: 0n,
      balanceFormatted: '0',
      hasBalance: false
    };
  }
};

/**
 * Check FIL balance for gas fees
 */
export const checkFILBalance = async (
  provider: ethers.Provider,
  address: string
): Promise<{
  balance: bigint;
  balanceFormatted: string;
  hasBalance: boolean;
}> => {
  try {
    const balance = await provider.getBalance(address);
    const formattedBalance = ethers.formatEther(balance);
    const hasBalance = balance > 0n;
    
    return {
      balance,
      balanceFormatted: formattedBalance,
      hasBalance
    };
  } catch (error) {
    console.error('Error checking FIL balance:', error);
    return {
      balance: 0n,
      balanceFormatted: '0',
      hasBalance: false
    };
  }
};
