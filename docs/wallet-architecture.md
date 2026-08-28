# Wallet & Identity Architecture

This document describes the separation of identity layers within DecentraVote, ensuring maximum security and adherence to academic requirements.

## 1. Application Identity
*   **What it is:** The off-chain representation of the human voter.
*   **Data stored:** Email, hashed password, User ID, full name, NIC documents, identity verification status.
*   **Authentication:** Managed via JWT tokens and the `/api/auth` endpoints.
*   **Lifecycle:** `PENDING_VERIFICATION` -> `APPROVED` (via Admin) -> `WALLET_LINKED`.

## 2. Blockchain Identity
*   **What it is:** The public cryptographic identifier (Wallet Address) used to interact with the Ethereum smart contract.
*   **Data stored:** Strictly the 42-character public address string (e.g., `0x3C44...`).
*   **Authentication:** Proved via Web3 EIP-4361 style signature challenge.
*   **Important:** DecentraVote is **NON-CUSTODIAL**. It never generates, stores, or asks for private keys or seed phrases. The user is entirely responsible for their MetaMask wallet security.

## 3. The Linking Process (One Voter ↔ One Wallet)
A critical security rule enforced by the system is that one approved human voter can only have **one** verified blockchain address.
1. The user logs in (authenticating their Application Identity).
2. The user navigates to "My Wallet" and clicks "Verify & Link".
3. The frontend requests a cryptographic nonce from the backend.
4. The user signs the nonce using MetaMask (proving ownership of the Blockchain Identity).
5. The backend validates the signature.
6. The backend checks if the address is already registered to another user (preventing Sybil attacks).
7. The backend saves the address as `linkedWalletAddress`.

## 4. Smart Contract Eligibility
The smart contract operates purely on Blockchain Identity (`msg.sender`). It maintains an `isEligibleVoter` mapping. When an Admin approves an identity, they execute an administrative transaction to whitelist the user's `linkedWalletAddress` on-chain. The smart contract does not know the user's name or email.

## 5. Wallet Change Process
If a user loses their private key, they cannot simply type a new address into the UI. They must contact the system administrators, undergo identity re-verification, have their old address revoked from the smart contract, and repeat the cryptographic linking process with a new wallet.
