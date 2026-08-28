# 08 — Data Model

## On-Chain Data (Authoritative)

All election-critical data lives on the blockchain. The smart contract is the single source of truth.

### Storage Layout

```
┌─────────────────────────────────────────────────────┐
│ DecentraVote Contract State                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  electionCount: uint256                             │
│                                                     │
│  elections: mapping(uint256 => Election)             │
│  ┌─────────────────────────────────────────┐        │
│  │ id, title, description                  │        │
│  │ startTime, endTime, status              │        │
│  │ maxPreferences, secondPreferenceEnabled │        │
│  │ tieBreakMode, candidateCount            │        │
│  │ totalVotes, creator                     │        │
│  │ resultStatus, winnerId                  │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  candidates: mapping(uint256 => mapping(            │
│                uint256 => Candidate))               │
│  ┌─────────────────────────────────────────┐        │
│  │ id, name, description                  │        │
│  │ primaryVotes, secondaryVotes            │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ballots: mapping(uint256 => mapping(               │
│             address => Ballot))                     │
│  ┌─────────────────────────────────────────┐        │
│  │ firstPreference, secondPreference       │        │
│  │ exists, timestamp                       │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  isEligibleVoter: mapping(uint256 => mapping(       │
│                     address => bool))               │
│                                                     │
│  eligibleVoterCount: mapping(uint256 => uint256)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Storage Slot Packing Analysis

**Election struct** (approximate slot usage):
| Field | Type | Bytes |
|-------|------|-------|
| id | uint256 | 32 (slot 1) |
| startTime | uint256 | 32 (slot 2) |
| endTime | uint256 | 32 (slot 3) |
| candidateCount | uint256 | 32 (slot 4) |
| totalVotes | uint256 | 32 (slot 5) |
| winnerId | uint256 | 32 (slot 6) |
| creator | address (20) + status (1) + maxPreferences (1) + secondPrefEnabled (1) + tieBreakMode (1) + resultStatus (1) | packed into slot 7 |
| title | string | dynamic slot |
| description | string | dynamic slot |

**Candidate struct:**
| Field | Type | Bytes |
|-------|------|-------|
| id | uint256 | 32 (slot 1) |
| primaryVotes | uint256 | 32 (slot 2) |
| secondaryVotes | uint256 | 32 (slot 3) |
| name | string | dynamic slot |
| description | string | dynamic slot |

**Ballot struct:**
| Field | Type | Bytes |
|-------|------|-------|
| firstPreference | uint256 | 32 (slot 1) |
| secondPreference | uint256 | 32 (slot 2) |
| exists (1) + timestamp can be packed | bool + uint256 | slots 3-4 |

## Event Data (Immutable History)

Events are NOT stored in contract state. They are emitted to transaction logs and are:
- Permanent (part of the blockchain)
- Indexable (via indexed parameters)
- Gas-cheap compared to storage
- Not readable by contracts (only by external applications)

### Event Usage

| Data | Storage Method | Rationale |
|------|---------------|-----------|
| Current ballot | Contract storage (mapping) | Needed for validation and tallying |
| Ballot history | Events (BallotCast, BallotModified) | Historical audit, no contract reads needed |
| Current tallies | Contract storage (Candidate struct) | Needed for result calculation |
| Election state | Contract storage (Election struct) | Needed for lifecycle enforcement |
| Voter eligibility | Contract storage (mapping) | Needed for validation |
| Action audit trail | Events | Transparency, frontend display |

## Off-Chain Data (Non-Authoritative)

The frontend may cache or derive data for UX purposes, but this is never authoritative:

| Data | Source | Purpose |
|------|--------|---------|
| Election list cache | Read from contract | Faster page loads |
| Event history | Queried from blockchain logs | Audit dashboard |
| Formatted timestamps | Derived from block timestamps | Human-readable display |
| Percentage calculations | Derived from on-chain tallies | Results visualization |
| Network/wallet state | MetaMask provider | Connection status |

## Key Relationships

```
Election (1) ──── (N) Candidate
Election (1) ──── (N) EligibleVoter (address)
Election (1) ──── (N) Ballot
Voter (1) ──── (0..1) Ballot per Election
Ballot (1) ──── (1) FirstPreference → Candidate
Ballot (1) ──── (0..1) SecondPreference → Candidate
```
