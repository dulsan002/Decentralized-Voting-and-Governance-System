# Requirements Traceability Matrix

This matrix maps every assessment requirement to its system feature, smart contract function, frontend feature, test case(s), and evidence.

## Assessment Requirements Mapping

### REQ-01: Election Creation

| Aspect | Detail |
|--------|--------|
| **Assessment Requirement** | Allows authorized users to create elections/campaigns |
| **System Feature** | Election creation with title, description, timing, configuration |
| **Smart Contract Function** | `createElection()` |
| **Access Control** | `ORGANIZER_ROLE` via AccessControl |
| **Frontend Feature** | Admin → Create Election form |
| **Test Cases** | EM-01, EM-02, EM-03, AC-04, AC-05 |
| **Evidence** | Contract test output, admin UI screenshot, deployment tx |

### REQ-02: Verified Voting

| Aspect | Detail |
|--------|--------|
| **Assessment Requirement** | Allows verified blockchain addresses to vote |
| **System Feature** | Election-specific voter authorization + wallet-based ballot submission |
| **Smart Contract Function** | `authorizeVoter()`, `authorizeVotersBatch()`, `castBallot()` |
| **Frontend Feature** | Admin → Authorize Voters; Voter → Cast Ballot |
| **Test Cases** | VA-01 to VA-07, BS-01 to BS-03 |
| **Evidence** | Authorization tx, successful vote tx, eligibility check |

### REQ-03: Duplicate Vote Prevention

| Aspect | Detail |
|--------|--------|
| **Assessment Requirement** | Prevents duplicate voting from the same address |
| **System Feature** | Ballot existence mapping check |
| **Smart Contract Function** | `hasNotVoted` modifier in `castBallot()` |
| **Frontend Feature** | UI shows "Already Voted" status; disables re-submission |
| **Test Cases** | BS-04 |
| **Evidence** | Contract revert on duplicate, test output, UI screenshot |

### REQ-04: Editable Vote Before Deadline

| Aspect | Detail |
|--------|--------|
| **Assessment Requirement** | Allows voters to modify their vote before the deadline |
| **System Feature** | Ballot modification with tally correction |
| **Smart Contract Function** | `modifyBallot()` |
| **Enforcement** | `electionActive` modifier rejects post-deadline modification |
| **Frontend Feature** | Voter → Modify Ballot page with current preferences |
| **Test Cases** | BM-01 to BM-08 |
| **Evidence** | Modification tx, tally update, BallotModified event, deadline revert |

### REQ-05: Immutable Records

| Aspect | Detail |
|--------|--------|
| **Assessment Requirement** | Records voting activity immutably on-chain |
| **System Feature** | Blockchain events for all state changes |
| **Smart Contract Events** | `BallotCast`, `BallotModified`, `ElectionCreated`, `VoterAuthorized`, `ElectionStarted`, `ElectionEnded`, `ElectionFinalized` |
| **Frontend Feature** | Audit dashboard displaying event history |
| **Test Cases** | All tests verify event emission |
| **Evidence** | Event log queries, audit UI screenshot, blockchain explorer |

### REQ-06: Automatic Results

| Aspect | Detail |
|--------|--------|
| **Assessment Requirement** | Automatically calculates and displays election results |
| **System Feature** | Incremental tally + finalization algorithm |
| **Smart Contract Function** | `finalizeElection()` (calculates from stored tallies) |
| **Result Logic** | Primary count → tie detection → tie-break → fallback |
| **Frontend Feature** | Results dashboard with primary counts, tie status, winner |
| **Test Cases** | RC-01 to RC-10 |
| **Evidence** | Finalization tx, ResultStatus, test output, results UI |

### REQ-07: Transparency & Auditability

| Aspect | Detail |
|--------|--------|
| **Assessment Requirement** | Provides transparency and auditability |
| **System Feature** | Public on-chain data + event audit trail + transparent result display |
| **Smart Contract** | All state is public; all changes emit events |
| **Frontend Feature** | Audit dashboard, results breakdown, tx hash links |
| **Test Cases** | All event tests; audit display tests |
| **Evidence** | Audit UI, blockchain explorer links, event query results |

### REQ-08: Smart Contract Governance

| Aspect | Detail |
|--------|--------|
| **Assessment Requirement** | Uses smart contracts to manage election logic and voting rules |
| **System Feature** | All business rules enforced in Solidity |
| **Smart Contract** | Modifiers, require statements, custom errors |
| **Enforcement areas** | Eligibility, deadlines, duplicates, preferences, lifecycle, access |
| **Frontend Feature** | Frontend validation is UX-only; contract is authoritative |
| **Test Cases** | All failure-path tests demonstrate contract enforcement |
| **Evidence** | Contract source, revert test results, comparison of frontend vs contract validation |

---

## Lecturer Emphasis Areas

### Security
| Requirement | Implementation | Evidence |
|------------|---------------|----------|
| Smart contract security | AccessControl, modifiers, custom errors, CEI pattern | Security model doc, threat analysis, revert tests |

### Gas Fees
| Requirement | Implementation | Evidence |
|------------|---------------|----------|
| Gas optimization | Custom errors, incremental tallying, struct packing, events for history | Gas report from tests, optimization documentation |

### Scalability
| Requirement | Implementation | Evidence |
|------------|---------------|----------|
| Scalable design | O(1) vote access, bounded finalization, batch operations, no voter loops | Scalability analysis doc, architecture documentation |

### Decentralized Trust
| Requirement | Implementation | Evidence |
|------------|---------------|----------|
| Blockchain as authority | No authoritative database, contract-first enforcement, public state | Architecture documentation, data flow diagrams |

---

## Matrix Summary

| Req ID | Requirement | Contract | Frontend | Tests | Status |
|--------|------------|----------|----------|-------|--------|
| REQ-01 | Election creation | `createElection` | Create Election page | EM-01–EM-03, AC-04–AC-05 | Designed |
| REQ-02 | Verified voting | `authorizeVoter`, `castBallot` | Auth + Ballot UI | VA-01–VA-07, BS-01–BS-03 | Designed |
| REQ-03 | Duplicate prevention | `hasNotVoted` modifier | Already Voted UI | BS-04 | Designed |
| REQ-04 | Editable vote | `modifyBallot` | Modify Ballot UI | BM-01–BM-08 | Designed |
| REQ-05 | Immutable records | Events | Audit dashboard | Event tests | Designed |
| REQ-06 | Automatic results | `finalizeElection` | Results dashboard | RC-01–RC-10 | Designed |
| REQ-07 | Transparency | Public state + events | Audit + Results UI | All tests | Designed |
| REQ-08 | Smart contract governance | All modifiers/checks | Contract-first | All failure tests | Designed |

> **Status Legend:** Designed → Implemented → Tested → Deployed → Evidenced
