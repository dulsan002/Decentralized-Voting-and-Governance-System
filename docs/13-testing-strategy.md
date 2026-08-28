# 13 — Testing Strategy

## Testing Principles

1. **Contract tests BEFORE frontend** — Smart contracts must be fully tested before frontend integration
2. **Test failures, not just successes** — Every happy path has corresponding failure/revert tests
3. **Test against contract directly** — Tests call Solidity functions, not frontend code
4. **Deterministic tests** — Use Hardhat time manipulation for deadline testing
5. **Evidence-based** — All test results must be capturable as evidence

## Testing Framework

| Component | Tool | Purpose |
|-----------|------|---------|
| Test Runner | Hardhat | Ethereum test environment |
| Assertions | Chai (`expect`) | Assertion library |
| Matchers | `@nomicfoundation/hardhat-chai-matchers` | Revert, event, and balance matchers |
| Time Control | Hardhat `time` helpers | Manipulate block timestamps |
| Network | Hardhat Network | In-memory local blockchain |

## Test Categories

### Category 1: Election Management

| Test ID | Scenario | Type | Expected Result |
|---------|----------|------|-----------------|
| EM-01 | Create election with valid params | Happy | Election created, event emitted |
| EM-02 | Create election as non-organizer | Failure | Revert: AccessControl |
| EM-03 | Create election with endTime ≤ startTime | Failure | Revert: InvalidTimeRange |
| EM-04 | Add candidate to pending election | Happy | Candidate added, event emitted |
| EM-05 | Add candidate to active election | Failure | Revert: InvalidElectionStatus |
| EM-06 | Add candidate as non-creator | Failure | Revert: NotElectionCreator |
| EM-07 | Start election with ≥ 2 candidates | Happy | Status → Active, event emitted |
| EM-08 | Start election with < 2 candidates | Failure | Revert: InsufficientCandidates |
| EM-09 | Start already active election | Failure | Revert: InvalidElectionStatus |
| EM-10 | End active election | Happy | Status → Ended, event emitted |
| EM-11 | End non-active election | Failure | Revert: InvalidElectionStatus |

### Category 2: Voter Authorization

| Test ID | Scenario | Type | Expected Result |
|---------|----------|------|-----------------|
| VA-01 | Authorize voter for election | Happy | Voter eligible, event emitted |
| VA-02 | Authorize voter as non-creator | Failure | Revert: NotElectionCreator |
| VA-03 | Authorize already-authorized voter | Failure | Revert: VoterAlreadyAuthorized |
| VA-04 | Batch authorize voters | Happy | All voters eligible |
| VA-05 | Revoke voter authorization | Happy | Voter no longer eligible, event emitted |
| VA-06 | Check eligibility (eligible) | Happy | Returns true |
| VA-07 | Check eligibility (not eligible) | Happy | Returns false |

### Category 3: Ballot Submission

| Test ID | Scenario | Type | Expected Result |
|---------|----------|------|-----------------|
| BS-01 | Cast ballot with 1st and 2nd preference | Happy | Ballot stored, tallies updated, event emitted |
| BS-02 | Cast ballot with 1st preference only | Happy | Ballot stored, primary tally updated |
| BS-03 | Cast ballot as non-eligible voter | Failure | Revert: VoterNotEligible |
| BS-04 | Cast duplicate ballot (already voted) | Failure | Revert: AlreadyVoted |
| BS-05 | Cast ballot with invalid candidate ID | Failure | Revert: InvalidCandidate |
| BS-06 | Cast ballot with same candidate for both preferences | Failure | Revert: DuplicatePreference |
| BS-07 | Cast ballot on non-active election | Failure | Revert: ElectionNotActive |
| BS-08 | Cast ballot with 0 as first preference | Failure | Revert: FirstPreferenceRequired |
| BS-09 | Cast ballot updates primary tally correctly | Happy | Candidate primaryVotes incremented |
| BS-10 | Cast ballot updates secondary tally correctly | Happy | Candidate secondaryVotes incremented |

### Category 4: Ballot Modification

| Test ID | Scenario | Type | Expected Result |
|---------|----------|------|-----------------|
| BM-01 | Modify existing ballot with new preferences | Happy | Ballot updated, tallies adjusted, event emitted |
| BM-02 | Modify ballot when no existing ballot | Failure | Revert: NotYetVoted |
| BM-03 | Modify ballot after election ended | Failure | Revert: ElectionNotActive |
| BM-04 | Modify ballot with invalid candidate | Failure | Revert: InvalidCandidate |
| BM-05 | Modify ballot with same candidate twice | Failure | Revert: DuplicatePreference |
| BM-06 | Modify ballot decrements old tallies | Happy | Old candidate votes decremented |
| BM-07 | Modify ballot increments new tallies | Happy | New candidate votes incremented |
| BM-08 | Modify ballot emits correct old/new preferences | Happy | Event contains old and new data |

### Category 5: Result Calculation

| Test ID | Scenario | Type | Expected Result |
|---------|----------|------|-----------------|
| RC-01 | Finalize with clear primary winner | Happy | PrimaryResult, correct winnerId |
| RC-02 | Finalize with primary tie → tie-break resolves | Happy | TieBreakResolved, correct winnerId |
| RC-03 | Finalize with primary tie → tie-break also tied → fallback | Happy | ResolvedByFallback, lowest ID wins |
| RC-04 | Finalize with no votes | Happy | NoVotes, winnerId = 0 |
| RC-05 | Finalize with tie-break mode NoTieBreak | Happy | TieUnresolved, winnerId = 0 |
| RC-06 | Finalize election not in Ended status | Failure | Revert: InvalidElectionStatus |
| RC-07 | Finalize as non-creator | Failure | Revert: NotElectionCreator |
| RC-08 | Three-way tie with different secondary counts | Happy | Candidate with most secondaries wins |
| RC-09 | Tie where no ballots have second preferences | Happy | ResolvedByFallback |
| RC-10 | TieDetected event emitted with correct candidates | Happy | Event contains tied candidate IDs |

### Category 6: Access Control

| Test ID | Scenario | Type | Expected Result |
|---------|----------|------|-----------------|
| AC-01 | Deploy assigns admin role to deployer | Happy | Deployer has DEFAULT_ADMIN_ROLE |
| AC-02 | Admin grants organizer role | Happy | New address has ORGANIZER_ROLE |
| AC-03 | Non-admin cannot grant organizer role | Failure | Revert: AccessControl |
| AC-04 | Organizer creates election | Happy | Election created |
| AC-05 | Non-organizer cannot create election | Failure | Revert: AccessControl |

### Category 7: Edge Cases

| Test ID | Scenario | Type | Expected Result |
|---------|----------|------|-----------------|
| EC-01 | Election with exactly 2 candidates | Happy | Normal operation |
| EC-02 | Election with maximum candidates | Happy | Normal operation |
| EC-03 | Single voter in election | Happy | Clear winner |
| EC-04 | All voters choose same candidate | Happy | Unanimous winner |
| EC-05 | Ballot modification multiple times | Happy | Tallies always correct |
| EC-06 | Second preference for non-tied candidate in tie-break | Happy | Correctly excluded |

## Test Execution Plan

### Phase 3: Contract Implementation
Run all Category 1–7 tests after contract implementation.

### Phase 4: Security Review
Run full test suite with additional adversarial scenarios.

### Phase 11: Testnet Deployment
Manual end-to-end testing on Sepolia.

## Test Evidence Template

| Field | Description |
|-------|-------------|
| Test ID | Unique identifier |
| Scenario | What is being tested |
| Precondition | Setup state |
| Action | Function call |
| Expected Result | What should happen |
| Actual Result | What happened (filled post-execution) |
| Status | Pass / Fail (filled post-execution) |
| Gas Used | Gas consumption (filled post-execution) |
