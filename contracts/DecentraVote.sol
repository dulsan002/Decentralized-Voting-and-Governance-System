// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DecentraVote
 * @notice A blockchain-based decentralized voting and governance system
 *         supporting preferential voting with configurable tie-breaking.
 * @dev Implements election lifecycle management, preferential ballot submission,
 *      ballot modification, automatic result tallying, and tie-break resolution.
 *
 *      Academic project for DAS5003 – Blockchain Fundamentals
 *      Task 3.1(b) – Decentralized Voting and Governance System
 */
contract DecentraVote is AccessControl {
    // ================================================================
    // ROLES
    // ================================================================

    /// @notice Role identifier for election organizers
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");

    // ================================================================
    // CONSTANTS
    // ================================================================

    /// @notice Maximum number of candidates allowed per election
    uint8 public constant MAX_CANDIDATES = 50;

    // ================================================================
    // ENUMS
    // ================================================================

    /// @notice Election lifecycle states
    enum ElectionStatus {
        Pending,    // Created, accepting candidates and voter registration
        Active,     // Voting is open
        Ended,      // Voting closed, awaiting finalization
        Finalized   // Results calculated and locked
    }

    /// @notice Tie-breaking algorithm options
    enum TieBreakMode {
        SecondPreference,  // Use 2nd preferences to break ties
        NoTieBreak         // Report tie without resolution
    }

    /// @notice Result determination method
    enum ResultStatus {
        None,               // Not yet finalized
        PrimaryResult,      // Clear winner from primary count
        TieBreakResolved,   // Winner determined via second-preference tie-break
        ResolvedByFallback, // Winner determined via fallback rule (earliest ID)
        TieUnresolved,      // Tie exists but tie-break mode is NoTieBreak
        NoVotes             // No ballots were cast
    }

    // ================================================================
    // STRUCTS
    // ================================================================

    /// @notice Represents an election with its configuration and state
    struct Election {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 candidateCount;
        uint256 totalVotes;
        uint256 winnerId;
        address creator;
        ElectionStatus status;
        uint8 maxPreferences;
        bool secondPreferenceEnabled;
        TieBreakMode tieBreakMode;
        ResultStatus resultStatus;
        string title;
        string description;
    }

    /// @notice Represents a candidate in an election
    struct Candidate {
        uint256 id;
        uint256 primaryVotes;
        uint256 secondaryVotes;
        string name;
        string description;
    }

    /// @notice Represents a voter's ballot
    struct Ballot {
        uint256 firstPreference;
        uint256 secondPreference;
        uint256 timestamp;
        bool exists;
    }

    // ================================================================
    // STATE VARIABLES
    // ================================================================

    /// @notice Total number of elections created
    uint256 public electionCount;

    /// @notice Election storage: electionId => Election
    mapping(uint256 => Election) public elections;

    /// @notice Candidate storage: electionId => candidateId => Candidate
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;

    /// @notice Ballot storage: electionId => voterAddress => Ballot
    mapping(uint256 => mapping(address => Ballot)) public ballots;

    /// @notice Voter eligibility: electionId => voterAddress => isEligible
    mapping(uint256 => mapping(address => bool)) public isEligibleVoter;

    /// @notice Count of eligible voters per election
    mapping(uint256 => uint256) public eligibleVoterCount;

    // ================================================================
    // EVENTS
    // ================================================================

    /// @notice Emitted when a new election is created
    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        address indexed creator,
        uint256 startTime,
        uint256 endTime
    );

    /// @notice Emitted when a candidate is added to an election
    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name
    );

    /// @notice Emitted when a voter is authorized for an election
    event VoterAuthorized(
        uint256 indexed electionId,
        address indexed voter
    );

    /// @notice Emitted when a voter's authorization is revoked
    event VoterRevoked(
        uint256 indexed electionId,
        address indexed voter
    );

    /// @notice Emitted when an election transitions to Active
    event ElectionStarted(
        uint256 indexed electionId,
        uint256 timestamp
    );

    /// @notice Emitted when a voter casts a ballot
    event BallotCast(
        uint256 indexed electionId,
        address indexed voter,
        uint256 firstPreference,
        uint256 secondPreference,
        uint256 timestamp
    );

    /// @notice Emitted when a voter modifies their existing ballot
    event BallotModified(
        uint256 indexed electionId,
        address indexed voter,
        uint256 oldFirstPreference,
        uint256 oldSecondPreference,
        uint256 newFirstPreference,
        uint256 newSecondPreference,
        uint256 timestamp
    );

    /// @notice Emitted when an election transitions to Ended
    event ElectionEnded(
        uint256 indexed electionId,
        uint256 timestamp
    );

    /// @notice Emitted when an election is finalized with results
    event ElectionFinalized(
        uint256 indexed electionId,
        uint256 winnerId,
        ResultStatus resultStatus,
        uint256 timestamp
    );

    /// @notice Emitted when a tie is detected during finalization
    event TieDetected(
        uint256 indexed electionId,
        uint256 numTiedCandidates
    );

    // ================================================================
    // CUSTOM ERRORS
    // ================================================================

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
    error InvalidVoterAddress();

    // ================================================================
    // MODIFIERS
    // ================================================================

    /// @notice Ensures the election exists
    modifier electionExists(uint256 _electionId) {
        if (_electionId == 0 || _electionId > electionCount)
            revert ElectionDoesNotExist(_electionId);
        _;
    }

    /// @notice Ensures caller is the election creator or an Organizer
    modifier onlyElectionCreator(uint256 _electionId) {
        if (elections[_electionId].creator != msg.sender && !hasRole(ORGANIZER_ROLE, msg.sender))
            revert NotElectionCreator(_electionId, msg.sender);
        _;
    }

    /// @notice Ensures election is in the required status
    modifier inStatus(uint256 _electionId, ElectionStatus _required) {
        if (elections[_electionId].status != _required)
            revert InvalidElectionStatus(
                _electionId,
                elections[_electionId].status,
                _required
            );
        _;
    }

    /// @notice Ensures election is currently active
    modifier electionActive(uint256 _electionId) {
        if (elections[_electionId].status != ElectionStatus.Active)
            revert ElectionNotActive(_electionId);
        _;
    }

    /// @notice Ensures caller is eligible to vote
    modifier onlyEligible(uint256 _electionId) {
        if (!isEligibleVoter[_electionId][msg.sender])
            revert VoterNotEligible(_electionId, msg.sender);
        _;
    }

    /// @notice Ensures caller has NOT yet voted
    modifier hasNotVoted(uint256 _electionId) {
        if (ballots[_electionId][msg.sender].exists)
            revert AlreadyVoted(_electionId, msg.sender);
        _;
    }

    /// @notice Ensures caller HAS already voted
    modifier hasVotedAlready(uint256 _electionId) {
        if (!ballots[_electionId][msg.sender].exists)
            revert NotYetVoted(_electionId, msg.sender);
        _;
    }

    // ================================================================
    // CONSTRUCTOR
    // ================================================================

    /// @notice Deploys DecentraVote, granting deployer admin and organizer roles
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORGANIZER_ROLE, msg.sender);
    }

    // ================================================================
    // ADMIN / ORGANIZER FUNCTIONS
    // ================================================================

    /**
     * @notice Creates a new election
     * @param _title Election title
     * @param _description Election description
     * @param _startTime Unix timestamp for voting start
     * @param _endTime Unix timestamp for voting end
     * @param _secondPreferenceEnabled Whether second preference is collected
     * @param _tieBreakMode Algorithm for resolving ties
     * @return electionId The ID of the newly created election
     */
    function createElection(
        string calldata _title,
        string calldata _description,
        uint256 _startTime,
        uint256 _endTime,
        bool _secondPreferenceEnabled,
        TieBreakMode _tieBreakMode
    ) external onlyRole(ORGANIZER_ROLE) returns (uint256) {
        if (_endTime <= _startTime) revert InvalidTimeRange(_startTime, _endTime);

        electionCount++;
        uint256 newId = electionCount;

        Election storage e = elections[newId];
        e.id = newId;
        e.title = _title;
        e.description = _description;
        e.startTime = _startTime;
        e.endTime = _endTime;
        e.status = ElectionStatus.Pending;
        e.maxPreferences = _secondPreferenceEnabled ? 2 : 1;
        e.secondPreferenceEnabled = _secondPreferenceEnabled;
        e.tieBreakMode = _tieBreakMode;
        e.creator = msg.sender;
        e.resultStatus = ResultStatus.None;

        emit ElectionCreated(newId, _title, msg.sender, _startTime, _endTime);

        return newId;
    }

    /**
     * @notice Adds a candidate to a pending election
     * @param _electionId Target election
     * @param _name Candidate name
     * @param _description Candidate description
     */
    function addCandidate(
        uint256 _electionId,
        string calldata _name,
        string calldata _description
    )
        external
        electionExists(_electionId)
        onlyElectionCreator(_electionId)
        inStatus(_electionId, ElectionStatus.Pending)
    {
        Election storage e = elections[_electionId];
        if (e.candidateCount >= MAX_CANDIDATES)
            revert MaxCandidatesReached(_electionId);

        e.candidateCount++;
        uint256 candidateId = e.candidateCount;

        Candidate storage c = candidates[_electionId][candidateId];
        c.id = candidateId;
        c.name = _name;
        c.description = _description;

        emit CandidateAdded(_electionId, candidateId, _name);
    }

    /**
     * @notice Authorizes a voter for an election
     * @dev Allowed in Pending or Active status
     * @param _electionId Target election
     * @param _voter Voter wallet address
     */
    function authorizeVoter(
        uint256 _electionId,
        address _voter
    ) external electionExists(_electionId) onlyElectionCreator(_electionId) {
        if (_voter == address(0)) revert InvalidVoterAddress();

        ElectionStatus status = elections[_electionId].status;
        if (status != ElectionStatus.Pending && status != ElectionStatus.Active)
            revert InvalidElectionStatus(
                _electionId,
                status,
                ElectionStatus.Pending
            );

        if (isEligibleVoter[_electionId][_voter])
            revert VoterAlreadyAuthorized(_electionId, _voter);

        isEligibleVoter[_electionId][_voter] = true;
        eligibleVoterCount[_electionId]++;

        emit VoterAuthorized(_electionId, _voter);
    }

    /**
     * @notice Batch authorizes multiple voters for an election
     * @param _electionId Target election
     * @param _voters Array of voter addresses
     */
    function authorizeVotersBatch(
        uint256 _electionId,
        address[] calldata _voters
    ) external electionExists(_electionId) onlyElectionCreator(_electionId) {
        ElectionStatus status = elections[_electionId].status;
        if (status != ElectionStatus.Pending && status != ElectionStatus.Active)
            revert InvalidElectionStatus(
                _electionId,
                status,
                ElectionStatus.Pending
            );
            
        require(_voters.length <= 250, "Batch size exceeds gas limit safety threshold");

        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] == address(0)) revert InvalidVoterAddress();
            if (!isEligibleVoter[_electionId][_voters[i]]) {
                isEligibleVoter[_electionId][_voters[i]] = true;
                eligibleVoterCount[_electionId]++;
                emit VoterAuthorized(_electionId, _voters[i]);
            }
        }
    }

    /**
     * @notice Revokes voter authorization (Pending elections only)
     * @param _electionId Target election
     * @param _voter Voter to revoke
     */
    function revokeVoter(
        uint256 _electionId,
        address _voter
    )
        external
        electionExists(_electionId)
        onlyElectionCreator(_electionId)
        inStatus(_electionId, ElectionStatus.Pending)
    {
        if (!isEligibleVoter[_electionId][_voter])
            revert VoterNotAuthorized(_electionId, _voter);

        isEligibleVoter[_electionId][_voter] = false;
        eligibleVoterCount[_electionId]--;

        emit VoterRevoked(_electionId, _voter);
    }

    /**
     * @notice Transitions election from Pending to Active
     * @param _electionId Target election
     */
    function startElection(
        uint256 _electionId
    )
        external
        electionExists(_electionId)
        onlyElectionCreator(_electionId)
        inStatus(_electionId, ElectionStatus.Pending)
    {
        Election storage e = elections[_electionId];
        if (e.candidateCount < 2)
            revert InsufficientCandidates(_electionId, e.candidateCount);

        e.status = ElectionStatus.Active;

        emit ElectionStarted(_electionId, block.timestamp);
    }

    /**
     * @notice Transitions election from Active to Ended
     * @param _electionId Target election
     */
    function endElection(
        uint256 _electionId
    )
        external
        electionExists(_electionId)
        onlyElectionCreator(_electionId)
        inStatus(_electionId, ElectionStatus.Active)
    {
        elections[_electionId].status = ElectionStatus.Ended;

        emit ElectionEnded(_electionId, block.timestamp);
    }

    /**
     * @notice Calculates results and transitions election to Finalized
     * @dev Evaluates primary votes, detects ties, and applies tie-break algorithm
     * @param _electionId Target election
     */
    function finalizeElection(
        uint256 _electionId
    )
        external
        electionExists(_electionId)
        onlyElectionCreator(_electionId)
        inStatus(_electionId, ElectionStatus.Ended)
    {
        Election storage e = elections[_electionId];

        // Edge case: no votes cast
        if (e.totalVotes == 0) {
            e.resultStatus = ResultStatus.NoVotes;
            e.winnerId = 0;
            e.status = ElectionStatus.Finalized;
            emit ElectionFinalized(_electionId, 0, ResultStatus.NoVotes, block.timestamp);
            return;
        }

        // Step 1: Find maximum primary votes
        uint256 maxVotes = 0;
        for (uint256 i = 1; i <= e.candidateCount; i++) {
            if (candidates[_electionId][i].primaryVotes > maxVotes) {
                maxVotes = candidates[_electionId][i].primaryVotes;
            }
        }

        // Step 2: Count leaders and find first leader
        uint256 leaderCount = 0;
        uint256 firstLeaderId = 0;
        for (uint256 i = 1; i <= e.candidateCount; i++) {
            if (candidates[_electionId][i].primaryVotes == maxVotes) {
                leaderCount++;
                if (firstLeaderId == 0) {
                    firstLeaderId = i;
                }
            }
        }

        // Step 3: Clear winner — no tie
        if (leaderCount == 1) {
            e.resultStatus = ResultStatus.PrimaryResult;
            e.winnerId = firstLeaderId;
            e.status = ElectionStatus.Finalized;
            emit ElectionFinalized(
                _electionId,
                firstLeaderId,
                ResultStatus.PrimaryResult,
                block.timestamp
            );
            return;
        }

        // Step 4: Tie detected
        emit TieDetected(_electionId, leaderCount);

        // Check tie-break mode
        if (e.tieBreakMode == TieBreakMode.NoTieBreak) {
            e.resultStatus = ResultStatus.TieUnresolved;
            e.winnerId = 0;
            e.status = ElectionStatus.Finalized;
            emit ElectionFinalized(
                _electionId,
                0,
                ResultStatus.TieUnresolved,
                block.timestamp
            );
            return;
        }

        // Step 5: Evaluate secondary votes among tied leaders
        uint256 maxSecondary = 0;
        for (uint256 i = 1; i <= e.candidateCount; i++) {
            if (candidates[_electionId][i].primaryVotes == maxVotes) {
                if (candidates[_electionId][i].secondaryVotes > maxSecondary) {
                    maxSecondary = candidates[_electionId][i].secondaryVotes;
                }
            }
        }

        // Step 6: Count secondary leaders among tied primary leaders
        uint256 secondaryLeaderCount = 0;
        uint256 firstSecondaryLeaderId = 0;
        for (uint256 i = 1; i <= e.candidateCount; i++) {
            if (candidates[_electionId][i].primaryVotes == maxVotes) {
                if (candidates[_electionId][i].secondaryVotes == maxSecondary) {
                    secondaryLeaderCount++;
                    if (firstSecondaryLeaderId == 0) {
                        firstSecondaryLeaderId = i;
                    }
                }
            }
        }

        // Step 7: Determine final result
        if (secondaryLeaderCount == 1) {
            e.resultStatus = ResultStatus.TieBreakResolved;
            e.winnerId = firstSecondaryLeaderId;
        } else {
            // Fallback: earliest registered candidate (lowest ID)
            // firstSecondaryLeaderId is already the lowest due to ascending loop
            e.resultStatus = ResultStatus.ResolvedByFallback;
            e.winnerId = firstSecondaryLeaderId;
        }

        e.status = ElectionStatus.Finalized;
        emit ElectionFinalized(
            _electionId,
            e.winnerId,
            e.resultStatus,
            block.timestamp
        );
    }

    // ================================================================
    // VOTER FUNCTIONS
    // ================================================================

    /**
     * @notice Casts a new ballot with preferences
     * @param _electionId Target election
     * @param _firstPreference Candidate ID for primary vote (required, must be > 0)
     * @param _secondPreference Candidate ID for tie-break preference (0 = no preference)
     */
    function castBallot(
        uint256 _electionId,
        uint256 _firstPreference,
        uint256 _secondPreference
    )
        external
        electionExists(_electionId)
        electionActive(_electionId)
        onlyEligible(_electionId)
        hasNotVoted(_electionId)
    {
        _validatePreferences(_electionId, _firstPreference, _secondPreference);

        // Store ballot
        ballots[_electionId][msg.sender] = Ballot({
            firstPreference: _firstPreference,
            secondPreference: _secondPreference,
            timestamp: block.timestamp,
            exists: true
        });

        // Update tallies
        candidates[_electionId][_firstPreference].primaryVotes++;
        if (_secondPreference != 0) {
            candidates[_electionId][_secondPreference].secondaryVotes++;
        }

        elections[_electionId].totalVotes++;

        emit BallotCast(
            _electionId,
            msg.sender,
            _firstPreference,
            _secondPreference,
            block.timestamp
        );
    }

    /**
     * @notice Modifies an existing ballot with new preferences
     * @param _electionId Target election
     * @param _newFirstPreference New primary preference candidate ID
     * @param _newSecondPreference New secondary preference candidate ID (0 = none)
     */
    function modifyBallot(
        uint256 _electionId,
        uint256 _newFirstPreference,
        uint256 _newSecondPreference
    )
        external
        electionExists(_electionId)
        electionActive(_electionId)
        onlyEligible(_electionId)
        hasVotedAlready(_electionId)
    {
        _validatePreferences(_electionId, _newFirstPreference, _newSecondPreference);

        Ballot storage ballot = ballots[_electionId][msg.sender];
        uint256 oldFirst = ballot.firstPreference;
        uint256 oldSecond = ballot.secondPreference;

        // Decrement old tallies
        candidates[_electionId][oldFirst].primaryVotes--;
        if (oldSecond != 0) {
            candidates[_electionId][oldSecond].secondaryVotes--;
        }

        // Update ballot
        ballot.firstPreference = _newFirstPreference;
        ballot.secondPreference = _newSecondPreference;
        ballot.timestamp = block.timestamp;

        // Increment new tallies
        candidates[_electionId][_newFirstPreference].primaryVotes++;
        if (_newSecondPreference != 0) {
            candidates[_electionId][_newSecondPreference].secondaryVotes++;
        }

        emit BallotModified(
            _electionId,
            msg.sender,
            oldFirst,
            oldSecond,
            _newFirstPreference,
            _newSecondPreference,
            block.timestamp
        );
    }

    // ================================================================
    // VIEW FUNCTIONS
    // ================================================================

    /**
     * @notice Gets full election details
     * @param _electionId Target election
     * @return Election struct
     */
    function getElection(
        uint256 _electionId
    ) external view electionExists(_electionId) returns (Election memory) {
        return elections[_electionId];
    }

    /**
     * @notice Gets a single candidate's details
     * @param _electionId Target election
     * @param _candidateId Target candidate
     * @return Candidate struct
     */
    function getCandidate(
        uint256 _electionId,
        uint256 _candidateId
    ) external view electionExists(_electionId) returns (Candidate memory) {
        if (_candidateId == 0 || _candidateId > elections[_electionId].candidateCount)
            revert InvalidCandidate(_electionId, _candidateId);
        return candidates[_electionId][_candidateId];
    }

    /**
     * @notice Gets all candidates for an election
     * @param _electionId Target election
     * @return Array of Candidate structs
     */
    function getAllCandidates(
        uint256 _electionId
    ) external view electionExists(_electionId) returns (Candidate[] memory) {
        uint256 count = elections[_electionId].candidateCount;
        Candidate[] memory result = new Candidate[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = candidates[_electionId][i + 1];
        }
        return result;
    }

    /**
     * @notice Gets a voter's ballot for an election
     * @param _electionId Target election
     * @param _voter Voter address
     * @return Ballot struct
     */
    function getBallot(
        uint256 _electionId,
        address _voter
    ) external view electionExists(_electionId) returns (Ballot memory) {
        return ballots[_electionId][_voter];
    }

    /**
     * @notice Gets the total number of elections created
     * @return Total election count
     */
    function getElectionCount() external view returns (uint256) {
        return electionCount;
    }

    // ================================================================
    // INTERNAL FUNCTIONS
    // ================================================================

    /**
     * @dev Validates preference selections for a ballot
     * @param _electionId Target election
     * @param _firstPreference Primary preference candidate ID
     * @param _secondPreference Secondary preference candidate ID
     */
    function _validatePreferences(
        uint256 _electionId,
        uint256 _firstPreference,
        uint256 _secondPreference
    ) internal view {
        if (_firstPreference == 0) revert FirstPreferenceRequired();

        uint256 candidateCount = elections[_electionId].candidateCount;

        if (_firstPreference > candidateCount)
            revert InvalidCandidate(_electionId, _firstPreference);

        if (_secondPreference != 0) {
            if (_secondPreference > candidateCount)
                revert InvalidCandidate(_electionId, _secondPreference);

            if (_firstPreference == _secondPreference)
                revert DuplicatePreference(_firstPreference);
        }
    }
}
