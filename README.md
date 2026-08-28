# DecentraVote

> A Blockchain-Based Decentralized Voting and Governance System

[![Module](https://img.shields.io/badge/Module-DAS5003-blue)]()
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-3C3C3D)]()
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.19-363636)]()
[![Next.js](https://img.shields.io/badge/Next.js-14+-black)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

---

## Overview

DecentraVote is a decentralized application (DApp) that enables transparent, auditable, and tamper-resistant elections on a public blockchain. Built for the **DAS5003 – Blockchain Fundamentals** module (Task 3.1b), the platform demonstrates how smart contracts can enforce election integrity without centralized authority.

### Key Features

- **Blockchain-Enforced Elections** — All election rules are enforced by Solidity smart contracts
- **Preferential Voting** — Single-ballot model with primary and optional secondary (tie-break) preference
- **Duplicate Vote Prevention** — One address, one active ballot per election
- **Ballot Modification** — Voters can change their vote before the deadline
- **Private & Immutable Audit Trail** — Voters see their own history; Admins see the full blockchain ledger
- **Dynamic Whitelisting & Auto-Funding** — Streamlined local testing scripts automatically whitelist and fund all database users
- **Role-Based Access Control** — Only authorized Organizers can manage election lifecycles
- **Automatic Result Tallying** — Results calculated on-chain including tie detection and preference-based tie-breaking
- **Transparent Results** — Full visibility into how winners are determined

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity ^0.8.20 |
| Contract Framework | Hardhat |
| Testing | Chai + Mocha |
| Frontend | Next.js 14+ (App Router) |
| Language | JavaScript / JSX |
| Styling | Tailwind CSS |
| Web3 | ethers.js v6 |
| Wallet | MetaMask |
| Testnet | Hardhat Local (development) |

## Project Structure

```
├── contracts/          # Solidity smart contracts
├── scripts/            # Deployment and funding scripts
├── test/               # Smart contract tests
├── app/                # Next.js pages (App Router)
├── components/         # React components
├── context/            # React context (Auth, Web3)
├── lib/                # Utilities, ABIs, Web3 config
├── docs/               # Engineering documentation
│   ├── diagrams/       # Mermaid architecture diagrams
│   └── evidence/       # Test & deployment evidence
└── public/             # Static assets
```

## Documentation

Full engineering documentation is available in [`/docs/`](./docs/README.md):

- [Project Overview](./docs/01-project-overview.md)
- [Requirements](./docs/02-requirements.md)
- [System Architecture](./docs/03-system-architecture.md)
- [User Roles & Use Cases](./docs/04-user-roles-and-use-cases.md)
- [Voting Model](./docs/05-voting-model.md)
- [Preferential Voting & Tie-Break](./docs/06-preferential-voting.md)
- [Smart Contract Design](./docs/07-smart-contract-design.md)
- [Data Model](./docs/08-data-model.md)
- [Security Model](./docs/09-security-model.md)
- [Gas & Scalability](./docs/10-gas-and-scalability.md)
- [Frontend Architecture](./docs/11-frontend-architecture.md)
- [Web3 Integration](./docs/12-web3-integration.md)
- [Testing Strategy](./docs/13-testing-strategy.md)
- [Deployment](./docs/14-deployment.md)
- [Known Limitations](./docs/15-known-limitations.md)
- [Demonstration Evidence](./docs/16-demonstration-evidence.md)
- [Requirements Traceability](./docs/requirements-traceability.md)

## Architecture Diagrams

17 Mermaid diagrams documenting every aspect of the system are in [`/docs/diagrams/`](./docs/diagrams/).

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MetaMask browser extension
- Git

### Development Setup

```bash
# Clone repository
git clone https://github.com/dulsan002/Decentralized-Voting-and-Governance-System.git
cd Decentralized-Voting-and-Governance-System

# Install dependencies
npm install

# Start local blockchain (Keep this terminal running)
npx hardhat node
```

In a **second terminal window**, initialize the blockchain state and start the app:

```bash
# Compile, deploy, dynamically whitelist users, and fund MetaMask wallets
npm run init:local

# Start frontend application
npm run dev
```

## Voting Model

DecentraVote uses a **configurable preferential voting model**:

1. Each voter casts **one ballot** with a mandatory 1st preference and optional 2nd preference
2. The **1st preference** is the primary counted vote
3. The **2nd preference** is NOT an additional vote — it is reserved for tie-breaking
4. If leading candidates are tied on primary votes, second preferences are evaluated
5. A deterministic fallback rule handles any remaining ties

> This model is inspired by preference-based voting and adapted for the academic prototype. It does not claim to replicate any specific national election law.

## Security

- Role-based access control (OpenZeppelin AccessControl)
- All validation enforced in smart contract (not frontend)
- 18 documented threat analyses with mitigations
- Custom errors for gas-efficient reverts
- Checks-Effects-Interactions pattern

## Academic Disclaimer

This is an academic prototype for educational purposes. It is **not** production-ready national election infrastructure. Key limitations include the absence of secret ballot (votes are publicly visible on-chain) and gas costs for large-scale elections. See [Known Limitations](./docs/15-known-limitations.md).

## License

MIT
