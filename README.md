# PrimeLaunch

PrimeLaunch is a confidential ERC7984 token launchpad. It lets any creator deploy a Zama FHEVM-powered token by only providing a name and symbol. Each deployment mints a fixed 10,000,000,000 unit supply to the creator and exposes a freemint entrypoint so communities can mint more at any time. The front end lists every deployed token directly from the factory, so there is no reliance on manual curation or mock data.

## Overview

- **Goal**: make confidential ERC7984 token launches as simple as filling two fields while keeping supply rules consistent.
- **Contracts**: a factory that deploys ERC7984 tokens with a fixed default supply plus a token contract inspired by cUSDT-style behavior, including encrypted balances and a permissionless freemint.
- **Frontend**: React + Vite experience that reads token metadata from the factory (via viem) and writes transactions (via ethers). Users can deploy, browse, and mint without touching environment variables or localhost networks.
- **Networks**: developed against Hardhat locally and intended for Sepolia. Frontend addresses and ABIs come from `deployments/sepolia`.

## Why PrimeLaunch / Problems Solved

- Lowers the barrier to experimenting with confidential assets by standardizing token deployment and metadata tracking.
- Enforces a predictable default supply (10B units) while still allowing community-driven distribution through freemint.
- Removes custom indexers: the factory itself is the single source of truth for every token’s name, symbol, creator, supply, and timestamp.
- Separates read and write responsibilities (viem for reads, ethers for writes) to keep the UI responsive while handling encrypted transactions.

## Key Advantages

- One-click ERC7984 deployment with automatic initial mint to the creator.
- Public token registry via `getAllTokens` with filtering by creator for personalized dashboards.
- Permissionless freemint per token, callable from the UI or directly on-chain.
- Built on Zama’s FHEVM, keeping balances encrypted while retaining ERC7984 ergonomics.
- Ready-to-verify ABIs stored under `deployments/sepolia`, avoiding mismatches between contracts and the frontend.

## Tech Stack

- **Smart contracts**: Solidity 0.8.27, ERC7984 via `confidential-contracts-v91`, Zama FHEVM (`@fhevm/solidity`, `@fhevm/hardhat-plugin`), Hardhat Deploy, TypeChain, Ethers v6.
- **Frontend**: React + Vite + TypeScript, RainbowKit + wagmi for wallet UX, viem for reads, ethers for writes, no Tailwind.
- **Tooling**: Hardhat for builds/tests/deploys, eslint/solhint/prettier for linting, solidity-coverage and gas reporter for insights.
- **Docs**: see `docs/zama_llm.md` and `docs/zama_doc_relayer.md` for FHEVM relayer guidance.

## Repository Layout

- `contracts/PrimeLaunchFactory.sol`: deploys ERC7984 tokens with a fixed 10B supply, stores metadata, and emits creation events.
- `contracts/PrimeLaunchToken.sol`: confidential token with encrypted balances and a `freemint` entrypoint; mints initial supply to the creator.
- `deploy/deploy.ts`: Hardhat Deploy script that publishes the factory.
- `tasks/PrimeLaunch.ts`: helper tasks to print the factory address, deploy tokens, and list all deployed tokens.
- `test/PrimeLaunch.ts`: contract tests covering creation flow, initial supply, and freemint.
- `src/`: frontend (React + Vite) consuming the factory registry and token ABIs; update `src/src/config/contracts.ts` with deployed addresses/abis.
- `deployments/sepolia/`: canonical ABIs and deployment metadata that should be copied into the frontend config.

## How It Works

- **Deploy**: The factory creates a new `PrimeLaunchToken` when `createToken(name, symbol)` is called. It mints `DEFAULT_SUPPLY` (10,000,000,000 units) to the creator and records metadata.
- **Discover**: UIs and scripts read `getAllTokens`, `getTokensByCreator`, or `getToken(index)` to render token cards and stats.
- **Freemint**: Anyone can call `freemint(uint64 clearAmount)` on a token to mint more to themselves; the UI exposes this flow per token card.

## Getting Started

### Prerequisites

- Node.js 20+
- npm (project scripts assume npm)

### Install dependencies

```bash
# Contracts and backend tooling
npm install

# Frontend
cd src
npm install
```

### Environment configuration (contracts)

Create a `.env` in the repository root with:

```
PRIVATE_KEY=<deployer_private_key>   # required, do not use a mnemonic
INFURA_API_KEY=<infura_project_id>   # used for Sepolia RPC
ETHERSCAN_API_KEY=<optional_for_verify>
```

Hardhat config already loads these via `dotenv` and `process.env`. Frontend intentionally avoids environment variables; it reads from `src/src/config/contracts.ts` instead.

## Local Development (contracts)

- Compile: `npm run compile`
- Test: `npm run test`
- Coverage: `npm run coverage`
- Local node: `npm run chain` (Hardhat node) then `npm run deploy:localhost` to publish the factory.
- Tasks:
  - `npx hardhat prime-launch:address --network <network>`
  - `npx hardhat prime-launch:create --network <network> --name "Prime USD" --symbol PUSD`
  - `npx hardhat prime-launch:list --network <network>`

## Deploying to Sepolia

1. Ensure `.env` contains `PRIVATE_KEY` and `INFURA_API_KEY` (no mnemonic).
2. Deploy: `npm run deploy:sepolia`.
3. (Optional) Verify: `npm run verify:sepolia`.
4. Copy ABIs from `deployments/sepolia/*.json` into `src/src/config/contracts.ts` so the frontend stays in sync with on-chain contracts.
5. Update `FACTORY_ADDRESS` in `src/src/config/contracts.ts` to the deployed address (frontend will refuse to use a zero address).

## Frontend Usage

- Start the app: from `src/`, run `npm run dev` and connect a wallet (Sepolia). The UI will:
  - Deploy tokens through the factory using ethers (writes).
  - Read all token metadata with viem (reads with polling).
  - Allow freemint on any listed token.
- The frontend never points to a localhost chain; use a public network (Sepolia) with the configured factory address.

## Testing and Linting

- Contracts: `npm run test`, `npm run coverage`, `npm run lint`.
- Frontend: from `src/`, `npm run lint` for React/TypeScript rules.

## Future Plans

- Support multiple networks once additional FHEVM-capable testnets are available.
- Add token analytics (supply growth, mint history) using on-chain events.
- Optional metadata such as descriptions/icons stored off-chain and linked through the factory.
- UI enhancements: pagination for large token lists, search by name/symbol, and badge surfaces for recently deployed tokens.
- Deployment automation to sync ABIs and addresses into the frontend as part of the release pipeline.

## License

This project is licensed under the BSD-3-Clause-Clear License. See `LICENSE` for details.
