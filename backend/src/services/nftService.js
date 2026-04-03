/**
 * NFT Service — verifies Agent NFT ownership on Base chain.
 * Feature flag: NFT_MINTING_ENABLED. When disabled, all checks pass.
 */

const config = require('../config');

// Minimal ABI for balanceOf check
const ERC1155_BALANCE_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
];

const STANDARD_AGENT_TOKEN_ID = 1;

/**
 * Get Agent NFT balance for a wallet.
 * @param {string} walletAddress
 * @returns {number}
 */
async function getAgentNftBalance(walletAddress) {
  if (!config.NFT_MINTING_ENABLED || !config.AGENT_NFT_CONTRACT) return 999;

  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(config.BASE_RPC_URL);
    const contract = new ethers.Contract(config.AGENT_NFT_CONTRACT, ERC1155_BALANCE_ABI, provider);
    const balance = await contract.balanceOf(walletAddress, STANDARD_AGENT_TOKEN_ID);
    return Number(balance);
  } catch (err) {
    console.error('[NFT] Balance check failed:', err.message);
    return 0;
  }
}

/**
 * Check if user can create an agent (NFT requirement).
 * First agent is always free. Additional agents require NFT.
 * @param {string} walletAddress
 * @param {number} currentAgentCount
 * @returns {{ allowed: boolean, reason?: string, nftBalance: number }}
 */
async function checkMintRequirement(walletAddress, currentAgentCount) {
  if (!config.NFT_MINTING_ENABLED) return { allowed: true, nftBalance: 0 };

  // First agent is free
  if (currentAgentCount === 0) return { allowed: true, nftBalance: 0 };

  if (!walletAddress) {
    return { allowed: false, reason: 'Wallet not connected', nftBalance: 0 };
  }

  const nftBalance = await getAgentNftBalance(walletAddress);
  // Need 1 NFT per additional agent (agents 2+)
  const nftsNeeded = currentAgentCount; // already have `currentAgentCount` agents, need that many NFTs
  if (nftBalance < nftsNeeded) {
    return {
      allowed: false,
      reason: `Need ${nftsNeeded - nftBalance} more Agent NFT(s)`,
      nftBalance,
      nftsNeeded,
    };
  }

  return { allowed: true, nftBalance };
}

module.exports = { getAgentNftBalance, checkMintRequirement };
