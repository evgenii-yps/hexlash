---
name: hexlash-web3
description: Hexlash Web3 integration — ERC-1155 NFT modules on Base chain, Coinbase Smart Wallet, x402 micropayments, Ethers.js, wallet connection, token balance. Use this skill when working on blockchain features, smart contracts, NFT minting, wallet integration, token balance, USDC payments, or any Web3-related code. Triggers on mentions of Web3, blockchain, NFT, wallet, contract, ERC-1155, Base, Base chain, USDC, x402, Ethers, ethers.js, token, mint, onchain, on-chain, crypto, connect wallet, disconnect wallet, smart wallet, Coinbase, Web3Modal, ABI, transaction, gas, signer, provider.
---

# Hexlash Web3 Integration

## Stack

- **Chain:** Base (Ethereum L2 by Coinbase)
- **Token Standard:** ERC-1155 (NFT modules)
- **Wallet:** Coinbase Smart Wallet
- **Payments:** x402 USDC micropayments
- **Client Library:** Ethers.js 6
- **Modal:** Web3Modal (wallet connection UI)

## Smart Contract

- 6 NFT module types (fighter archetypes)
- ABI files stored in `/src/assets/abi/` — DO NOT modify these files
- Contract interactions via Ethers.js provider/signer pattern

## Vuex Module: contractState

Located in `/src/core/state/modules/contractState.js`

Key state:
- `isConnected` — Wallet connection status
- `walletAddress` — Connected wallet address
- `tokenBalance` — Token balance (DECIMALS = 6)

Key actions:
- `connectWallet` — Initialize Web3Modal, connect to Base chain
- `disconnectWallet` — Disconnect wallet
- `getBalance` — Fetch token balance
- `mintModule` — Mint NFT module

## x402 Micropayments

- USDC payments on Base chain
- $0.01 per AI Trainer analysis
- Integrated with AI endpoints

## Token Constants

```js
DECIMALS = 6              // Token decimal places
LISTING = 1783306800      // Token listing timestamp
```

## Ethers.js Patterns

```js
// Provider (read-only)
const provider = new ethers.BrowserProvider(window.ethereum)

// Signer (write — requires wallet)
const signer = await provider.getSigner()

// Contract read
const contract = new ethers.Contract(address, abi, provider)
const balance = await contract.balanceOf(address, tokenId)

// Contract write
const contractWithSigner = new ethers.Contract(address, abi, signer)
const tx = await contractWithSigner.mint(to, id, amount, data)
await tx.wait()
```

## Cross-Project Ecosystem

The same NFT modules work across multiple projects:
- **Hexlash** — Fighting game (this project)
- **Clash of Coins** — Related game

Fighter archetypes (NFT modules) are shared between games.

## Key Files

| File | Location | Purpose |
|------|----------|---------|
| `contractState.js` | `/src/core/state/modules/` | Vuex Web3 state |
| ABI files | `/src/assets/abi/` | Smart contract interfaces |
| Wallet tab | `ProfileView.vue` | Wallet connect/disconnect UI |

## ProfileView Wallet Tab

- Connect/disconnect wallet button
- Display wallet address (truncated)
- Show token balance
- NFT module inventory

## Rules

- NEVER modify ABI files in `/src/assets/abi/`
- Always handle wallet connection errors gracefully
- Check `isConnected` before any contract interaction
- Display user-friendly errors for rejected transactions
- Use DECIMALS constant for token amount formatting
- Test with Base testnet before mainnet
