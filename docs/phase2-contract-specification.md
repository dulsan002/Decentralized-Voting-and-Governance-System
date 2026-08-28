# Phase 2 — Smart Contract Detailed Specification

## Confirmed Design Decisions

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | Voters authorized during ACTIVE election | ✅ Yes |
| 2 | Voter revocation during ACTIVE | ❌ No — PENDING only |
| 3 | Live tallies during voting | ❌ No — after finalization |
| 4 | Election creator can vote | ✅ Yes, if authorized |
| 5 | Max candidates per election | 50 |

## Contract: DecentraVote.sol

**Solidity:** `^0.8.19`  
**License:** MIT  
**Imports:** OpenZeppelin `AccessControl`

---

## Storage Slot Layout

### Enums (compiled as uint8)

```solidity
enum ElectionStatus { Pending, Active, Ended, Finalized }        // 0-3
enum TieBreakMode { SecondPreference, NoTieBreak }                // 0-1
enum ResultStatus { None, PrimaryResult, TieBreakResolved,
                    ResolvedByFallback, TieUnresolved, NoVotes }  // 0-5
```

### Structs — Final Layout

```solidity
struct Election {
    // Slot 1: id
    uint256 id;
    // Slot 2: startTime
    uint256 startTime;
    // Slot 3: endTime
    uint256 endTime;
    // Slot 4: candidateCount
    uint256 candidateCount;
    // Slot 5: totalVotes
    uint256 totalVotes;
    // Slot 6: winnerId
    uint256 winnerId;
    // Slot 7: creator (20 bytes) + status (1) + maxPreferences (1) +
    //         secondPreferenceEnabled (1) + tieBreakMode (1) + resultStatus (1)
    //         = 25 bytes packed in one slot
    address creator;
    ElectionStatus status;
    uint8 maxPreferences;
    bool secondPreferenceEnabled;
    TieBreakMode tieBreakMode;
    ResultStatus resultStatus;
    // Dynamic slots: title, description (string pointers)
    string title;
    string description;
}

struct Candidate {
    // Slot 1: id
    uint256 id;
    // Slot 2: primaryVotes
    uint256 primaryVotes;
    // Slot 3: secondaryVotes
    uint256 secondaryVotes;
    // Dynamic: name, description
    string name;
    string description;
}

struct Ballot {
    // Slot 1: firstPreference
    uint256 firstPreference;
    // Slot 2: secondPreference
    uint256 secondPreference;
    // Slot 3: timestamp (32 bytes, but could pack exists as bool)
    uint256 timestamp;
    // Slot 4: exists
    bool exists;
}
```

### State Variables

```solidity
uint256 public electionCount;                                          // Slot after AccessControl
mapping(uint256 => Election) public elections;                         // electionId => Election
mapping(uint256 => mapping(uint256 => Candidate)) public candidates;   // electionId => candidateId => Candidate
mapping(uint256 => mapping(address => Ballot)) public ballots;         // electionId => voter => Ballot
mapping(uint256 => mapping(address => bool)) public isEligibleVoter;   // electionId => voter => eligible
mapping(uint256 => uint256) public eligibleVoterCount;                 // electionId => count

uint8 public constant MAX_CANDIDATES = 50;
```

---

## Events — Final Signatures

```solidity
event ElectionCreated(uint256 indexed electionId, string title, address indexed creator, uint256 startTime, uint256 endTime);
event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
event VoterAuthorized(uint256 indexed electionId, address indexed voter);
event VoterRevoked(uint256 indexed electionId, address indexed voter);
event ElectionStarted(uint256 indexed electionId, uint256 timestamp);
event BallotCast(uint256 indexed electionId, address indexed voter, uint256 firstPreference, uint256 secondPreference, uint256 timestamp);
event BallotModified(uint256 indexed electionId, address indexed voter, uint256 oldFirstPref, uint256 oldSecondPref, uint256 newFirstPref, uint256 newSecondPref, uint256 timestamp);
event ElectionEnded(uint256 indexed electionId, uint256 timestamp);
event ElectionFinalized(uint256 indexed electionId, uint256 winnerId, ResultStatus resultStatus, uint256 timestamp);
event TieDetected(uint256 indexed electionId, uint256 numTiedCandidates);
```

**Indexing strategy:** `electionId` indexed on ALL events for efficient per-election queries. `voter` indexed on ballot events. `candidateId` indexed on candidate events. Max 3 indexed params per event (EVM limit).

**Note on TieDetected:** Changed from `uint256[]` array to `uint256 numTiedCandidates` to avoid dynamic array in events (gas cost). The actual tied candidate IDs can be derived by reading candidate primaryVotes.

---

## Custom Errors

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
error InvalidTimeRange(uint256 startTime, uint256 endTime);
error InsufficientCandidates(uint256 electionId, uint256 count);
error VoterAlreadyAuthorized(uint256 electionId, address voter);
error VoterNotAuthorized(uint256 electionId, address voter);
error FirstPreferenceRequired();
error MaxCandidatesReached(uint256 electionId);
error ElectionAlreadyFinalized(uint256 electionId);
```

---

## Modifiers — Complete Logic

```solidity
modifier electionExists(uint256 _electionId) {
    if (_electionId == 0 || _electionId > electionCount)
        revert ElectionDoesNotExist(_electionId);
    _;
}

modifier onlyElectionCreator(uint256 _electionId) {
    if (elections[_electionId].creator != msg.sender)
        revert NotElectionCreator(_electionId, msg.sender);
    _;
}

modifier inStatus(uint256 _electionId, ElectionStatus _required) {
    if (elections[_electionId].status != _required)
        revert InvalidElectionStatus(_electionId, elections[_electionId].status, _required);
    _;
}

modifier electionActive(uint256 _electionId) {
    if (elections[_electionId].status != ElectionStatus.Active)
        revert ElectionNotActive(_electionId);
    _;
}

modifier isEligible(uint256 _electionId) {
    if (!isEligibleVoter[_electionId][msg.sender])
        revert VoterNotEligible(_electionId, msg.sender);
    _;
}

modifier hasNotVoted(uint256 _electionId) {
    if (ballots[_electionId][msg.sender].exists)
        revert AlreadyVoted(_electionId, msg.sender);
    _;
}

modifier hasVotedAlready(uint256 _electionId) {
    if (!ballots[_electionId][msg.sender].exists)
        revert NotYetVoted(_electionId, msg.sender);
    _;
}

modifier validCandidateId(uint256 _electionId, uint256 _candidateId) {
    if (_candidateId == 0 || _candidateId > elections[_electionId].candidateCount)
        revert InvalidCandidate(_electionId, _candidateId);
    _;
}
```

---

## Functions — Complete Signatures with NatSpec

### Constructor
```solidity
/// @notice Deploys DecentraVote and grants deployer admin + organizer roles
constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(ORGANIZER_ROLE, msg.sender);
}
```

### Admin Functions

```solidity
/// @notice Creates a new election
/// @param _title Election title
/// @param _description Election description
/// @param _startTime Unix timestamp when voting opens
/// @param _endTime Unix timestamp when voting closes
/// @param _secondPreferenceEnabled Whether 2nd preference is collected
/// @param _tieBreakMode Algorithm for resolving ties
/// @return electionId The ID of the created election
function createElection(
    string calldata _title,
    string calldata _description,
    uint256 _startTime,
    uint256 _endTime,
    bool _secondPreferenceEnabled,
    TieBreakMode _tieBreakMode
) external onlyRole(ORGANIZER_ROLE) returns (uint256);

/// @notice Adds a candidate to a pending election
function addCandidate(
    uint256 _electionId,
    string calldata _name,
    string calldata _description
) external electionExists(_electionId) onlyElectionCreator(_electionId) inStatus(_electionId, ElectionStatus.Pending);

/// @notice Authorizes a single voter for an election
function authorizeVoter(
    uint256 _electionId,
    address _voter
) external electionExists(_electionId) onlyElectionCreator(_electionId);
// Note: Allowed in Pending OR Active status

/// @notice Batch authorizes voters
function authorizeVotersBatch(
    uint256 _electionId,
    address[] calldata _voters
) external electionExists(_electionId) onlyElectionCreator(_electionId);

/// @notice Revokes voter authorization (Pending only)
function revokeVoter(
    uint256 _electionId,
    address _voter
) external electionExists(_electionId) onlyElectionCreator(_electionId) inStatus(_electionId, ElectionStatus.Pending);

/// @notice Transitions election from Pending to Active
function startElection(uint256 _electionId)
    external electionExists(_electionId) onlyElectionCreator(_electionId) inStatus(_electionId, ElectionStatus.Pending);

/// @notice Transitions election from Active to Ended
function endElection(uint256 _electionId)
    external electionExists(_electionId) onlyElectionCreator(_electionId) inStatus(_electionId, ElectionStatus.Active);

/// @notice Calculates results and transitions to Finalized
function finalizeElection(uint256 _electionId)
    external electionExists(_electionId) onlyElectionCreator(_electionId) inStatus(_electionId, ElectionStatus.Ended);
```

### Voter Functions

```solidity
/// @notice Casts a new ballot with preferences
/// @param _electionId Target election
/// @param _firstPreference Candidate ID for primary vote (required, > 0)
/// @param _secondPreference Candidate ID for tie-break preference (0 = none)
function castBallot(
    uint256 _electionId,
    uint256 _firstPreference,
    uint256 _secondPreference
) external
    electionExists(_electionId)
    electionActive(_electionId)
    isEligible(_electionId)
    hasNotVoted(_electionId);

/// @notice Modifies an existing ballot
function modifyBallot(
    uint256 _electionId,
    uint256 _newFirstPreference,
    uint256 _newSecondPreference
) external
    electionExists(_electionId)
    electionActive(_electionId)
    isEligible(_electionId)
    hasVotedAlready(_electionId);
```

### View Functions

```solidity
function getElection(uint256 _electionId) external view returns (Election memory);
function getCandidate(uint256 _electionId, uint256 _candidateId) external view returns (Candidate memory);
function getAllCandidates(uint256 _electionId) external view returns (Candidate[] memory);
function getBallot(uint256 _electionId, address _voter) external view returns (Ballot memory);
function getElectionCount() external view returns (uint256);
```

---

## Finalization Algorithm — Pseudocode

```
function finalizeElection(electionId):
    election = elections[electionId]
    
    // Edge case: no votes
    if election.totalVotes == 0:
        election.resultStatus = NoVotes
        election.winnerId = 0
        goto EMIT
    
    // Step 1: Find max primary votes
    maxVotes = 0
    for candidateId = 1 to election.candidateCount:
        if candidates[electionId][candidateId].primaryVotes > maxVotes:
            maxVotes = candidates[electionId][candidateId].primaryVotes
    
    // Step 2: Count leaders
    leaderCount = 0
    firstLeaderId = 0
    for candidateId = 1 to election.candidateCount:
        if candidates[electionId][candidateId].primaryVotes == maxVotes:
            leaderCount++
            if firstLeaderId == 0:
                firstLeaderId = candidateId
    
    // Step 3: Clear winner
    if leaderCount == 1:
        election.resultStatus = PrimaryResult
        election.winnerId = firstLeaderId
        goto EMIT
    
    // Step 4: Tie detected
    emit TieDetected(electionId, leaderCount)
    
    if election.tieBreakMode == NoTieBreak:
        election.resultStatus = TieUnresolved
        election.winnerId = 0
        goto EMIT
    
    // Step 5: Evaluate secondary votes for tied leaders
    maxSecondary = 0
    for candidateId = 1 to election.candidateCount:
        if candidates[electionId][candidateId].primaryVotes == maxVotes:
            if candidates[electionId][candidateId].secondaryVotes > maxSecondary:
                maxSecondary = candidates[electionId][candidateId].secondaryVotes
    
    // Step 6: Count secondary leaders
    secondaryLeaderCount = 0
    firstSecondaryLeaderId = 0
    for candidateId = 1 to election.candidateCount:
        if candidates[electionId][candidateId].primaryVotes == maxVotes:
            if candidates[electionId][candidateId].secondaryVotes == maxSecondary:
                secondaryLeaderCount++
                if firstSecondaryLeaderId == 0:
                    firstSecondaryLeaderId = candidateId
    
    // Step 7: Resolve
    if secondaryLeaderCount == 1:
        election.resultStatus = TieBreakResolved
        election.winnerId = firstSecondaryLeaderId
    else:
        // Fallback: lowest candidate ID among tied (firstSecondaryLeaderId is already lowest due to ascending loop)
        election.resultStatus = ResolvedByFallback
        election.winnerId = firstSecondaryLeaderId
    
    EMIT:
    election.status = Finalized
    emit ElectionFinalized(electionId, election.winnerId, election.resultStatus, block.timestamp)
```

**Gas note:** Two loops over candidates (max 50). Each loop: ~200 gas per iteration × 50 = ~10,000 gas per loop. Total finalization overhead: ~30,000-50,000 gas for loop logic. Acceptable.

---

## castBallot Internal Logic

```
function castBallot(electionId, firstPref, secondPref):
    // Modifiers already validated: exists, active, eligible, not voted
    
    if firstPref == 0: revert FirstPreferenceRequired
    if firstPref > election.candidateCount: revert InvalidCandidate
    if secondPref > election.candidateCount: revert InvalidCandidate
    if secondPref != 0 && firstPref == secondPref: revert DuplicatePreference
    
    // Store ballot
    ballots[electionId][msg.sender] = Ballot(firstPref, secondPref, block.timestamp, true)
    
    // Update tallies
    candidates[electionId][firstPref].primaryVotes++
    if secondPref != 0:
        candidates[electionId][secondPref].secondaryVotes++
    
    elections[electionId].totalVotes++
    
    emit BallotCast(electionId, msg.sender, firstPref, secondPref, block.timestamp)
```

## modifyBallot Internal Logic

```
function modifyBallot(electionId, newFirstPref, newSecondPref):
    // Modifiers already validated: exists, active, eligible, has voted
    
    if newFirstPref == 0: revert FirstPreferenceRequired
    if newFirstPref > election.candidateCount: revert InvalidCandidate
    if newSecondPref > election.candidateCount: revert InvalidCandidate
    if newSecondPref != 0 && newFirstPref == newSecondPref: revert DuplicatePreference
    
    Ballot storage ballot = ballots[electionId][msg.sender]
    uint256 oldFirst = ballot.firstPreference
    uint256 oldSecond = ballot.secondPreference
    
    // Decrement old tallies
    candidates[electionId][oldFirst].primaryVotes--
    if oldSecond != 0:
        candidates[electionId][oldSecond].secondaryVotes--
    
    // Update ballot
    ballot.firstPreference = newFirstPref
    ballot.secondPreference = newSecondPref
    ballot.timestamp = block.timestamp
    
    // Increment new tallies
    candidates[electionId][newFirstPref].primaryVotes++
    if newSecondPref != 0:
        candidates[electionId][newSecondPref].secondaryVotes++
    
    emit BallotModified(electionId, msg.sender, oldFirst, oldSecond, newFirstPref, newSecondPref, block.timestamp)
```

---

## authorizeVoter Status Rules

```
function authorizeVoter(electionId, voter):
    ElectionStatus status = elections[electionId].status
    // Allowed in Pending OR Active
    if status != Pending && status != Active:
        revert InvalidElectionStatus(...)
    if isEligibleVoter[electionId][voter]:
        revert VoterAlreadyAuthorized(...)
    
    isEligibleVoter[electionId][voter] = true
    eligibleVoterCount[electionId]++
    emit VoterAuthorized(electionId, voter)
```

## startElection Preconditions

```
function startElection(electionId):
    // Modifier: inStatus(Pending)
    if elections[electionId].candidateCount < 2:
        revert InsufficientCandidates(electionId, elections[electionId].candidateCount)
    
    elections[electionId].status = Active
    emit ElectionStarted(electionId, block.timestamp)
```

---

## Gas Cost Model (Per Function)

| Function | SSTORE ops | Est. Gas | Notes |
|----------|-----------|----------|-------|
| createElection | ~8 slots | 150-200k | Strings are dynamic |
| addCandidate | ~4 slots | 80-120k | Name + desc strings |
| authorizeVoter | 1 slot + 1 update | 45-55k | Bool mapping + counter |
| authorizeVotersBatch(10) | 10+10 | 350-450k | Linear scaling |
| castBallot | 4 slots + 2-3 updates | 80-120k | Ballot + tally updates |
| modifyBallot | 3 updates + 2-4 updates | 60-90k | No new slots, just updates |
| startElection | 1 update | 30-40k | Status change only |
| endElection | 1 update | 30-40k | Status change only |
| finalizeElection | 2-3 updates + loops | 80-200k | Depends on candidate count |

---

## Phase 2 Checklist

- [x] Structs finalized with storage slot analysis
- [x] Mappings defined
- [x] Events with indexing strategy
- [x] Custom errors (gas-efficient)
- [x] Modifiers with complete logic
- [x] Access control model (RBAC)
- [x] Ballot model with validation
- [x] Preference model
- [x] Tally model (incremental)
- [x] Tie-break logic (pseudocode)
- [x] Election lifecycle transitions
- [x] Gas cost estimates
- [x] All 5 ambiguity decisions resolved
