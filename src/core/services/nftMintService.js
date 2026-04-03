/**
 * NFT Mint Service — frontend helpers for Agent NFT minting on Base.
 * Uses ethers.js 6 human-readable ABI.
 */

import { ethers } from 'ethers';

const CONTRACT_ADDRESS = import.meta.env.VITE_AGENT_NFT_CONTRACT || '';
const NFT_ENABLED = import.meta.env.VITE_NFT_MINTING_ENABLED === 'true';

const ABI = [
  'function mint(uint256 amount) external payable',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function mintPrice() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function mintedPerWallet(address) view returns (uint256)',
  'function mintingEnabled() view returns (bool)',
  'function maxPerWallet() view returns (uint256)',
];

const STANDARD_AGENT_ID = 1;

export function isNftMintingEnabled() {
  return NFT_ENABLED && !!CONTRACT_ADDRESS;
}

export async function getAgentNftBalance(provider, walletAddress) {
  if (!isNftMintingEnabled()) return 999;
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  return Number(await contract.balanceOf(walletAddress, STANDARD_AGENT_ID));
}

export async function getMintPrice(provider) {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  return await contract.mintPrice();
}

export async function getMintInfo(provider) {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  const [price, totalMinted, maxSupply, enabled, maxPerWallet] = await Promise.all([
    contract.mintPrice(),
    contract.totalMinted(),
    contract.maxSupply(),
    contract.mintingEnabled(),
    contract.maxPerWallet(),
  ]);
  return {
    price,
    totalMinted: Number(totalMinted),
    maxSupply: Number(maxSupply),
    mintingEnabled: enabled,
    maxPerWallet: Number(maxPerWallet),
  };
}

export async function mintAgentNft(signer, amount = 1) {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  const price = await contract.mintPrice();
  const tx = await contract.mint(amount, { value: price * BigInt(amount) });
  const receipt = await tx.wait();
  return { txHash: receipt.hash, success: true };
}
