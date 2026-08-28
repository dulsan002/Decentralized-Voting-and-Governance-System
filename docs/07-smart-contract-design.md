# 07 — Smart Contract Design

## Contract Overview

**Contract Name:** `DecentraVote`  
**Solidity Version:** `^0.8.19`  
**License:** MIT

The contract manages the complete election lifecycle: creation, candidate registration, voter authorization, ballot submission, ballot modification, result tallying, tie detection, and tie-break resolution.

## Access Control Model

### Recommended: Role-Based Access Control (RBAC) via OpenZeppelin

**Decision:** Use `AccessControl` from OpenZeppelin rather than simple `Ownable`.

**Rationale:**
- `Ownable` provides only a single-owner model — insufficient for distinguishing between contract deployer and election organizers
- `AccessControl` allows defining multiple roles (e.g., `DEFAULT_ADMIN_ROLE`, `ORGANIZER_ROLE`)
- Supports future extensibility (e.g., auditor role, voter registrar role)
- Well-audited, industry-standard library

**Roles:**
```solidity
bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
```

- `DEFAULT_ADMIN_ROLE` — Can grant/revoke organizer roles. Assigned to deployer.
- `ORGANIZER_ROLE` — Can create elections, manage candidates, authorize voters, control lifecycle.

## Data Structures

### Enums

```solidity
enum ElectionStatus {
    Pending,    // Created but not yet active
    Active,     // Voting is open
    Ended,      // Voting closed, awaiting finalization
    Finalized   // Results calculated and locked
}

enum TieBreakMode {
    SecondPreference,  // Use 2nd preferences to break ties
    NoTieBreak         // Report tie without resolution
}

enum ResultStatus {
    None,                  // Not yet finalized
    PrimaryResult,         // Clear winner from primary count
    TieBreakResolved,      // Winner determined via tie-break
    ResolvedByFallback,    // Winner determined via fallback (earliest ID)
    TieUnresolved,         // Tie-break mode is NoTieBreak
    NoVotes                // No ballots were cast
}
```

### Structs

```solidity
struct Election {
    uint256 id;
    string title;
    string description;
    uint256 startTime;
    uint256 endTime;
    ElectionStatus status;
    uint8 maxPreferences;
    bool secondPreferenceEnabled;
    TieBreakMode tieBreakMode;
    uint256 candidateCount;
    uint256 totalVotes;
    address creator;
    ResultStatus resultStatus;
    uint256 winnerId;          // 0 if no winner determined
}

struct Candidate {
    uint256 id;
    string name;
    string description;
    uint256 primaryVotes;
    uint256 secondaryVotes;    // Tie-break preference count
}

struct Ballot {
    uint256 firstPreference;   // Candidate ID
    uint256 secondPreference;  // Candidate ID (0 = no preference)
    bool exists;
    uint256 timestamp;
}
```

### State Variables

```solidity
// Election storage
uint256 public electionCount;
mapping(uint256 => Election) public elections;

// Candidates: electionId => candidateId => Candidate
mapping(uint256 => mapping(uint256 => Candidate)) public candidates;

// Ballots: electionId => voterAddress => Ballot
mapping(uint256 => mapping(address => Ballot)) public ballots;

// Voter eligibility: electionId => voterAddress => isEligible
mapping(uint256 => mapping(address => bool)) public isEligibleVoter;

// Voter count per election (for gas-efficient eligibility tracking)
mapping(uint256 => uint256) public eligibleVoterCount;
```

## Events

```solidity
event ElectionCreated(
    uint256 indexed electionId,
    string title,
    address indexed creator,
    uint256 startTime,
    uint256 endTime
);

event CandidateAdded(
    uint256 indexed electionId,
    uint256 indexed candidateId,
    string name
);

event VoterAuthorized(
    uint256 indexed electionId,
    address indexed voter
);

event VoterRevoked(
    uint256 indexed electionId,
    address indexed voter
);

event ElectionStarted(
    uint256 indexed electionId,
    uint256 timestamp
);

event BallotCast(
    uint256 indexed electionId,
    address indexed voter,
    uint256 firstPreference,
    uint256 secondPreference,
    uint256 timestamp
);

event BallotModified(
    uint256 indexed electionId,
    address indexed voter,
    uint256 oldFirstPreference,
    uint256 oldSecondPreference,
    uint256 newFirstPreference,
    uint256 newSecondPreference,
    uint256 timestamp
);

event ElectionEnded(
    uint256 indexed electionId,
    uint256 timestamp
);

event ElectionFinalized(
    uint256 indexed electionId,
    uint256 winnerId,
    ResultStatus resultStatus,
    uint256 timestamp
);

event TieDetected(
    uint256 indexed electionId,
    uint256[] tiedCandidateIds
);
```

## Modifiers

```solidity
modifier electionExists(uint256 _electionId);
modifier onlyOrganizer();
modifier onlyElectionCreator(uint256 _electionId);
modifier inStatus(uint256 _electionId, ElectionStatus _status);
modifier isEligible(uint256 _electionId);
modifier electionActive(uint256 _electionId);
modifier hasNotVoted(uint256 _electionId);
modifier hasVoted(uint256 _electionId);
modifier validCandidate(uint256 _electionId, uint256 _candidateId);
```

## Functions

### Admin / Organizer Functions

| Function | Parameters | Access | Description |
|----------|-----------|--------|-------------|
| `createElection` | title, description, startTime, endTime, maxPreferences, secondPrefEnabled, tieBreakMode | Organizer | Create new election in Pending state |
| `addCandidate` | electionId, name, description | Election Creator | Add candidate to Pending election |
| `authorizeVoter` | electionId, voter | Election Creator | Grant voting eligibility |
| `authorizeVotersBatch` | electionId, voters[] | Election Creator | Batch authorize (gas consideration) |
| `revokeVoter` | electionId, voter | Election Creator | Revoke voting eligibility (Pending only) |
| `startElection` | electionId | Election Creator | Transition Pending → Active |
| `endElection` | electionId | Election Creator | Transition Active → Ended |
| `finalizeElection` | electionId | Election Creator | Calculate results, Ended → Finalized |

### Voter Functions

| Function | Parameters | Access | Description |
|----------|-----------|--------|-------------|
| `castBallot` | electionId, firstPref, secondPref | Eligible Voter | Submit new ballot |
| `modifyBallot` | electionId, newFirstPref, newSecondPref | Eligible Voter (has voted) | Update existing ballot |

### View Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getElection` | electionId | Election struct | Get election details |
| `getCandidate` | electionId, candidateId | Candidate struct | Get candidate details |
| `getAllCandidates` | electionId | Candidate[] | Get all candidates (bounded) |
| `getBallot` | electionId, voter | Ballot struct | Get voter's ballot |
| `getIsEligible` | electionId, voter | bool | Check voter eligibility |
| `getElectionResults` | electionId | Primary counts, result status, winner | Get result summary |
| `getElectionCount` | — | uint256 | Total elections created |

## Custom Errors (Gas-Efficient)

```solidity
error ElectionDoesNotExist(uint256 electionId);
error InvalidElectionStatus(uint256 electionId, ElectionStatus current, ElectionStatus required);
error NotElectionCreator(uint256 electionId, address caller);
error VoterNotEligible(uint256 electionId, address voter);
error AlreadyVoted(uint256 electionId, address voter);
error NotYetVoted(uint256 electionId, address voter);
error InvalidCandidate(uint256 electionId, uint256 candidateId);
error DuplicatePreference(uint256 candidateId);
error ElectionNotActive(uint256 electionId);
error ElectionAlreadyStarted(uint256 electionId);
error InvalidTimeRange(uint256 startTime, uint256 endTime);
error InsufficientCandidates(uint256 electionId, uint256 count);
error VoterAlreadyAuthorized(uint256 electionId, address voter);
error FirstPreferenceRequired();
```

## Gas Optimization Considerations

### Storage Efficiency
- Use `uint8` for `maxPreferences` (max 255, we need 2)
- Use enums which compile to `uint8`
- Pack struct fields to minimize storage slots
- Use custom errors instead of require strings (saves ~300 gas per revert)

### Tallying Strategy
- Maintain running tallies (increment/decrement on cast/modify) rather than iterating all ballots at finalization
- This avoids unbounded loops during finalization but costs slightly more per ballot operation
- **Trade-off accepted:** O(1) finalization is critical for gas predictability

### Batch Operations
- `authorizeVotersBatch` allows registering multiple voters in one transaction
- Internal loop is bounded by the input array size — the caller controls gas cost

### Event vs. Storage
- Historical data (modification history) is stored via events, not in contract storage
- Current ballot state is in storage for validation
- This minimizes storage cost while maintaining full auditability

## Finalization Algorithm (On-Chain)

```
function finalizeElection(electionId):
    require election is in Ended status
    
    // Step 1: Find max primary votes
    maxVotes = 0
    for each candidate:
        if candidate.primaryVotes > maxVotes:
            maxVotes = candidate.primaryVotes
    
    // Step 2: Identify tied leaders
    leaders = []
    for each candidate:
        if candidate.primaryVotes == maxVotes:
            leaders.push(candidateId)
    
    // Step 3: Determine result
    if totalVotes == 0:
        resultStatus = NoVotes
        winnerId = 0
    
    else if leaders.length == 1:
        resultStatus = PrimaryResult
        winnerId = leaders[0]
    
    else if tieBreakMode == NoTieBreak:
        resultStatus = TieUnresolved
        winnerId = 0
    
    else:  // SecondPreference tie-break
        emit TieDetected(electionId, leaders)
        
        // Find max secondary votes among leaders
        maxSecondary = 0
        for each leader:
            if candidates[leader].secondaryVotes > maxSecondary:
                maxSecondary = candidates[leader].secondaryVotes
        
        secondaryLeaders = []
        for each leader:
            if candidates[leader].secondaryVotes == maxSecondary:
                secondaryLeaders.push(leaderId)
        
        if secondaryLeaders.length == 1:
            resultStatus = TieBreakResolved
            winnerId = secondaryLeaders[0]
        else:
            // Fallback: earliest registered (lowest ID)
            resultStatus = ResolvedByFallback
            winnerId = min(secondaryLeaders)
    
    election.resultStatus = resultStatus
    election.winnerId = winnerId
    election.status = Finalized
    emit ElectionFinalized(electionId, winnerId, resultStatus)
```

### Gas Concern: Candidate Loop

The finalization loops over candidates. This is bounded by the number of candidates in the election. For academic elections with reasonable candidate counts (< 50), this is acceptable.

**Mitigation for production:**
- Cap maximum candidates per election
- Consider off-chain computation with on-chain verification (future enhancement)

## Secondary Vote Tracking

Secondary votes are tracked incrementally (same as primary votes):

**On `castBallot`:**
```
if secondPreference != 0:
    candidates[electionId][secondPreference].secondaryVotes++
```

**On `modifyBallot`:**
```
if oldSecondPreference != 0:
    candidates[electionId][oldSecondPreference].secondaryVotes--
if newSecondPreference != 0:
    candidates[electionId][newSecondPreference].secondaryVotes++
```

This ensures tie-break tallies are always current without requiring a separate counting pass.
