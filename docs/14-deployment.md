# 14 — Deployment

## Deployment Sequence

```
LOCAL HARDHAT NETWORK
        ↓
CONTRACT TESTS (all pass)
        ↓
LOCAL DAPP INTEGRATION
        ↓
SEPOLIA TESTNET DEPLOYMENT
        ↓
END-TO-END TESTNET TESTING
        ↓
FINAL DEMONSTRATION
```

## Local Development

### Hardhat Network
- Starts with `npx hardhat node`
- Chain ID: 31337
- Provides 20 funded test accounts
- Instant mining for fast development

### Local Deployment Script
```
npx hardhat run scripts/deploy.js --network localhost
```

### Frontend Development
```
npm run dev
```
- Points to local Hardhat network
- Uses local contract address from deployment

## Sepolia Testnet Deployment

### Prerequisites
- Sepolia ETH in deployer wallet (via faucet)
- Infura/Alchemy API key for Sepolia RPC
- Deployer private key (in `.env`, NEVER committed)

### Hardhat Network Configuration
```javascript
// hardhat.config.js
networks: {
    hardhat: {},
    localhost: {
        url: "http://127.0.0.1:8545"
    },
    sepolia: {
        url: process.env.SEPOLIA_RPC_URL,
        accounts: [process.env.DEPLOYER_PRIVATE_KEY],
        chainId: 11155111
    }
}
```

### Deployment Command
```
npx hardhat run scripts/deploy.js --network sepolia
```

### Post-Deployment Checklist
- [ ] Record contract address
- [ ] Record deployment transaction hash
- [ ] Record deployer address
- [ ] Verify contract on Etherscan (if possible)
- [ ] Update frontend environment with Sepolia contract address
- [ ] Test frontend against Sepolia
- [ ] Perform end-to-end voting flow on testnet

## Environment Variables

### `.env.example` (committed to git)
```
# Deployment
DEPLOYER_PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key_here

# Frontend
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

### `.env` (NEVER committed)
Contains actual secrets.

## Security: What Must NOT Be Committed

- Private keys
- Seed phrases / mnemonics
- API keys (Infura, Alchemy)
- `.env` files with real values
- Wallet credentials

## Deployment Evidence to Capture

| Evidence | Description |
|----------|-------------|
| Contract address | The deployed contract address |
| Deployment tx hash | Transaction that created the contract |
| Network | Sepolia / Chain ID |
| Block number | Block containing deployment tx |
| ABI | Contract ABI used |
| Compiler version | Solidity compiler version |
| Etherscan link | If contract verified |
| Test transactions | End-to-end test tx hashes |
