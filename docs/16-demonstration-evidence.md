# 16 — Demonstration Evidence Plan

## Purpose

This document defines what evidence must be captured during testing and deployment to support the final academic report. **No evidence should be fabricated.** All entries will be populated with real data during the appropriate development phase.

## Evidence Categories

### E-01: Requirements Evidence
**Location:** `/docs/evidence/01-requirements/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Requirements traceability matrix | Markdown | Phase 1 (updated ongoing) |
| Feature-to-contract mapping | Markdown | Phase 3 |

### E-02: Smart Contract Evidence
**Location:** `/docs/evidence/02-smart-contract/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Contract source code | .sol file | Phase 3 |
| Compilation output | Terminal screenshot | Phase 3 |
| Contract ABI | JSON | Phase 3 |
| Gas consumption report | Test output | Phase 4 |

### E-03: Wallet Integration Evidence
**Location:** `/docs/evidence/03-wallet/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| MetaMask connection flow | Screenshots | Phase 6 |
| Network switching | Screenshots | Phase 6 |
| Account change handling | Screenshots | Phase 6 |

### E-04: Voting Evidence
**Location:** `/docs/evidence/04-voting/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Ballot submission flow | Screenshots | Phase 8 |
| Transaction confirmation | Screenshots | Phase 8 |
| Duplicate vote rejection | Screenshots | Phase 8 |

### E-05: Vote Modification Evidence
**Location:** `/docs/evidence/05-vote-modification/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Ballot modification flow | Screenshots | Phase 8 |
| Pre/post modification state | Screenshots | Phase 8 |
| Post-deadline rejection | Screenshots | Phase 8 |

### E-06: Tie-Break Evidence
**Location:** `/docs/evidence/06-tie-break/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Tie detection display | Screenshots | Phase 9 |
| Tie-break calculation | Screenshots | Phase 9 |
| Fallback resolution | Screenshots | Phase 9 |

### E-07: Results Evidence
**Location:** `/docs/evidence/07-results/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Primary results dashboard | Screenshots | Phase 10 |
| Tie-break results display | Screenshots | Phase 10 |
| Result transparency view | Screenshots | Phase 10 |

### E-08: Audit Trail Evidence
**Location:** `/docs/evidence/08-audit/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Audit dashboard | Screenshots | Phase 10 |
| Event history display | Screenshots | Phase 10 |
| Transaction hash verification | Screenshots | Phase 10 |

### E-09: Testing Evidence
**Location:** `/docs/evidence/09-testing/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Full test suite output | Terminal output | Phase 3-4 |
| Test pass/fail summary | Markdown | Phase 4 |
| Gas usage per test | Test output | Phase 4 |

### E-10: Deployment Evidence
**Location:** `/docs/evidence/10-deployment/`

| Evidence | Format | Captured When |
|----------|--------|--------------|
| Sepolia deployment output | Terminal output | Phase 11 |
| Contract address | Text | Phase 11 |
| Deployment transaction hash | Text | Phase 11 |
| Etherscan verification | Screenshots | Phase 11 |
| End-to-end testnet test | Screenshots | Phase 11 |

---

*Evidence directories will be created when evidence capture begins. No placeholder or fabricated evidence will be added.*
