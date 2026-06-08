# Tricycle Franchise Rights Ledger

One-line description
--------------------
A Soroban-backed ledger where LGU-issued tricycle franchise rights are recorded on-chain and transfers finalize only after LGU approval.

## Problem
Local governments and tricycle operators lack a transparent, tamper-evident record for route franchise rights. Ownership transfers are often informal and disputed, which harms operators and creates enforcement problems for LGUs. This project provides an auditable on-chain record with an LGU approval workflow for transfers, improving transparency and reducing disputes — especially relevant in Philippine municipalities where tricycle franchising is common.

## How It Works
- An LGU admin deploys and initializes the Soroban contract with an admin address.
- The admin issues a franchise for a `route_id` to an `owner` address on-chain using `issue_franchise(route_id, owner)`.
- If an owner wants to transfer, they call `request_transfer(route_id, to)` which records a `pending` transfer (owner must sign).
- The LGU admin reviews and finalizes the transfer by calling `approve_transfer(route_id)` (admin must sign). Ownership updates on-chain only after approval.
- The frontend (Next.js) simulates Soroban transactions via the Soroban RPC, assembles them, and uses Freighter for signing.

## How It Uses Stellar
- Soroban contract (`contracts/savings-goal`) stores `FranchiseInfo` per `route_id`, enforces authorization via `Address::require_auth()`, and exposes: `init(admin)`, `issue_franchise(route_id, owner)`, `request_transfer(route_id, to)`, `approve_transfer(route_id)`, and `get_franchise(route_id)`.
- Frontend uses `@stellar/stellar-sdk` RPC methods (`server.simulateTransaction`, `rpc.assembleTransaction`) to build and simulate Soroban transactions before signing.
- Freighter (dynamic import) is used to sign transactions in the browser.
- Horizon / Stellar SDK are used for balances and account management where needed (e.g., funding test accounts with Friendbot).

Why Stellar: Soroban's on-chain contract model provides deterministic, auditable state and native transaction handling suited for this approval workflow. Using Stellar testnet and Freighter keeps user flows simple for demos.

## Track
Track 5 Social Impact

## Tech Stack
- Framework: Next.js 16 + React 19 + TypeScript
- Soroban contract: Rust with `soroban-sdk` (contract in `contracts/savings-goal`)
- Stellar SDK: `@stellar/stellar-sdk` v15.x
- Frontend styling: Tailwind CSS
- Network: testnet

## Setup & Run
Follow these steps to run the app locally and verify contract flows.

1. Clone the repo and install dependencies

```bash
git clone <your-repo-url>
cd "Project3 - Tricycle Franchise Token"

# frontend
cd web
npm install
```

2. Environment variables (create `web/.env.local` or set in your shell)

```
NEXT_PUBLIC_SOROBAN_RPC=https://soroban-testnet.stellar.org
# NEXT_PUBLIC_CONTRACT_ID will be written by the deploy script after deployment
# (or paste a deployed contract ID here if you already have one)
```

3. Run the frontend

```bash
cd web
npm run dev
# Open http://localhost:3000
```

4. Run contract tests

```powershell
cd contracts/savings-goal
cargo test
```

5. Deploy the contract (requires Stellar CLI and wasm target)

```powershell
# from the repo root (Windows PowerShell)
.\scripts\deploy.ps1    # this builds, deploys and writes NEXT_PUBLIC_CONTRACT_ID into web/.env.local

# macOS/Linux
./scripts/deploy.sh
```

After deploy, restart the frontend (`npm run dev`) so the app picks up `NEXT_PUBLIC_CONTRACT_ID`.

## Network Details
- Network: testnet
- RPC URL: https://soroban-testnet.stellar.org
- Contract IDs: (will be listed here after deployment)
- Asset issuers: N/A (no fiat/stable asset issuer used in the demo)

## Team
- [Your Full Name] — @[your-github-username]
- (Optional) [Teammate Name] — @[their-github-username]

## License
MIT

---

Replace `<your-repo-url>` and the bracketed placeholders with real values before publishing. For deployment and operational guidance, see `scripts/deploy.ps1` and `CLAUDE.md` in the repo.
