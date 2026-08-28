# 03 — System Architecture

## High-Level Architecture

The system follows a decentralized application (DApp) architecture where the blockchain smart contract is the authoritative source for all election and voting state.

```
User (Browser)
     ↓
Next.js / React Frontend (TypeScript)
     ↓
ethers.js (Web3 Library)
     ↓
MetaMask (Wallet / Signer)
     ↓
Ethereum JSON-RPC
     ↓
Smart Contract (Solidity)
     ↓
Blockchain State + Events
```

> See diagram: [01-system-architecture.mmd](./diagrams/01-system-architecture.mmd)

## Architecture Principles

### 1. Blockchain as Single Source of Truth
All election configuration, voter eligibility, ballot data, and vote tallies are stored on-chain. The frontend reads from and writes to the contract exclusively.

### 2. No Authoritative Off-Chain Database
There is no centralized database that stores votes, election results, or voter eligibility. If caching is introduced for performance, it is clearly labeled as non-authoritative.

### 3. Smart-Contract-First Enforcement
Every business rule (eligibility, deadlines, duplicate prevention, preference validation) is enforced in Solidity. Frontend checks are UX conveniences only.

### 4. Event-Driven Auditability
All state-changing operations emit indexed events. These events form the immutable audit trail and power the audit dashboard.

### 5. Modular Frontend Architecture
The frontend is organized by feature domain (admin, voter, results, audit) with shared hooks and components.

## Technology Architecture

### Smart Contract Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Language | Solidity ^0.8.x | Smart contract implementation |
| Framework | Hardhat | Compilation, testing, deployment |
| Testing | Chai + Mocha (via Hardhat) | Unit and integration tests |
| Network (Dev) | Hardhat Network | Local development blockchain |
| Network (Test) | Sepolia | Public testnet deployment |

### Frontend Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Next.js 14+ (App Router) | React framework with SSR/SSG |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Web3 | ethers.js v6 | Blockchain interaction |
| Wallet | MetaMask | Transaction signing |
| State | React Context + hooks | Application state management |

### Development & Deployment

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Version Control | Git / GitHub | Source management |
| Package Manager | npm | Dependency management |
| Environment | .env files | Secrets management |
| Documentation | Markdown + Mermaid | Engineering documentation |

## Contract Architecture

The smart contract system is designed as a single, well-structured contract (with potential for future modularization):

**`DecentraVote.sol`** — Primary contract managing:
- Election lifecycle
- Candidate registration
- Voter authorization
- Ballot submission and modification
- Vote tallying
- Tie-break resolution
- Access control
- Event emission

### Design Decision: Single vs. Multiple Contracts

For this academic prototype, a single contract is chosen because:
1. **Simplicity** — Reduces cross-contract call complexity and gas overhead
2. **Atomicity** — All state transitions happen within one contract
3. **Testability** — Easier to write comprehensive test suites
4. **Gas** — Avoids inter-contract call gas premium
5. **Academic scope** — Appropriate complexity level

The internal architecture uses well-separated concerns (structs, mappings, modifiers, events) so that future modularization into a factory pattern or proxy upgradeable contracts would be achievable.

## Data Flow

### Vote Submission Flow
```
Voter connects wallet
  → Frontend checks eligibility (UX only)
  → Voter selects preferences
  → Frontend calls contract.castBallot(electionId, pref1, pref2)
  → MetaMask prompts for transaction signature
  → Transaction submitted to blockchain
  → Contract validates (eligibility, election active, not already voted, valid candidates)
  → Contract stores ballot, updates tallies
  → Contract emits BallotCast event
  → Frontend listens for confirmation
  → UI updates with confirmation + tx hash
```

### Vote Modification Flow
```
Voter requests modification
  → Frontend calls contract.modifyBallot(electionId, newPref1, newPref2)
  → Contract validates (has existing ballot, election active, deadline not passed)
  → Contract decrements old tallies
  → Contract updates ballot preferences
  → Contract increments new tallies
  → Contract emits BallotModified event
  → Frontend confirms modification
```

> See diagrams: [04-voting-flow.mmd](./diagrams/04-voting-flow.mmd), [10-ballot-modification-sequence.mmd](./diagrams/10-ballot-modification-sequence.mmd)

## Proposed Directory Structure

```
/
├── contracts/                  # Solidity smart contracts
│   └── DecentraVote.sol
├── scripts/                    # Hardhat deployment scripts
│   ├── deploy.js
│   └── seed.js                 # Optional: seed data for development
├── test/                       # Smart contract tests (Hardhat/Chai/Mocha)
│   └── DecentraVote.test.js
├── app/                        # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx                # Landing page
│   ├── elections/
│   │   ├── page.tsx            # Election directory
│   │   └── [id]/
│   │       ├── page.tsx        # Election details
│   │       ├── vote/
│   │       │   └── page.tsx    # Voting interface
│   │       └── results/
│   │           └── page.tsx    # Results dashboard
│   ├── admin/
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── create/
│   │   │   └── page.tsx        # Create election
│   │   └── [id]/
│   │       └── page.tsx        # Manage election
│   └── audit/
│       └── page.tsx            # Audit dashboard
├── components/                 # Reusable React components
│   ├── layout/                 # Navigation, footer, sidebar
│   ├── ui/                     # Design system primitives
│   ├── wallet/                 # Wallet connection components
│   ├── election/               # Election-related components
│   ├── voting/                 # Ballot and voting components
│   ├── results/                # Results display components
│   └── admin/                  # Admin-specific components
├── hooks/                      # Custom React hooks
│   ├── useWallet.ts
│   ├── useContract.ts
│   ├── useElection.ts
│   └── useVoting.ts
├── lib/                        # Utilities and configuration
│   ├── contracts/              # ABI and contract addresses
│   ├── web3/                   # Web3 provider setup
│   └── utils/                  # General utilities
├── public/                     # Static assets
├── docs/                       # Engineering documentation
│   ├── diagrams/               # Mermaid source files
│   └── evidence/               # Evidence collection (post-deployment)
├── hardhat.config.js           # Hardhat configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
└── README.md                   # Project README
```

### Directory Structure Rationale

| Directory | Rationale |
|-----------|-----------|
| `contracts/` | Standard Hardhat convention for Solidity sources |
| `test/` | Standard Hardhat convention for contract tests |
| `scripts/` | Standard Hardhat convention for deployment scripts |
| `app/` | Next.js 14 App Router convention |
| `components/` | Feature-organized reusable components |
| `hooks/` | Custom React hooks for Web3 and contract interaction |
| `lib/` | Configuration, ABIs, utilities |
| `docs/` | Engineering documentation living alongside code |

This structure keeps smart contract development (Hardhat) and frontend development (Next.js) in a single monorepo, which is appropriate for the project's scale and team structure.
