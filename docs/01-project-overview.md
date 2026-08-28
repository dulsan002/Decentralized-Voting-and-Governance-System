# 01 — Project Overview

## Project Name

**DecentraVote** — A Blockchain-Based Decentralized Voting and Governance System

## Academic Context

| Field | Detail |
|-------|--------|
| Module | DAS5003 – Blockchain Fundamentals |
| Assessment | Task 3.1(b) – Decentralized Voting and Governance System |
| Type | Group project (three engineering roles) |
| Blockchain | Ethereum-compatible (Sepolia testnet) |

## Vision

DecentraVote is a decentralized application (DApp) that enables transparent, auditable, and tamper-resistant elections on a public blockchain. The platform allows authorized organizers to create elections, register verified voters, and conduct preferential voting — all enforced by smart contracts rather than centralized authorities.

## Core Principles

1. **Blockchain as Authority** — The smart contract is the single source of truth for election state, ballot data, and results. No centralized database holds authoritative voting data.

2. **Smart-Contract Enforcement** — All critical rules (eligibility, deadlines, duplicate prevention, vote modification constraints) are enforced in Solidity, not merely in the frontend.

3. **Transparency & Auditability** — Every election action emits blockchain events. The full history of ballot submissions, modifications, and election state transitions is permanently recorded.

4. **Preferential Ballot Model** — Inspired by preference-based voting systems, each voter casts a single ballot containing a primary preference and an optional second preference used for configurable tie-breaking.

5. **Academic Integrity** — This is an academic prototype. No fabricated data, fake contributors, or unsupported claims about production readiness.

## Scope

### In Scope

- Election creation and lifecycle management
- Candidate registration
- Election-specific voter authorization
- Preferential ballot submission (1st + optional 2nd preference)
- Duplicate vote prevention (one active ballot per address per election)
- Ballot modification before deadline
- Automatic primary result tallying
- Tie detection and configurable second-preference tie-breaking
- Immutable audit trail via blockchain events
- Admin and voter dashboards
- MetaMask wallet integration
- Sepolia testnet deployment

### Out of Scope

- Secret ballot / zero-knowledge voting (documented as limitation)
- Production-grade national election infrastructure
- Advanced cryptographic privacy mechanisms
- Token-weighted or quadratic voting
- Cross-chain interoperability
- Mobile native applications (responsive web only)

## Voting Model Summary

This project uses a **configurable preferential voting model** inspired by preference-based voting and adapted specifically for the academic prototype.

- Each voter receives **one ballot** per election
- The ballot contains a **primary preference** (the main counted vote) and an optional **second preference**
- The second preference does **not** count as an additional vote during normal tallying
- If a tie is detected among leading candidates after the primary count, the second preferences are evaluated according to the configured tie-breaking algorithm
- The system distinguishes **PRIMARY COUNT** from **PREFERENCE/TIE-BREAK COUNT** at every level: contract logic, UI, results dashboard, documentation, and tests

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Web3 | ethers.js |
| Wallet | MetaMask |
| Smart Contracts | Solidity |
| Development Framework | Hardhat |
| Testing | Hardhat, Chai, Mocha |
| Blockchain | Ethereum-compatible (Sepolia testnet) |
| Version Control | Git / GitHub |
| Documentation | Markdown, Mermaid |

## Team Structure

The project is architecturally structured for three engineering roles:

| Role | Responsibility Domain |
|------|----------------------|
| Smart Contract Lead | Solidity contracts, testing, security, gas optimization |
| Frontend & Web3 Lead | Next.js/React UI, MetaMask integration, ethers.js |
| Integration & QA Lead | End-to-end testing, deployment, CI/CD, documentation |

Roles overlap intentionally. Each team member must understand the full system.

> **Note:** Actual development contributions are documented separately. No fabricated team contributions exist in this codebase.
