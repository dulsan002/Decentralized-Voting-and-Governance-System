# 10 — Gas & Scalability

## Gas Optimization Strategy

### Design Decisions

| Decision | Gas Impact | Trade-off |
|----------|-----------|-----------|
| Incremental tallying (update on each vote) | ~5,000 gas extra per vote (SSTORE) | Eliminates unbounded loop at finalization |
| Custom errors instead of require strings | ~300 gas saved per revert | Slightly less readable in raw transactions |
| Struct packing (address + enums in one slot) | One fewer SSTORE per election | Requires careful ordering |
| Events for history (not storage) | ~375 gas per topic vs ~20,000 for SSTORE | Historical data not readable by contract |
| Batch voter authorization | Amortizes base tx cost | Caller must manage array size |
| No on-chain sorting | Avoids O(n log n) gas cost | Finalization uses O(n) scan instead |

### Gas Cost Estimates (Approximate)

| Operation | Estimated Gas | Notes |
|-----------|-------------|-------|
| `createElection` | ~150,000–200,000 | Stores strings (variable length) |
| `addCandidate` | ~80,000–120,000 | One candidate with name and description |
| `authorizeVoter` (single) | ~45,000–55,000 | SSTORE for bool mapping |
| `authorizeVotersBatch` (10 voters) | ~350,000–450,000 | ~35,000–45,000 per voter |
| `castBallot` | ~80,000–120,000 | Store ballot + update 1-2 tallies |
| `modifyBallot` | ~60,000–90,000 | Update ballot + adjust tallies |
| `startElection` | ~30,000–40,000 | Status transition |
| `endElection` | ~30,000–40,000 | Status transition |
| `finalizeElection` (5 candidates) | ~80,000–150,000 | Loop over candidates for tallies |
| `finalizeElection` (20 candidates) | ~200,000–400,000 | Larger loop but still bounded |

> These are rough estimates. Actual gas will be measured during Phase 4 testing.

### Avoided Anti-Patterns

| Anti-Pattern | Risk | Our Approach |
|-------------|------|-------------|
| Looping over all voters | O(n) gas, unbounded | No voter iteration in any function |
| Storing ballot history array | Storage grows per modification | History via events only |
| On-chain string comparison | Expensive | Use IDs for lookup, strings for display |
| Recalculating results per view | Unnecessary computation | Results calculated once at finalization |
| Storing derived data | Redundant storage cost | Derive percentages in frontend |

### Core Integrity vs. Gas Trade-off

The following rules MUST remain on-chain despite gas cost:
- Eligibility verification
- Duplicate vote prevention
- Election status enforcement
- Deadline enforcement
- Preference validation
- Tally integrity

These are **non-negotiable**. Moving them off-chain would undermine the decentralized trust model.

---

## Scalability Analysis

### Horizontal Scaling Considerations

| Factor | Current Design | Scaling Concern | Mitigation |
|--------|---------------|----------------|------------|
| Number of elections | Sequential IDs, mapping | No gas concern — O(1) access | None needed |
| Candidates per election | Bounded loop at finalization | Gas at finalization scales linearly | Cap candidates (e.g., max 50) |
| Voters per election | Mapping (O(1) access) | No loop over voters | None needed |
| Total ballots | Per-election mapping | No cross-election iteration | None needed |
| Event history | Grows with usage | Log queries may slow for frontend | Frontend pagination + filters |

### Potential Bottlenecks

#### 1. Large Voter Lists (Authorization)
**Concern:** Authorizing thousands of voters one-by-one is expensive.  
**Current mitigation:** `authorizeVotersBatch` function with caller-controlled array size.  
**Future mitigation:** Merkle tree-based voter eligibility (off-chain list, on-chain root verification). This is a significant enhancement beyond the academic scope but is architecturally feasible.

#### 2. Many Candidates in Finalization
**Concern:** Finalization iterates over all candidates twice (find max, find ties).  
**Current mitigation:** Reasonable candidate cap. For an academic prototype, elections typically have 2–10 candidates.  
**Recommendation:** Add a `MAX_CANDIDATES` constant (e.g., 50) and enforce it in `addCandidate`.

#### 3. Event Querying Performance
**Concern:** Frontend queries blockchain events. With many elections and thousands of ballots, event queries can be slow.  
**Current mitigation:** Indexed event parameters enable filtered queries. Frontend uses specific block ranges.  
**Future mitigation:** Off-chain event indexer (e.g., The Graph) for production-grade querying. For the academic prototype, direct RPC queries are sufficient.

#### 4. Frontend Pagination
**Concern:** Displaying hundreds of elections or thousands of audit entries.  
**Mitigation:** Frontend implements pagination and lazy loading. Elections are fetched by ID range. Events are filtered by election.

### Layer-2 Considerations

The contract architecture is compatible with Layer-2 deployment:
- No hard-coded chain IDs or block-gas limits
- No dependency on specific Ethereum mainnet features
- Could deploy to Polygon, Arbitrum, or Optimism for lower gas costs
- Academic deployment uses Sepolia (Layer-1 testnet) as specified

### On-Chain vs. Off-Chain Boundary

```
AUTHORITATIVE (On-Chain):
├── Election configuration
├── Candidate data
├── Voter eligibility
├── Ballot data (current)
├── Vote tallies
├── Election status
├── Results
└── Event audit trail

NON-AUTHORITATIVE (Off-Chain / Frontend):
├── Election list cache
├── Formatted display data
├── Percentage calculations
├── Pagination state
├── Wallet connection state
├── UI theme/preferences
└── Derived analytics
```

Any off-chain data can be regenerated entirely from on-chain state. The blockchain is the source of truth.
