# 06 — Preferential Voting & Tie-Break Algorithm

## Voting Model Origin

This project uses a **configurable preferential voting model** inspired by preference-based voting and adapted specifically for the academic prototype.

The system draws conceptual inspiration from preferential voting systems used in various democracies, including Sri Lanka's preference voting (விருப்ப வாக்கு / Viruppu Vaakku). However, this prototype does NOT claim to replicate any specific national election law.

> **Citation:** For authoritative information on Sri Lankan electoral practices, refer to the [Election Commission of Sri Lanka](https://elections.gov.lk).

## Configuration Model

The voting engine is configurable per election:

```
ElectionConfig {
    maxPreferences: uint8        // Maximum preferences per ballot (default: 2)
    secondPreferenceEnabled: bool // Whether 2nd preference is collected
    tieBreakMode: TieBreakMode   // Algorithm for resolving ties
}

enum TieBreakMode {
    SECOND_PREFERENCE,  // Use 2nd preferences to break ties (default)
    NO_TIE_BREAK        // Report tie without resolution
}
```

**Current academic configuration:**
- `maxPreferences = 2`
- `secondPreferenceEnabled = true`
- `tieBreakMode = SECOND_PREFERENCE`

The architecture is designed so that different governance rules could later be supported without fundamental contract redesign.

## Counting Algorithm

### Step 1: Primary Count

Count each ballot's **1st preference** as one vote for the chosen candidate.

```
for each ballot in election:
    primaryTally[ballot.firstPreference] += 1
```

### Step 2: Determine Leading Candidates

```
maxPrimaryVotes = max(primaryTally[candidate] for all candidates)
leaders = [c for c in candidates if primaryTally[c] == maxPrimaryVotes]
```

### Step 3: Check for Tie

```
if len(leaders) == 1:
    → WINNER = leaders[0]
    → STATUS = PRIMARY_RESULT
    → DONE

if len(leaders) > 1:
    → STATUS = TIE_DETECTED
    → Proceed to Step 4
```

### Step 4: Tie-Break Evaluation

**Only executed when `tieBreakMode == SECOND_PREFERENCE` and a tie exists.**

Count **second preferences** received by each tied candidate from **ALL ballots** in the election (not just ballots from tied candidates' supporters).

```
for each ballot in election:
    if ballot.secondPreference is a tied candidate:
        tieBreakTally[ballot.secondPreference] += 1
```

### Step 5: Resolve Tie-Break

```
maxTieBreakVotes = max(tieBreakTally[c] for c in leaders)
tieBreakWinners = [c for c in leaders if tieBreakTally[c] == maxTieBreakVotes]

if len(tieBreakWinners) == 1:
    → WINNER = tieBreakWinners[0]
    → STATUS = TIE_BREAK_RESOLVED
    → DONE

if len(tieBreakWinners) > 1:
    → STATUS = TIE_BREAK_UNRESOLVED
    → See Step 6
```

### Step 6: Unresolved Tie-Break Fallback

If the second-preference tie-break itself produces a tie:

**Fallback: Earliest Registration**

The candidate who was registered first (lowest candidate ID) is declared the winner.

```
winner = min(candidateId for candidateId in tieBreakWinners)
STATUS = RESOLVED_BY_FALLBACK
```

**Rationale:** This provides a deterministic, verifiable outcome without randomness. The "earliest registration" rule is transparent and auditable on-chain. This is an academic simplification; production systems might use other mechanisms.

---

## Edge Case Analysis

### EC-01: Voter selected same candidate for both preferences
**Prevention:** Smart contract reverts if `pref1 == pref2`.  
**Effect:** Cannot happen.

### EC-02: Second preference is blank (0)
**Treatment:** The ballot contributes to the primary count only. It produces no second-preference data. During tie-breaking, this ballot's second preference is ignored.

### EC-03: Second preference points to a non-tied candidate
**Treatment:** During tie-break evaluation, only second preferences pointing to a tied candidate are counted. Second preferences for non-tied candidates are irrelevant to the tie-break.

### EC-04: All second preferences point to non-tied candidates
**Treatment:** All tied candidates receive 0 tie-break votes. This triggers the fallback rule (Step 6 — earliest registration).

### EC-05: No ballots have second preferences at all
**Treatment:** Same as EC-04. Fallback rule applies.

### EC-06: Three or more candidates tied in primary
**Treatment:** The tie-break evaluates second preferences for ALL tied candidates simultaneously. The candidate among the tied group with the most second preferences wins. If multiple tied candidates share the highest second-preference count, the fallback applies.

### EC-07: Only one voter participated
**Treatment:** That voter's primary preference wins. No tie is possible. System functions normally.

### EC-08: No voters participated
**Treatment:** Election finalizes with zero votes. No winner declared. Status: `NO_VOTES`.

### EC-09: Two candidates, one voter, tie impossible
**Treatment:** Normal primary result.

### EC-10: Voter modifies ballot affecting tie-break data
**Treatment:** The contract decrements old tally data and increments new tally data. The tie-break evaluation always uses current tallies.

---

## Determinism Guarantee

Every possible input produces exactly one deterministic output. There is no randomness, no human judgment required, and no undefined state.

| Scenario | Outcome |
|----------|---------|
| Clear primary winner | Winner = highest primary votes |
| Primary tie, clear tie-break winner | Winner = highest 2nd preference among tied |
| Primary tie, tie-break also tied | Winner = earliest registered candidate (lowest ID) |
| Primary tie, no usable 2nd preferences | Winner = earliest registered candidate (lowest ID) |
| No votes | No winner declared |

## Display Requirements

The results dashboard must separately show:

1. **Primary Count Table** — All candidates with primary vote totals and percentages
2. **Tie Status** — Whether a tie was detected, and which candidates were tied
3. **Tie-Break Details** — (If applicable) Second-preference counts for tied candidates
4. **Final Result** — The determined winner with the resolution method used
5. **Resolution Method Label** — "Primary Result", "Tie-Break Result", or "Resolved by Fallback"

The counting process must be transparent. Users must understand HOW the winner was determined.
