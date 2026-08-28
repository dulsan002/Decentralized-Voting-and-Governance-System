const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DecentraVote", function () {
  let contract, owner, organizer, voter1, voter2, voter3, voter4, voter5, nonAuth;
  const NOW = Math.floor(Date.now() / 1000);
  const START = NOW + 100;
  const END = NOW + 10000;

  beforeEach(async function () {
    [owner, organizer, voter1, voter2, voter3, voter4, voter5, nonAuth] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DecentraVote");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // Helper: create a standard election
  async function createElection(caller) {
    const c = caller ? contract.connect(caller) : contract;
    return c.createElection("Test Election", "Description", START, END, true, 0);
  }

  // Helper: setup a full election ready for voting
  async function setupActiveElection() {
    await createElection();
    await contract.addCandidate(1, "Alice", "Candidate A");
    await contract.addCandidate(1, "Bob", "Candidate B");
    await contract.addCandidate(1, "Charlie", "Candidate C");
    await contract.authorizeVoter(1, voter1.address);
    await contract.authorizeVoter(1, voter2.address);
    await contract.authorizeVoter(1, voter3.address);
    await contract.authorizeVoter(1, voter4.address);
    await contract.authorizeVoter(1, voter5.address);
    await contract.startElection(1);
  }

  // ================================================================
  // ACCESS CONTROL (AC-01 to AC-05)
  // ================================================================
  describe("Access Control", function () {
    it("AC-01: deployer has admin and organizer roles", async function () {
      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      const orgRole = await contract.ORGANIZER_ROLE();
      expect(await contract.hasRole(adminRole, owner.address)).to.be.true;
      expect(await contract.hasRole(orgRole, owner.address)).to.be.true;
    });

    it("AC-02: admin can grant organizer role", async function () {
      const orgRole = await contract.ORGANIZER_ROLE();
      await contract.grantRole(orgRole, organizer.address);
      expect(await contract.hasRole(orgRole, organizer.address)).to.be.true;
    });

    it("AC-03: non-admin cannot grant organizer role", async function () {
      const orgRole = await contract.ORGANIZER_ROLE();
      await expect(
        contract.connect(voter1).grantRole(orgRole, organizer.address)
      ).to.be.reverted;
    });

    it("AC-04: organizer can create election", async function () {
      const orgRole = await contract.ORGANIZER_ROLE();
      await contract.grantRole(orgRole, organizer.address);
      await expect(createElection(organizer)).to.emit(contract, "ElectionCreated");
    });

    it("AC-05: non-organizer cannot create election", async function () {
      await expect(createElection(voter1)).to.be.reverted;
    });
  });

  // ================================================================
  // ELECTION MANAGEMENT (EM-01 to EM-11)
  // ================================================================
  describe("Election Management", function () {
    it("EM-01: create election with valid params", async function () {
      await expect(createElection())
        .to.emit(contract, "ElectionCreated")
        .withArgs(1, "Test Election", owner.address, START, END);
      const e = await contract.getElection(1);
      expect(e.title).to.equal("Test Election");
      expect(e.status).to.equal(0); // Pending
      expect(e.secondPreferenceEnabled).to.be.true;
      expect(e.maxPreferences).to.equal(2);
    });

    it("EM-02: non-organizer cannot create election", async function () {
      await expect(createElection(nonAuth)).to.be.reverted;
    });

    it("EM-03: cannot create election with endTime <= startTime", async function () {
      await expect(
        contract.createElection("Bad", "Desc", END, START, true, 0)
      ).to.be.revertedWithCustomError(contract, "InvalidTimeRange");
    });

    it("EM-04: add candidate to pending election", async function () {
      await createElection();
      await expect(contract.addCandidate(1, "Alice", "Desc"))
        .to.emit(contract, "CandidateAdded")
        .withArgs(1, 1, "Alice");
    });

    it("EM-05: cannot add candidate to active election", async function () {
      await createElection();
      await contract.addCandidate(1, "Alice", "A");
      await contract.addCandidate(1, "Bob", "B");
      await contract.startElection(1);
      await expect(
        contract.addCandidate(1, "Charlie", "C")
      ).to.be.revertedWithCustomError(contract, "InvalidElectionStatus");
    });

    it("EM-06: non-creator cannot add candidate", async function () {
      await createElection();
      await expect(
        contract.connect(voter1).addCandidate(1, "Alice", "A")
      ).to.be.revertedWithCustomError(contract, "NotElectionCreator");
    });

    it("EM-07: start election with >= 2 candidates", async function () {
      await createElection();
      await contract.addCandidate(1, "Alice", "A");
      await contract.addCandidate(1, "Bob", "B");
      await expect(contract.startElection(1))
        .to.emit(contract, "ElectionStarted");
      const e = await contract.getElection(1);
      expect(e.status).to.equal(1); // Active
    });

    it("EM-08: cannot start with < 2 candidates", async function () {
      await createElection();
      await contract.addCandidate(1, "Alice", "A");
      await expect(
        contract.startElection(1)
      ).to.be.revertedWithCustomError(contract, "InsufficientCandidates");
    });

    it("EM-09: cannot start already active election", async function () {
      await createElection();
      await contract.addCandidate(1, "A", "A");
      await contract.addCandidate(1, "B", "B");
      await contract.startElection(1);
      await expect(
        contract.startElection(1)
      ).to.be.revertedWithCustomError(contract, "InvalidElectionStatus");
    });

    it("EM-10: end active election", async function () {
      await setupActiveElection();
      await expect(contract.endElection(1)).to.emit(contract, "ElectionEnded");
      const e = await contract.getElection(1);
      expect(e.status).to.equal(2); // Ended
    });

    it("EM-11: cannot end non-active election", async function () {
      await createElection();
      await expect(
        contract.endElection(1)
      ).to.be.revertedWithCustomError(contract, "InvalidElectionStatus");
    });
  });

  // ================================================================
  // VOTER AUTHORIZATION (VA-01 to VA-07)
  // ================================================================
  describe("Voter Authorization", function () {
    beforeEach(async function () {
      await createElection();
    });

    it("VA-01: authorize voter", async function () {
      await expect(contract.authorizeVoter(1, voter1.address))
        .to.emit(contract, "VoterAuthorized")
        .withArgs(1, voter1.address);
      expect(await contract.isEligibleVoter(1, voter1.address)).to.be.true;
    });

    it("VA-02: non-creator cannot authorize", async function () {
      await expect(
        contract.connect(voter1).authorizeVoter(1, voter2.address)
      ).to.be.revertedWithCustomError(contract, "NotElectionCreator");
    });

    it("VA-03: cannot authorize already-authorized voter", async function () {
      await contract.authorizeVoter(1, voter1.address);
      await expect(
        contract.authorizeVoter(1, voter1.address)
      ).to.be.revertedWithCustomError(contract, "VoterAlreadyAuthorized");
    });

    it("VA-04: batch authorize voters", async function () {
      await contract.authorizeVotersBatch(1, [voter1.address, voter2.address, voter3.address]);
      expect(await contract.isEligibleVoter(1, voter1.address)).to.be.true;
      expect(await contract.isEligibleVoter(1, voter2.address)).to.be.true;
      expect(await contract.isEligibleVoter(1, voter3.address)).to.be.true;
      expect(await contract.eligibleVoterCount(1)).to.equal(3);
    });

    it("VA-05: revoke voter authorization", async function () {
      await contract.authorizeVoter(1, voter1.address);
      await expect(contract.revokeVoter(1, voter1.address))
        .to.emit(contract, "VoterRevoked");
      expect(await contract.isEligibleVoter(1, voter1.address)).to.be.false;
    });

    it("VA-06: eligible voter returns true", async function () {
      await contract.authorizeVoter(1, voter1.address);
      expect(await contract.isEligibleVoter(1, voter1.address)).to.be.true;
    });

    it("VA-07: non-eligible voter returns false", async function () {
      expect(await contract.isEligibleVoter(1, voter1.address)).to.be.false;
    });
  });

  // ================================================================
  // BALLOT SUBMISSION (BS-01 to BS-10)
  // ================================================================
  describe("Ballot Submission", function () {
    beforeEach(async function () {
      await setupActiveElection();
    });

    it("BS-01: cast ballot with 1st and 2nd preference", async function () {
      await expect(contract.connect(voter1).castBallot(1, 1, 3))
        .to.emit(contract, "BallotCast");
      const b = await contract.getBallot(1, voter1.address);
      expect(b.firstPreference).to.equal(1);
      expect(b.secondPreference).to.equal(3);
      expect(b.exists).to.be.true;
    });

    it("BS-02: cast ballot with 1st preference only", async function () {
      await contract.connect(voter1).castBallot(1, 1, 0);
      const b = await contract.getBallot(1, voter1.address);
      expect(b.firstPreference).to.equal(1);
      expect(b.secondPreference).to.equal(0);
    });

    it("BS-03: non-eligible voter cannot cast", async function () {
      await expect(
        contract.connect(nonAuth).castBallot(1, 1, 0)
      ).to.be.revertedWithCustomError(contract, "VoterNotEligible");
    });

    it("BS-04: duplicate ballot rejected", async function () {
      await contract.connect(voter1).castBallot(1, 1, 0);
      await expect(
        contract.connect(voter1).castBallot(1, 2, 0)
      ).to.be.revertedWithCustomError(contract, "AlreadyVoted");
    });

    it("BS-05: invalid candidate ID rejected", async function () {
      await expect(
        contract.connect(voter1).castBallot(1, 99, 0)
      ).to.be.revertedWithCustomError(contract, "InvalidCandidate");
    });

    it("BS-06: same candidate for both preferences rejected", async function () {
      await expect(
        contract.connect(voter1).castBallot(1, 1, 1)
      ).to.be.revertedWithCustomError(contract, "DuplicatePreference");
    });

    it("BS-07: cannot vote on non-active election", async function () {
      await contract.endElection(1);
      await expect(
        contract.connect(voter1).castBallot(1, 1, 0)
      ).to.be.revertedWithCustomError(contract, "ElectionNotActive");
    });

    it("BS-08: zero first preference rejected", async function () {
      await expect(
        contract.connect(voter1).castBallot(1, 0, 0)
      ).to.be.revertedWithCustomError(contract, "FirstPreferenceRequired");
    });

    it("BS-09: primary tally updated correctly", async function () {
      await contract.connect(voter1).castBallot(1, 1, 0);
      await contract.connect(voter2).castBallot(1, 1, 0);
      const c = await contract.getCandidate(1, 1);
      expect(c.primaryVotes).to.equal(2);
    });

    it("BS-10: secondary tally updated correctly", async function () {
      await contract.connect(voter1).castBallot(1, 1, 2);
      await contract.connect(voter2).castBallot(1, 3, 2);
      const c = await contract.getCandidate(1, 2);
      expect(c.secondaryVotes).to.equal(2);
    });
  });

  // ================================================================
  // BALLOT MODIFICATION (BM-01 to BM-08)
  // ================================================================
  describe("Ballot Modification", function () {
    beforeEach(async function () {
      await setupActiveElection();
      await contract.connect(voter1).castBallot(1, 1, 3);
    });

    it("BM-01: modify existing ballot", async function () {
      await expect(contract.connect(voter1).modifyBallot(1, 2, 3))
        .to.emit(contract, "BallotModified");
      const b = await contract.getBallot(1, voter1.address);
      expect(b.firstPreference).to.equal(2);
    });

    it("BM-02: cannot modify without existing ballot", async function () {
      await expect(
        contract.connect(voter2).modifyBallot(1, 2, 0)
      ).to.be.revertedWithCustomError(contract, "NotYetVoted");
    });

    it("BM-03: cannot modify after election ended", async function () {
      await contract.endElection(1);
      await expect(
        contract.connect(voter1).modifyBallot(1, 2, 0)
      ).to.be.revertedWithCustomError(contract, "ElectionNotActive");
    });

    it("BM-04: cannot modify with invalid candidate", async function () {
      await expect(
        contract.connect(voter1).modifyBallot(1, 99, 0)
      ).to.be.revertedWithCustomError(contract, "InvalidCandidate");
    });

    it("BM-05: cannot modify with same candidate twice", async function () {
      await expect(
        contract.connect(voter1).modifyBallot(1, 2, 2)
      ).to.be.revertedWithCustomError(contract, "DuplicatePreference");
    });

    it("BM-06: old tallies decremented", async function () {
      // voter1 voted for candidate 1 (primary) and 3 (secondary)
      await contract.connect(voter1).modifyBallot(1, 2, 0);
      const c1 = await contract.getCandidate(1, 1);
      expect(c1.primaryVotes).to.equal(0);
      const c3 = await contract.getCandidate(1, 3);
      expect(c3.secondaryVotes).to.equal(0);
    });

    it("BM-07: new tallies incremented", async function () {
      await contract.connect(voter1).modifyBallot(1, 2, 3);
      const c2 = await contract.getCandidate(1, 2);
      expect(c2.primaryVotes).to.equal(1);
    });

    it("BM-08: event contains old and new preferences", async function () {
      const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
      await expect(contract.connect(voter1).modifyBallot(1, 2, 0))
        .to.emit(contract, "BallotModified")
        .withArgs(1, voter1.address, 1, 3, 2, 0, anyValue);
    });
  });

  // ================================================================
  // RESULT CALCULATION (RC-01 to RC-10)
  // ================================================================
  describe("Result Calculation", function () {
    it("RC-01: clear primary winner", async function () {
      await setupActiveElection();
      await contract.connect(voter1).castBallot(1, 1, 0);
      await contract.connect(voter2).castBallot(1, 1, 0);
      await contract.connect(voter3).castBallot(1, 2, 0);
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.resultStatus).to.equal(1); // PrimaryResult
      expect(e.winnerId).to.equal(1);
    });

    it("RC-02: tie-break resolves via second preferences", async function () {
      await setupActiveElection();
      // Tie: candidates 1 and 2 each get 2 primary votes
      await contract.connect(voter1).castBallot(1, 1, 3);
      await contract.connect(voter2).castBallot(1, 1, 2);
      await contract.connect(voter3).castBallot(1, 2, 1);
      await contract.connect(voter4).castBallot(1, 2, 1);
      // candidate 1 secondary: 2 (from voter3 + voter4)
      // candidate 2 secondary: 1 (from voter2)
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.resultStatus).to.equal(2); // TieBreakResolved
      expect(e.winnerId).to.equal(1); // candidate 1 wins tie-break
    });

    it("RC-03: tie-break also tied -> fallback (lowest ID)", async function () {
      await setupActiveElection();
      // Tie: candidates 1 and 2 each get 2 primary, same secondary
      await contract.connect(voter1).castBallot(1, 1, 2);
      await contract.connect(voter2).castBallot(1, 1, 0);
      await contract.connect(voter3).castBallot(1, 2, 1);
      await contract.connect(voter4).castBallot(1, 2, 0);
      // candidate 1 secondary: 1, candidate 2 secondary: 1
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.resultStatus).to.equal(3); // ResolvedByFallback
      expect(e.winnerId).to.equal(1); // lowest ID wins
    });

    it("RC-04: no votes -> NoVotes result", async function () {
      await setupActiveElection();
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.resultStatus).to.equal(5); // NoVotes
      expect(e.winnerId).to.equal(0);
    });

    it("RC-05: NoTieBreak mode -> TieUnresolved", async function () {
      // Create election with NoTieBreak mode (1)
      await contract.createElection("No TB", "Desc", START, END, true, 1);
      await contract.addCandidate(1, "A", "A");
      await contract.addCandidate(1, "B", "B");
      await contract.authorizeVoter(1, voter1.address);
      await contract.authorizeVoter(1, voter2.address);
      await contract.startElection(1);
      await contract.connect(voter1).castBallot(1, 1, 0);
      await contract.connect(voter2).castBallot(1, 2, 0);
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.resultStatus).to.equal(4); // TieUnresolved
      expect(e.winnerId).to.equal(0);
    });

    it("RC-06: cannot finalize non-Ended election", async function () {
      await setupActiveElection();
      await expect(
        contract.finalizeElection(1)
      ).to.be.revertedWithCustomError(contract, "InvalidElectionStatus");
    });

    it("RC-07: non-creator cannot finalize", async function () {
      await setupActiveElection();
      await contract.endElection(1);
      await expect(
        contract.connect(voter1).finalizeElection(1)
      ).to.be.revertedWithCustomError(contract, "NotElectionCreator");
    });

    it("RC-08: three-way tie resolved by secondary", async function () {
      await setupActiveElection();
      // 3-way tie: each candidate gets 1 primary
      await contract.connect(voter1).castBallot(1, 1, 2);
      await contract.connect(voter2).castBallot(1, 2, 3);
      await contract.connect(voter3).castBallot(1, 3, 2);
      // secondaries: cand1=0, cand2=2(v1+v3), cand3=1(v2)
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.resultStatus).to.equal(2); // TieBreakResolved
      expect(e.winnerId).to.equal(2); // candidate 2 has most secondaries
    });

    it("RC-09: tie where no ballots have second preferences -> fallback", async function () {
      await setupActiveElection();
      await contract.connect(voter1).castBallot(1, 1, 0);
      await contract.connect(voter2).castBallot(1, 2, 0);
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.resultStatus).to.equal(3); // ResolvedByFallback
      expect(e.winnerId).to.equal(1);
    });

    it("RC-10: TieDetected event emitted", async function () {
      await setupActiveElection();
      await contract.connect(voter1).castBallot(1, 1, 0);
      await contract.connect(voter2).castBallot(1, 2, 0);
      await contract.endElection(1);
      await expect(contract.finalizeElection(1))
        .to.emit(contract, "TieDetected")
        .withArgs(1, 2);
    });
  });

  // ================================================================
  // EDGE CASES (EC-01 to EC-06)
  // ================================================================
  describe("Edge Cases", function () {
    it("EC-01: election with exactly 2 candidates works", async function () {
      await createElection();
      await contract.addCandidate(1, "A", "A");
      await contract.addCandidate(1, "B", "B");
      await contract.authorizeVoter(1, voter1.address);
      await contract.startElection(1);
      await contract.connect(voter1).castBallot(1, 1, 2);
      const b = await contract.getBallot(1, voter1.address);
      expect(b.exists).to.be.true;
    });

    it("EC-03: single voter in election -> clear winner", async function () {
      await createElection();
      await contract.addCandidate(1, "A", "A");
      await contract.addCandidate(1, "B", "B");
      await contract.authorizeVoter(1, voter1.address);
      await contract.startElection(1);
      await contract.connect(voter1).castBallot(1, 2, 0);
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.resultStatus).to.equal(1);
      expect(e.winnerId).to.equal(2);
    });

    it("EC-04: all voters choose same candidate -> unanimous", async function () {
      await setupActiveElection();
      await contract.connect(voter1).castBallot(1, 1, 0);
      await contract.connect(voter2).castBallot(1, 1, 0);
      await contract.connect(voter3).castBallot(1, 1, 0);
      await contract.endElection(1);
      await contract.finalizeElection(1);
      const e = await contract.getElection(1);
      expect(e.winnerId).to.equal(1);
      const c = await contract.getCandidate(1, 1);
      expect(c.primaryVotes).to.equal(3);
    });

    it("EC-05: multiple modifications keep tallies correct", async function () {
      await setupActiveElection();
      await contract.connect(voter1).castBallot(1, 1, 2);
      await contract.connect(voter1).modifyBallot(1, 2, 3);
      await contract.connect(voter1).modifyBallot(1, 3, 1);
      const c1 = await contract.getCandidate(1, 1);
      const c2 = await contract.getCandidate(1, 2);
      const c3 = await contract.getCandidate(1, 3);
      expect(c1.primaryVotes).to.equal(0);
      expect(c1.secondaryVotes).to.equal(1);
      expect(c2.primaryVotes).to.equal(0);
      expect(c2.secondaryVotes).to.equal(0);
      expect(c3.primaryVotes).to.equal(1);
      expect(c3.secondaryVotes).to.equal(0);
    });

    it("EC-06: non-existent election reverts", async function () {
      await expect(contract.getElection(999))
        .to.be.revertedWithCustomError(contract, "ElectionDoesNotExist");
    });

    it("EC-07: getAllCandidates returns correct data", async function () {
      await createElection();
      await contract.addCandidate(1, "Alice", "A");
      await contract.addCandidate(1, "Bob", "B");
      const candidates = await contract.getAllCandidates(1);
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[1].name).to.equal("Bob");
    });

    it("EC-08: voter can be authorized during active election", async function () {
      await setupActiveElection();
      await contract.authorizeVoter(1, nonAuth.address);
      expect(await contract.isEligibleVoter(1, nonAuth.address)).to.be.true;
      await contract.connect(nonAuth).castBallot(1, 1, 0);
      const b = await contract.getBallot(1, nonAuth.address);
      expect(b.exists).to.be.true;
    });

    it("EC-09: cannot revoke voter during active election", async function () {
      await setupActiveElection();
      await expect(
        contract.revokeVoter(1, voter1.address)
      ).to.be.revertedWithCustomError(contract, "InvalidElectionStatus");
    });

    it("EC-10: electionCount increments correctly", async function () {
      await createElection();
      await createElection();
      await createElection();
      expect(await contract.getElectionCount()).to.equal(3);
    });
  });
});
