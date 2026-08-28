# 05 — Voting Model

## Overview

DecentraVote implements a **single-ballot preferential voting model**. Each voter receives one ballot per election. The ballot captures a mandatory primary preference and an optional secondary preference.

## Core Principles

### One Address, One Ballot
Each wallet address can submit exactly **one active ballot** per election. This satisfies the assessment requirement: "one address, one counted vote."

### NOT Two Independent Votes
The second preference is **not** a separate vote. It is a preference indicator within the same ballot. The system does NOT give each voter two independent votes to distribute freely.

### Preferences Are Ranked
- **1st Preference** — The voter's primary choice. This is counted directly in the main tally.
- **2nd Preference** — The voter's fallback choice. This is NOT counted during normal tallying. It is reserved for the tie-break mechanism.

## Ballot Structure

```
┌──────────────────────────────────┐
│          VOTER BALLOT            │
│──────────────────────────────────│
│  Election: [Election Title]      │
│  Voter:    0xABC...DEF           │
│──────────────────────────────────│
│                                  │
│  1st Preference (Primary Vote)   │
│  ┌────────────────────────────┐  │
│  │  ○ Candidate A             │  │
│  │  ● Candidate B  ← selected│  │
│  │  ○ Candidate C             │  │
│  │  ○ Candidate D             │  │
│  └────────────────────────────┘  │
│                                  │
│  2nd Preference (Tie-Break)      │
│  ┌────────────────────────────┐  │
│  │  ○ Candidate A             │  │
│  │  ○ Candidate B  (disabled) │  │
│  │  ● Candidate D  ← selected│  │
│  │  ○ None                    │  │
│  └────────────────────────────┘  │
│                                  │
│  ⚠ Your 2nd preference is NOT   │
│    an additional vote. It is     │
│    used only for tie-breaking.   │
│                                  │
│  [ REVIEW BALLOT ]               │
└──────────────────────────────────┘
```

## Ballot Validation Rules

| Rule | Enforcement |
|------|-------------|
| Primary preference is mandatory | Smart contract reverts if 0 or invalid |
| Second preference is optional | Smart contract accepts 0 (no preference) |
| Preferences must be valid candidate IDs | Smart contract validates against election candidates |
| Preferences must not be the same candidate | Smart contract reverts if pref1 == pref2 |
| Only authorized voters can submit | Smart contract checks eligibility mapping |
| Election must be ACTIVE | Smart contract checks election state |
| Voter must not have existing ballot (for castBallot) | Smart contract checks hasVoted mapping |
| Voter must HAVE existing ballot (for modifyBallot) | Smart contract checks hasVoted mapping |

## Ballot Lifecycle

```
No Ballot
    ↓  castBallot()
Ballot Active
    ↓  modifyBallot() [0..n times while ACTIVE]
Ballot Active (updated)
    ↓  Election ends
Ballot Locked (immutable)
    ↓  Election finalized
Ballot Counted in Result
```

## Vote Counting

### Phase 1: Primary Count
- Each voter's **1st preference** is counted as one vote for the selected candidate
- The primary count produces the main result

### Phase 2: Tie Detection
- After the primary count, the system identifies the top candidates
- If two or more candidates share the highest primary vote count → **TIE DETECTED**
- If one candidate has a clear lead → **PRIMARY RESULT** (winner determined)

### Phase 3: Tie-Break (Conditional)
- Only triggered when Phase 2 detects a tie
- Second preferences are evaluated according to the configured algorithm
- See [06-preferential-voting.md](./06-preferential-voting.md) for the complete tie-break algorithm

## Example Scenario

### Election: University Governance Election

**Candidates:** A, B, C, D

**Ballots:**

| Voter | 1st Preference | 2nd Preference |
|-------|---------------|----------------|
| 0x001 | A | C |
| 0x002 | A | B |
| 0x003 | B | A |
| 0x004 | B | C |
| 0x005 | C | A |

**Primary Count:**
- A: 2 votes
- B: 2 votes
- C: 1 vote
- D: 0 votes

**Tie Detected:** A and B both have 2 primary votes.

**Tie-Break Evaluation:**
- Count second preferences for tied candidates (A and B) from ALL ballots
- A received as 2nd preference: from 0x003 (1) + 0x005 (1) = 2
- B received as 2nd preference: from 0x002 (1) = 1

**Result:** Candidate A wins the tie-break (2 > 1).

## Vote Modification

A voter can modify their ballot while the election is ACTIVE:

1. Old preferences are decremented from tallies
2. New preferences are stored
3. New preferences are incremented in tallies
4. `BallotModified` event emitted with old and new preferences
5. Original `BallotCast` event remains in blockchain history

The current ballot state always reflects the latest modification. The blockchain event history preserves the complete audit trail.
