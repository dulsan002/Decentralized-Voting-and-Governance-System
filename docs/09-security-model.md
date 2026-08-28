# 09 — Security Model

## Threat Analysis

### T-01: Unauthorized Election Creation

| Aspect | Detail |
|--------|--------|
| **Threat** | Non-admin creates elections |
| **Risk** | High — spam elections, platform integrity compromise |
| **Control** | `ORGANIZER_ROLE` via OpenZeppelin AccessControl |
| **Implementation** | `onlyRole(ORGANIZER_ROLE)` modifier on `createElection` |
| **Test** | Attempt `createElection` from non-organizer wallet → expect revert |

### T-02: Unauthorized Voter Authorization

| Aspect | Detail |
|--------|--------|
| **Threat** | Non-creator authorizes voters for an election |
| **Risk** | High — ineligible voters could vote |
| **Control** | Election creator check modifier |
| **Implementation** | `onlyElectionCreator(electionId)` modifier |
| **Test** | Attempt `authorizeVoter` from non-creator → expect revert |

### T-03: Unauthorized Voting

| Aspect | Detail |
|--------|--------|
| **Threat** | Non-eligible address casts ballot |
| **Risk** | Critical — compromises election integrity |
| **Control** | Eligibility mapping check |
| **Implementation** | `isEligible(electionId)` modifier checks `isEligibleVoter[electionId][msg.sender]` |
| **Test** | Attempt `castBallot` from non-authorized address → expect revert |

### T-04: Duplicate Voting

| Aspect | Detail |
|--------|--------|
| **Threat** | Same address submits multiple ballots |
| **Risk** | Critical — inflates vote counts |
| **Control** | Ballot existence check |
| **Implementation** | `hasNotVoted(electionId)` modifier checks `ballots[electionId][msg.sender].exists` |
| **Test** | Attempt `castBallot` twice from same address → expect revert on second |

### T-05: Exceeding Preference Limit

| Aspect | Detail |
|--------|--------|
| **Threat** | Ballot contains more preferences than configured |
| **Risk** | Medium — violates election rules |
| **Control** | Function signature limits to exactly 2 parameters (firstPref, secondPref) |
| **Implementation** | Solidity function signature enforces parameter count |
| **Test** | Contract only accepts 2 preference parameters by design |

### T-06: Invalid Candidate ID

| Aspect | Detail |
|--------|--------|
| **Threat** | Ballot references non-existent candidate |
| **Risk** | High — corrupts tally data |
| **Control** | Candidate existence validation |
| **Implementation** | `validCandidate(electionId, candidateId)` modifier |
| **Test** | Attempt ballot with candidateId > candidateCount → expect revert |

### T-07: Duplicate Preference (Same Candidate Twice)

| Aspect | Detail |
|--------|--------|
| **Threat** | Voter selects same candidate for both preferences |
| **Risk** | Medium — logically invalid ballot |
| **Control** | Equality check |
| **Implementation** | `require(firstPref != secondPref)` when secondPref != 0 |
| **Test** | Attempt ballot with pref1 == pref2 → expect revert |

### T-08: Voting Before Election Starts

| Aspect | Detail |
|--------|--------|
| **Threat** | Ballot submitted before election is ACTIVE |
| **Risk** | High — premature voting |
| **Control** | Election status check |
| **Implementation** | `electionActive(electionId)` modifier |
| **Test** | Attempt `castBallot` on Pending election → expect revert |

### T-09: Voting After Deadline

| Aspect | Detail |
|--------|--------|
| **Threat** | Ballot submitted after election has ended |
| **Risk** | Critical — late votes alter results |
| **Control** | Election status check |
| **Implementation** | `electionActive(electionId)` modifier checks status == Active |
| **Test** | Attempt `castBallot` on Ended election → expect revert |

### T-10: Modification After Deadline

| Aspect | Detail |
|--------|--------|
| **Threat** | Voter modifies ballot after election ends |
| **Risk** | Critical — post-deadline manipulation |
| **Control** | Election status check on `modifyBallot` |
| **Implementation** | `electionActive(electionId)` modifier |
| **Test** | Attempt `modifyBallot` on Ended election → expect revert |

### T-11: Modifying Another Voter's Ballot

| Aspect | Detail |
|--------|--------|
| **Threat** | Address A modifies address B's ballot |
| **Risk** | Critical — vote manipulation |
| **Control** | `msg.sender` used as ballot key |
| **Implementation** | `ballots[electionId][msg.sender]` — only caller's own ballot is accessible |
| **Test** | No function parameter for voter address; inherently prevented |

### T-12: Unauthorized Result Manipulation

| Aspect | Detail |
|--------|--------|
| **Threat** | Non-creator finalizes election or alters results |
| **Risk** | Critical — election outcome manipulation |
| **Control** | Creator-only finalization |
| **Implementation** | `onlyElectionCreator(electionId)` on `finalizeElection` |
| **Test** | Attempt `finalizeElection` from non-creator → expect revert |

### T-13: Election State Manipulation

| Aspect | Detail |
|--------|--------|
| **Threat** | Skipping lifecycle states (e.g., Pending → Finalized) |
| **Risk** | High — bypasses voting period |
| **Control** | Status transition enforcement |
| **Implementation** | Each transition function checks current status via `inStatus` modifier |
| **Test** | Attempt to finalize a Pending election → expect revert |

### T-14: Reentrancy

| Aspect | Detail |
|--------|--------|
| **Threat** | Reentrant calls during state changes |
| **Risk** | Medium — state inconsistency |
| **Control** | Checks-Effects-Interactions pattern |
| **Implementation** | All state updates occur before any external calls. No ETH transfers in core functions. Consider `ReentrancyGuard` as additional safety. |
| **Test** | Review code pattern; add reentrancy guard if external calls are introduced |

### T-15: Integer Overflow/Underflow

| Aspect | Detail |
|--------|--------|
| **Threat** | Arithmetic overflow in vote tallies |
| **Risk** | Low (Solidity 0.8+ has built-in checks) |
| **Control** | Solidity 0.8.x built-in overflow/underflow protection |
| **Implementation** | Default behavior in Solidity ^0.8.0 |
| **Test** | Covered by compiler; verify no `unchecked` blocks in tally code |

### T-16: Denial of Service via Gas

| Aspect | Detail |
|--------|--------|
| **Threat** | Functions consume excessive gas (e.g., unbounded loops) |
| **Risk** | Medium — functions could become uncallable |
| **Control** | Bounded iterations, incremental tallying |
| **Implementation** | Finalization loops over candidates (bounded). No loops over voters. Batch voter authorization is caller-bounded. |
| **Test** | Test with maximum expected candidates |

### T-17: Frontend Manipulation

| Aspect | Detail |
|--------|--------|
| **Threat** | User bypasses frontend, calls contract directly with invalid data |
| **Risk** | High if relying on frontend validation |
| **Control** | All validation in smart contract |
| **Implementation** | Every business rule has a corresponding contract-level check |
| **Test** | Tests call contract directly (not via frontend) to verify enforcement |

### T-18: Private Key/Secret Exposure

| Aspect | Detail |
|--------|--------|
| **Threat** | Secrets committed to repository |
| **Risk** | Critical — fund theft, contract compromise |
| **Control** | Environment variables, .gitignore, .env.example |
| **Implementation** | `.env` files excluded from git. Only `.env.example` with placeholder values committed. |
| **Test** | Pre-commit review; no secrets in tracked files |

## Security Architecture Layers

```
Layer 1: Smart Contract (Authoritative)
  - Access control (RBAC)
  - State validation (modifiers)
  - Business rule enforcement
  - Custom error messages

Layer 2: Web3 / Transaction Layer
  - MetaMask transaction signing
  - User approval before execution
  - Transaction confirmation before UI update

Layer 3: Frontend (UX Only)
  - Pre-flight checks (eligibility, status)
  - User guidance and error messages
  - NOT a security boundary
```

## Privacy Considerations

> **Important Academic Limitation**

This system uses a public blockchain. The following privacy limitations exist:

1. **Wallet addresses are publicly visible** — Anyone can see which addresses voted
2. **Transactions are publicly inspectable** — Vote preferences are stored on-chain and can be read
3. **Votes are linkable to addresses** — This is NOT a secret ballot system
4. **The prototype prioritizes integrity, transparency, and auditability** over ballot secrecy

Production secret-ballot systems would require additional privacy-preserving technologies such as:
- Cryptographic commitments (commit-reveal schemes)
- Zero-knowledge proofs
- Homomorphic encryption
- Ring signatures or mixing protocols

These are out of scope for this academic prototype but are documented as known limitations.
