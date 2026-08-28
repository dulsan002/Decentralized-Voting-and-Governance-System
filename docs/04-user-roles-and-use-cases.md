# 04 — User Roles and Use Cases

## User Roles

### Role 1: Organizer / Admin

**Identity:** A wallet address with elevated privileges in the smart contract.

**Permissions:**
- Create elections
- Configure election parameters (title, description, timing, preferences)
- Add candidates to elections
- Authorize voter addresses for specific elections
- Revoke voter authorization (before election activation)
- Start elections (transition to ACTIVE)
- End elections (transition to ENDED)
- Finalize elections (trigger result calculation and transition to FINALIZED)
- View all election data and audit logs

**Access Control:** Enforced by smart contract role-based access (contract owner or designated admin role).

### Role 2: Verified Voter

**Identity:** A wallet address that has been explicitly authorized for a specific election.

**Permissions:**
- Browse public elections
- Check own eligibility for elections
- Cast a preferential ballot (1st + optional 2nd preference)
- Modify an existing ballot before the election deadline
- View own voting history
- View election results after finalization

**Constraints:**
- Cannot create elections
- Cannot authorize other voters
- Cannot manage candidates
- Cannot vote in elections where not authorized
- Cannot submit duplicate ballots
- Cannot modify ballots after deadline

### Role 3: Public User (Unauthenticated)

**Identity:** Any visitor to the DApp without a connected wallet.

**Permissions:**
- View landing page
- View "How It Works" information
- View public election directory (basic info)
- Connect wallet (transitions to Voter or Admin based on authorization)

---

## Use Cases

### UC-01: Connect Wallet
**Actor:** Any user  
**Precondition:** MetaMask installed  
**Flow:**
1. User clicks "Connect Wallet"
2. MetaMask popup requests connection approval
3. User approves
4. DApp reads wallet address and network
5. DApp checks if address has admin privileges
6. DApp displays wallet status and available actions

**Postcondition:** User identity established via wallet address

### UC-02: Create Election
**Actor:** Admin  
**Precondition:** Wallet connected, admin role verified  
**Flow:**
1. Admin navigates to "Create Election"
2. Admin enters title, description, start time, end time
3. Admin configures voting parameters (max preferences, tie-break mode)
4. Admin submits creation transaction
5. MetaMask prompts for signature
6. Contract creates election, emits `ElectionCreated` event
7. UI confirms with transaction hash

**Postcondition:** Election exists in PENDING state

### UC-03: Add Candidates
**Actor:** Admin  
**Precondition:** Election exists in PENDING state  
**Flow:**
1. Admin opens election management
2. Admin enters candidate name and optional description
3. Admin submits transaction
4. Contract adds candidate, emits `CandidateAdded` event

**Postcondition:** Candidate registered to election

### UC-04: Authorize Voters
**Actor:** Admin  
**Precondition:** Election exists  
**Flow:**
1. Admin opens voter management for an election
2. Admin enters voter wallet address(es)
3. Admin submits authorization transaction
4. Contract registers voter eligibility, emits `VoterAuthorized` event

**Postcondition:** Address is eligible to vote in that election

### UC-05: Start Election
**Actor:** Admin  
**Precondition:** Election in PENDING state, at least 2 candidates, start time reached  
**Flow:**
1. Admin triggers election activation
2. Contract validates preconditions
3. Contract transitions state to ACTIVE, emits `ElectionStarted` event

**Postcondition:** Voters can now cast ballots

### UC-06: Cast Ballot
**Actor:** Verified Voter  
**Precondition:** Election ACTIVE, voter authorized, voter has NOT yet voted  
**Flow:**
1. Voter opens election ballot page
2. Voter selects primary (1st) preference candidate
3. Voter optionally selects second (2nd) preference candidate
4. Voter reviews ballot summary
5. Voter confirms and submits transaction
6. Contract validates all preconditions
7. Contract records ballot and updates tallies
8. Contract emits `BallotCast` event
9. UI displays confirmation with transaction hash

**Postcondition:** Ballot recorded, tallies updated

### UC-07: Modify Ballot
**Actor:** Verified Voter  
**Precondition:** Election ACTIVE, voter has existing ballot, deadline not passed  
**Flow:**
1. Voter opens election with existing ballot
2. UI shows current preferences
3. Voter selects new preferences
4. Voter reviews changes
5. Voter confirms modification transaction
6. Contract validates preconditions
7. Contract decrements old tallies, updates ballot, increments new tallies
8. Contract emits `BallotModified` event
9. UI displays confirmation

**Postcondition:** Ballot updated, tallies corrected, old ballot preserved in event history

### UC-08: End Election
**Actor:** Admin (or automatic when end time reached)  
**Precondition:** Election ACTIVE, end time reached or admin triggers  
**Flow:**
1. Contract transitions state to ENDED
2. Contract emits `ElectionEnded` event
3. No further voting or modification permitted

**Postcondition:** Election in ENDED state

### UC-09: Finalize Election
**Actor:** Admin  
**Precondition:** Election ENDED  
**Flow:**
1. Admin triggers finalization
2. Contract evaluates primary results
3. Contract checks for ties among leading candidates
4. If tie: contract evaluates second preferences per tie-break algorithm
5. Contract records final result, emits `ElectionFinalized` event

**Postcondition:** Election in FINALIZED state with determined result

### UC-10: View Results
**Actor:** Any user (after finalization)  
**Flow:**
1. User opens results dashboard
2. UI displays primary counts, percentages, tie status
3. If tie occurred: UI displays tie-break details
4. UI displays final winner and verification data

### UC-11: View Audit Trail
**Actor:** Any user  
**Flow:**
1. User opens audit dashboard
2. UI displays event history from blockchain
3. Each entry shows event type, election, address, timestamp, tx hash, block number

### UC-12: View Voting History
**Actor:** Verified Voter  
**Flow:**
1. Voter opens their dashboard
2. UI shows all elections they've participated in
3. For each: current ballot preferences, modification history, election status
