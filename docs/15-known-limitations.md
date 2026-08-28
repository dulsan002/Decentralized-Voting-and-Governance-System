# 15 — Known Limitations

## Academic Prototype Limitations

This document honestly records the known limitations of the DecentraVote academic prototype.

### L-01: No Secret Ballot

**Limitation:** Votes are publicly visible on the blockchain. Any observer can link a wallet address to their vote preferences.

**Reason:** Public blockchains are transparent by design. Implementing ballot secrecy requires advanced cryptographic techniques (zero-knowledge proofs, commit-reveal schemes, homomorphic encryption) that are beyond the scope of this academic prototype.

**Mitigation in production:** Cryptographic commitment schemes, ZK-SNARKs, or dedicated privacy-preserving voting protocols.

### L-02: Wallet Address ≠ Identity

**Limitation:** The system identifies voters by wallet address, not by verified real-world identity. One person could theoretically control multiple wallet addresses.

**Reason:** On-chain identity verification (KYC) is out of scope. The system trusts the organizer to authorize only legitimate addresses.

**Mitigation in production:** Integration with decentralized identity (DID) systems, oracle-based identity verification, or traditional KYC processes.

### L-03: Gas Costs

**Limitation:** Every vote and modification requires gas. On Ethereum mainnet, this could be prohibitively expensive for large-scale elections.

**Reason:** Fundamental property of Ethereum.

**Mitigation in production:** Layer-2 deployment (Polygon, Arbitrum, Optimism), gas sponsorship (meta-transactions), or alternative low-cost chains.

### L-04: Scalability of Voter Authorization

**Limitation:** Authorizing thousands of voters individually is gas-expensive. Batch operations help but are still O(n).

**Mitigation in production:** Merkle tree-based eligibility proofs (voters prove their own eligibility against an on-chain root hash).

### L-05: Candidate Loop in Finalization

**Limitation:** The `finalizeElection` function iterates over all candidates. With very many candidates, this could hit gas limits.

**Mitigation:** Maximum candidate cap enforced in contract. For academic use, this is not a practical concern.

### L-06: Time Manipulation (Development Only)

**Limitation:** On Hardhat Network, block timestamps can be manipulated for testing. On a real network, miners/validators have limited timestamp influence.

**Impact:** Tests use time manipulation to verify deadline enforcement. This is correct test methodology.

### L-07: Single Contract Architecture

**Limitation:** All election logic is in one contract. A vulnerability in one function could theoretically affect the entire system.

**Mitigation in production:** Upgradeable proxy patterns, factory contract for election isolation, formal verification.

### L-08: Frontend-Only Caching

**Limitation:** There is no off-chain indexer (e.g., The Graph). Large event history queries may be slow.

**Mitigation in production:** Deploy a subgraph or off-chain indexing service.

### L-09: No Governance Token

**Limitation:** The system uses simple address-based access control, not token-weighted governance.

**Reason:** The assessment focuses on traditional election-style voting, not DAO governance.

### L-10: No Real-Time Results During Active Election

**Design Decision:** Whether to show live tallies during an active election is configurable. Showing results before the election ends could influence voter behavior.

**Current approach:** Results are visible after the election ends and is finalized, consistent with traditional election practice.

---

*These limitations are documented to support honest academic discussion. They do not represent failures — they represent conscious scope decisions for an academic prototype.*
