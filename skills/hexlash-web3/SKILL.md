---
name: hexlash-web3
description: Web3-интеграция Hexlash — Base chain, кошелёк, NFT ERC-1155, x402 микроплатежи. Триггерится на web3, blockchain, Base, Ethereum, NFT, ERC-1155, wallet, кошелёк, ethers, wagmi, Coinbase, smart wallet, USDC, x402, micropayment, mint, token, contract, ABI, on-chain, viem. Грузить вместе с hexlash-dev. Для x402 endpoints — hexlash-api. Для UI кошелька — hexlash-vue + hexlash-design.
---

# hexlash-web3 — Web3 Integration

## Главное правило

Web3 — **тонкий слой поверх игры**, не ядро. Бой, прогрессия, статы работают **без кошелька**. Кошелёк нужен только для: NFT агентов (ERC-1155), x402 premium, баланс токена. **Не блокировать игровой flow требованием кошелька.**

---

## Стек

- **Сеть:** Base (L2 Ethereum, chain ID 8453)
- **Frontend:** `@wagmi/vue` + `@wagmi/core` + `viem` + `@reown/appkit` (AppKit, бывший WalletConnect)
- **Connectors:** injected, coinbaseWallet (smartWalletOnly), walletConnect
- **Backend:** `ethers.js 6` для on-chain checks (nftService)
- **NFT:** ERC-1155 (`HexlashAgents.json` ABI)
- **Платежи:** x402 protocol (USDC на Base, feature flag)

---

## Где живёт Web3 код

**Frontend:**
- `/src/core/web3/wagmiConfig.js` — Wagmi config (Base chain, 3 connectors)
- `/src/core/state/modules/contractState.js` — Vuex: legacy token purchase (BuyTokens **disabled**, Phase 2)
- `/src/core/services/contractService.js` — Legacy token contract (Ethereum mainnet, **disabled**)
- `/src/core/services/nftMintService.js` — Frontend NFT mint helpers
- `/src/assets/abi/abi.json` — Legacy token contract ABI
- `/src/assets/abi/HexlashAgents.json` — ERC-1155 Agent NFT ABI
- `/src/components/ProfileWallet.vue` — Wallet tab: ConnectWallet + GameBalanceCard
- `/src/components/ConnectWallet.vue` — Wallet modal: connector list, connecting, connected state

**Backend:**
- `/backend/src/middleware/x402.js` — x402 payment verification (feature flag)
- `/backend/src/services/nftService.js` — On-chain NFT balance check (Base, feature flag)
- `/backend/src/config.js` — NFT + x402 constants

---

## Текущее состояние (апрель 2026)

| Фича | Статус | Файлы |
|------|--------|-------|
| Wallet connect (wagmi) | **Работает** | wagmiConfig.js, ConnectWallet.vue |
| Token purchase (BuyTokens) | **Disabled** — не рендерится | contractState.js, contractService.js |
| Agent NFT (ERC-1155) | **Feature flag off** (`NFT_MINTING_ENABLED=false`) | nftService.js, agent.js |
| x402 premium reports | **Feature flag off** (`X402_ENABLED=false`), TODO on-chain verify | x402.js, ai.js |
| Game balance display | **Работает** | GameBalanceCard.vue |

**Roadmap (не реализовано):** mint NFT через UI, marketplace, cross-game inventory, season passes.

---

## Wagmi Config

```js
// /src/core/web3/wagmiConfig.js
chains: [base]
connectors: [injected(), coinbaseWallet({ smartWalletOnly }), walletConnect({ projectId })]
```

Единственная chain — **Base mainnet**. Для dev — переключить на Base Sepolia.

---

## NFT — ERC-1155 Agent Modules

- **Контракт:** адрес в `AGENT_NFT_CONTRACT` env
- **ABI:** `/src/assets/abi/HexlashAgents.json`
- **Backend check:** `nftService.getAgentNftBalance(wallet)` — если flag off, возвращает 999 (bypass)
- **Правило:** первый агент бесплатный, 2+ требуют NFT (когда flag включён)
- **6 типов** = 6 архетипов (standard token ID = 1)

---

## x402 — микроплатежи

- **Middleware:** `/backend/src/middleware/x402.js`
- **Flow:** нет `X-Payment-Tx` header → 402 с ценой/адресом → клиент платит → повторяет с tx hash
- **Replay protection:** Set of used tx hashes (in-memory, periodic cleanup)
- **TODO:** on-chain verification (сейчас принимает любой валидный tx hash формат)
- **Feature flag:** `X402_ENABLED=false` → bypass (free preview)
- **Endpoints:** `POST /v1/ai/premium-report`

---

## Безопасность

- **Никогда** приватные ключи / seed phrases в коде или localStorage
- **Никогда** подписывать транзакции без UI-подтверждения
- **Суммы валидировать** на бэке через x402 middleware
- **Адреса контрактов** — через config/env, не хардкод
- **Amounts:** `BigInt` / `ethers.parseUnits`, **не `number`** (overflow)
- **WalletConnect projectId** — через `VITE_WALLETCONNECT_PROJECT_ID` env

---

## Тестирование

- **Dev:** Base Sepolia (chain ID 84532) + тестовые USDC из faucet
- **Никогда** mainnet с реальными деньгами в dev
- Перед прод — проверить адреса на mainnet
- Mock данные: `/src/core/mock/mockData.js`

---

## Запрещено

- Хардкодить приватные ключи / seed phrases
- Хардкодить адреса контрактов (через config)
- `number` для сумм токенов (только BigInt / parseUnits)
- Блокировать игру требованием кошелька
- Автоматически открывать модалку кошелька при загрузке
- Тестировать на mainnet с реальными средствами
- Подписывать tx без UI-подтверждения
- Описывать roadmap как реализованное
- Дублировать ABI

---

## Чеклист

- [ ] Прочитан реальный код
- [ ] ABI обновлён если контракт менялся
- [ ] Адреса через config/env
- [ ] Суммы через BigInt
- [ ] x402: синхронизированы middleware и клиент
- [ ] UI → чеклист `hexlash-design`
- [ ] Тестирование на Base Sepolia
- [ ] Игра работает без кошелька
- [ ] Ошибки RPC gracefully

---

## Где что искать

| Хочешь | Файл |
|--------|------|
| Wagmi config | `/src/core/web3/wagmiConfig.js` |
| Vuex кошелёк (legacy) | `/src/core/state/modules/contractState.js` |
| ABI контрактов | `/src/assets/abi/` |
| x402 middleware | `/backend/src/middleware/x402.js` |
| NFT balance check | `/backend/src/services/nftService.js` |
| Backend constants | `/backend/src/config.js` |
| UI кошелька | ConnectWallet.vue, ProfileWallet.vue |
| Frontend mint | `/src/core/services/nftMintService.js` |

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-api` — для x402 endpoints
- `hexlash-vue` — для UI кошелька
- `hexlash-design` — для UI правил
- `hexlash-deploy` — для prod env (адреса, сети)
