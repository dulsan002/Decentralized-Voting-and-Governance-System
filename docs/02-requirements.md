# 02 — Requirements Specification

## Functional Requirements

### FR-01: Election Creation
Authorized organizers must be able to create elections with a title, description, start time, end time, and configurable voting parameters.

### FR-02: Candidate Management
Organizers must be able to add candidates/options to an election before it becomes active.

### FR-03: Voter Authorization
Organizers must be able to authorize specific wallet addresses as eligible voters for a specific election. A connected wallet is NOT automatically eligible.

### FR-04: Voter Revocation
Organizers must be able to revoke voter eligibility before the election starts (design consideration: whether revocation is permitted during an active election).

### FR-05: Election Lifecycle
Elections must follow a managed lifecycle: `PENDING → ACTIVE → ENDED → FINALIZED`. Transitions must be enforced by the smart contract.

### FR-06: Preferential Ballot Submission
A verified voter must be able to cast a single ballot with a mandatory primary preference and an optional second preference.

### FR-07: Duplicate Vote Prevention
The same wallet address must not be able to submit more than one active ballot per election. The smart contract must reject duplicate ballot submissions.

### FR-08: Ballot Modification
A voter who has already cast a ballot must be able to modify their preferences before the election deadline. After the deadline, modification must be rejected by the contract.

### FR-09: Immutable Audit Trail
All significant actions (election creation, voter authorization, ballot cast, ballot modification, election finalization) must emit blockchain events that form a permanent, immutable record.

### FR-10: Automatic Result Calculation
The system must automatically maintain vote tallies. No manual result entry by administrators.

### FR-11: Primary Vote Tallying
The system must calculate and display primary preference totals for all candidates.

### FR-12: Tie Detection
The system must detect when two or more leading candidates have equal primary preference counts.

### FR-13: Tie-Break via Second Preference
When a tie is detected, the system must evaluate second preferences from eligible ballots according to the configured tie-breaking algorithm.

### FR-14: Final Result Determination
The system must produce a deterministic final result, including handling of edge cases (tie-break itself tied, no usable second preferences, etc.).

### FR-15: Wallet Connection
The DApp must support MetaMask wallet connection, disconnection, account switching, and network detection.

### FR-16: Transaction Feedback
The UI must accurately reflect transaction states: pending, confirmed, reverted. "Vote successful" must only display after blockchain confirmation.

### FR-17: Admin Dashboard
Organizers must have a dashboard for election creation, voter management, candidate management, and election monitoring.

### FR-18: Voter Dashboard
Voters must have a dashboard showing eligible elections, ballot status, voting history, and election results.

### FR-19: Results Dashboard
A transparent results dashboard must show primary counts, tie status, tie-break details, and final results with relevant blockchain evidence.

### FR-20: Audit Interface
An audit interface must display event history with event type, election, wallet address, timestamp, transaction hash, and block number.

---

## Non-Functional Requirements

### NFR-01: Security
All critical voting rules must be enforced on-chain. The frontend must never be the sole enforcement layer.

### NFR-02: Gas Efficiency
Minimize unnecessary storage writes, avoid unbounded loops, and document gas trade-offs. Core integrity rules must remain on-chain even if gas-expensive.

### NFR-03: Scalability
Architecture must consider large voter lists, many elections, event indexing, and frontend pagination. No centralized database as voting authority.

### NFR-04: Decentralized Trust
The blockchain must be the authoritative source of truth. Off-chain components are for UX only.

### NFR-05: Transparency
All voting data, election rules, and results must be publicly verifiable on-chain.

### NFR-06: Accessibility
WCAG-compliant contrast, keyboard navigation, semantic HTML, focus management, screen-reader support.

### NFR-07: Responsiveness
Full mobile, tablet, desktop, and large desktop support without horizontal scrolling during voting.

### NFR-08: Testability
All smart contract functions must be covered by automated tests. Test evidence must be captured.

### NFR-09: Maintainability
Modular architecture, clean separation of concerns, documented code, and Git-friendly structure.

### NFR-10: Privacy Transparency
The system must clearly document that votes on a public blockchain are not secret. No false anonymity claims.
