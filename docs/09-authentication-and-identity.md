# Technical Architecture: Off-Chain Authentication, Identity & S3 Storage

## 1. Overview
DecentraVote separates **Application Authentication & Identity Verification (Off-Chain)** from **Voting & Governance Logic (On-Chain)**.

- **Off-Chain Engine**: Next.js 14, PBKDF2 Password Hashing, HTTP-Only Session Cookies, Private AWS S3 Document Storage, Sri Lankan NIC Multi-Step Registration.
- **On-Chain Engine**: Ethereum / Sepolia Smart Contract (`DecentraVote.sol`), OpenZeppelin RBAC, Preferential Ballot Tallies, Deterministic Tie-Breaking.

---

## 2. Off-Chain vs. On-Chain Data Separation Matrix

| Data Attribute | Storage Location | Protection / Privacy Mechanism |
|----------------|------------------|--------------------------------|
| Full Name, Email, DOB, Phone | Off-Chain (`data/db.json`) | Protected via server-side Auth API |
| Password Hash | Off-Chain (`data/db.json`) | PBKDF2 sha512 with 16-byte random salt |
| Sri Lankan NIC Number | Off-Chain (`data/db.json`) | Off-chain only; masked in Admin UI |
| NIC Front & Back Images | Private S3 Bucket / Secure Fallback | 15-minute S3 signed URLs via Admin API |
| Verification Status | Off-Chain (`data/db.json`) | Admin role authorization |
| Wallet Address Whitelist | On-Chain (`DecentraVote.sol`) | `isEligibleVoter` mapping |
| Cast Ballots & Tallies | On-Chain (`DecentraVote.sol`) | Immutable smart contract state |
| Audit Events | On-Chain (`DecentraVote.sol`) | EVM Event Logs |

---

## 3. Cryptographic Wallet Signature Verification Flow
To link a Web3 wallet (MetaMask / Hardhat) to an approved off-chain voter account:
1. Client requests challenge nonce from `/api/wallet/link`.
2. Server returns challenge message: `"Link wallet to DecentraVote account: nonce <NONCE>"`.
3. User signs message in MetaMask.
4. Server verifies signature via `ethers.verifyMessage(message, signature)`.
5. If recovered address matches target wallet, `linkedWalletAddress` is saved in the off-chain user profile.
