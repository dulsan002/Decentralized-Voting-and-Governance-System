// DecentraVote Contract ABI definition
export const DECENTRAVOTE_ABI = [
  "function ORGANIZER_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function MAX_CANDIDATES() view returns (uint8)",
  "function electionCount() view returns (uint256)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  
  "function createElection(string _title, string _description, uint256 _startTime, uint256 _endTime, bool _secondPreferenceEnabled, uint8 _tieBreakMode) returns (uint256)",
  "function addCandidate(uint256 _electionId, string _name, string _description)",
  "function authorizeVoter(uint256 _electionId, address _voter)",
  "function authorizeVotersBatch(uint256 _electionId, address[] _voters)",
  "function revokeVoter(uint256 _electionId, address _voter)",
  "function startElection(uint256 _electionId)",
  "function endElection(uint256 _electionId)",
  "function finalizeElection(uint256 _electionId)",
  
  "function castBallot(uint256 _electionId, uint256 _firstPreference, uint256 _secondPreference)",
  "function modifyBallot(uint256 _electionId, uint256 _newFirstPreference, uint256 _newSecondPreference)",
  
  "function getElection(uint256 _electionId) view returns (tuple(uint256 id, uint256 startTime, uint256 endTime, uint256 candidateCount, uint256 totalVotes, uint256 winnerId, address creator, uint8 status, uint8 maxPreferences, bool secondPreferenceEnabled, uint8 tieBreakMode, uint8 resultStatus, string title, string description))",
  "function getCandidate(uint256 _electionId, uint256 _candidateId) view returns (tuple(uint256 id, uint256 primaryVotes, uint256 secondaryVotes, string name, string description))",
  "function getAllCandidates(uint256 _electionId) view returns (tuple(uint256 id, uint256 primaryVotes, uint256 secondaryVotes, string name, string description)[])",
  "function getBallot(uint256 _electionId, address _voter) view returns (tuple(uint256 firstPreference, uint256 secondPreference, uint256 timestamp, bool exists))",
  "function isEligibleVoter(uint256 _electionId, address _voter) view returns (bool)",
  "function eligibleVoterCount(uint256 _electionId) view returns (uint256)",
  "function getElectionCount() view returns (uint256)",
  
  "event ElectionCreated(uint256 indexed electionId, string title, address indexed creator, uint256 startTime, uint256 endTime)",
  "event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name)",
  "event VoterAuthorized(uint256 indexed electionId, address indexed voter)",
  "event VoterRevoked(uint256 indexed electionId, address indexed voter)",
  "event ElectionStarted(uint256 indexed electionId, uint256 timestamp)",
  "event BallotCast(uint256 indexed electionId, address indexed voter, uint256 firstPreference, uint256 secondPreference, uint256 timestamp)",
  "event BallotModified(uint256 indexed electionId, address indexed voter, uint256 oldFirstPreference, uint256 oldSecondPreference, uint256 newFirstPreference, uint256 newSecondPreference, uint256 timestamp)",
  "event ElectionEnded(uint256 indexed electionId, uint256 timestamp)",
  "event ElectionFinalized(uint256 indexed electionId, uint256 winnerId, uint8 resultStatus, uint256 timestamp)",
  "event TieDetected(uint256 indexed electionId, uint256 numTiedCandidates)",
  
  "error ElectionDoesNotExist(uint256 electionId)",
  "error InvalidElectionStatus(uint256 electionId, uint8 current, uint8 required)",
  "error NotElectionCreator(uint256 electionId, address caller)",
  "error VoterNotEligible(uint256 electionId, address voter)",
  "error AlreadyVoted(uint256 electionId, address voter)",
  "error NotYetVoted(uint256 electionId, address voter)",
  "error InvalidCandidate(uint256 electionId, uint256 candidateId)",
  "error DuplicatePreference(uint256 candidateId)",
  "error ElectionNotActive(uint256 electionId)",
  "error InvalidTimeRange(uint256 startTime, uint256 endTime)",
  "error InsufficientCandidates(uint256 electionId, uint256 count)",
  "error VoterAlreadyAuthorized(uint256 electionId, address voter)",
  "error VoterNotAuthorized(uint256 electionId, address voter)",
  "error FirstPreferenceRequired()",
  "error MaxCandidatesReached(uint256 electionId)",
  "error InvalidVoterAddress()"
];

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x922D6956C99E12DFeB3224DEA977D0939758A1Fe";

export const ELECTION_STATUS = {
  0: "Pending",
  1: "Active",
  2: "Ended",
  3: "Finalized"
};

export const RESULT_STATUS = {
  0: "None",
  1: "Primary Result",
  2: "Tie Break Resolved (2nd Pref)",
  3: "Resolved by Fallback (Earliest ID)",
  4: "Tie Unresolved",
  5: "No Votes Cast"
};

export const TIE_BREAK_MODE = {
  0: "Second Preference",
  1: "No Tie Break"
};
