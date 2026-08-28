const hre = require("hardhat");

async function main() {
  console.log("Deploying DecentraVote...");
  console.log("Network:", hre.network.name);

  const [deployer, voter1, voter2, voter3] = await hre.ethers.getSigners();
  console.log("Deployer / Organizer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  const DecentraVote = await hre.ethers.getContractFactory("DecentraVote");
  const contract = await DecentraVote.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n========================================");
  console.log("DecentraVote deployed successfully!");
  console.log("Contract address:", address);
  console.log("========================================\n");

  // Grant Organizer Role to Account 1 and test accounts
  const ORGANIZER_ROLE = await contract.ORGANIZER_ROLE();
  await contract.grantRole(ORGANIZER_ROLE, "0xa20841c6f87ddaf8b1b3b81e7ff732375101d93c");
  await contract.grantRole(ORGANIZER_ROLE, "0xe410db4abf8d6f07ade6c99045288f27bf5dc51d");
  await contract.grantRole(ORGANIZER_ROLE, "0xb9f8196256e7a276729906550f2a14bb2e40d9ba");
  
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.join(__dirname, '../data/db.json');
  let dynamicAdmins = [];
  try {
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    dynamicAdmins = dbData.users
      .filter(u => u.role === 'ADMIN' && u.linkedWalletAddress && u.linkedWalletAddress.startsWith('0x'))
      .map(u => u.linkedWalletAddress);
      
    for (const adminWallet of dynamicAdmins) {
      await contract.grantRole(ORGANIZER_ROLE, adminWallet);
    }
  } catch (err) {
    console.log("Could not read db.json for dynamic admin roles:", err.message);
  }

  console.log(`✓ Granted ORGANIZER_ROLE to dynamic admins: ${dynamicAdmins.length}`);

  // Populate sample elections on-chain
  console.log("Seeding sample governance elections on-chain...");

  const now = Math.floor(Date.now() / 1000);
  const startTime = now - 3600; // 1 hr ago
  const endTime = now + 86400 * 7; // 7 days from now

  // Read all user wallets from db.json to dynamically whitelist everyone for testing
  let dynamicVoters = [];
  try {
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    dynamicVoters = dbData.users
      .map(u => u.linkedWalletAddress)
      .filter(addr => addr && addr.startsWith('0x'));
  } catch (err) {
    console.log("Could not read db.json for dynamic whitelisting:", err.message);
  }

  const baseVoters = [deployer.address, voter1.address, voter2.address, voter3.address];
  const allVoters = [...new Set([...baseVoters, ...dynamicVoters])];
  console.log(`Dynamically whitelisting ${allVoters.length} total addresses...`);

  // Election 1: Presidential Election
  let tx1 = await contract.createElection(
    "Sri Lankan Presidential Governance Election 2026",
    "Institutional preferential election evaluating candidate platforms across Sri Lankan provincial districts with automated 2nd preference tie resolution.",
    startTime,
    endTime,
    true, // _secondPreferenceEnabled
    0 // _tieBreakMode (0 = SecondPreference)
  );
  await tx1.wait();

  await contract.addCandidate(1, "Hon. Anura Dissanayake (Alliance)", "Economic modernization, anti-corruption, and digital governance.");
  await contract.addCandidate(1, "Hon. Sajith Premadasa (Democrat)", "Social welfare, rural infrastructure, and export growth.");
  await contract.addCandidate(1, "Hon. Ranil Wickremesinghe (Reform)", "Financial stabilization, debt restructuring, and trade policy.");

  // Whitelist voters for Election 1
  await contract.authorizeVotersBatch(1, allVoters);

  // Start election
  await contract.startElection(1);

  // Cast sample votes
  const contractAsVoter1 = contract.connect(voter1);
  const contractAsVoter2 = contract.connect(voter2);
  await contractAsVoter1.castBallot(1, 1, 2);
  await contractAsVoter2.castBallot(1, 2, 1);

  // Election 2: Infrastructure Ballot
  let tx2 = await contract.createElection(
    "National Infrastructure & Energy Governance Referendum",
    "Public governance ballot on decentralizing provincial clean energy allocation and smart grid infrastructure investments.",
    startTime,
    endTime,
    true,
    0
  );
  await tx2.wait();

  await contract.addCandidate(2, "Proposal A: Solar Microgrid Network Expansion", "Allocate 40% of infrastructure budget to provincial solar grids.");
  await contract.addCandidate(2, "Proposal B: National Offshore Wind Platform", "Focus capital on offshore wind power generation.");
  await contract.authorizeVotersBatch(2, allVoters);
  await contract.startElection(2);

  // Election 3: Colombo Chamber
  let tx3 = await contract.createElection(
    "Colombo Chamber of Commerce Executive Board Election",
    "Institutional preferential vote for executive board member selection with on-chain audit trail.",
    startTime,
    endTime,
    true,
    0
  );
  await tx3.wait();
  await contract.addCandidate(3, "Dr. Hans Wijayasuriya", "Digital Transformation & Regional Trade.");
  await contract.addCandidate(3, "Kasturi Chellaraja Wilson", "Supply Chain & Logistics Expansion.");
  await contract.addCandidate(3, "Vish Govindasamy", "Agri-Export Modernization.");
  await contract.authorizeVotersBatch(3, allVoters);
  await contract.startElection(3);

  // Election 4: Central Bank Referendum
  let tx4 = await contract.createElection(
    "Central Bank Financial Policy Governance Referendum",
    "Advisory referendum on implementing central bank digital currency (CBDC) standards for cross-border settlement.",
    startTime,
    endTime,
    false,
    0
  );
  await tx4.wait();
  await contract.addCandidate(4, "Option 1: Adopt Wholesale CBDC", "Integrate institutional ledger for trade settlements.");
  await contract.addCandidate(4, "Option 2: Retain Traditional RTGS", "Maintain existing domestic real-time gross settlement.");
  await contract.authorizeVotersBatch(4, allVoters);
  await contract.startElection(4);

  // Election 5: Rural Connectivity
  let tx5 = await contract.createElection(
    "Provincial Rural Connectivity & Digital Education Fund",
    "Governance proposal on funding broadband infrastructure for 500 rural schools across Sabaragamuwa and Northern provinces.",
    startTime,
    endTime,
    true,
    0
  );
  await tx5.wait();
  await contract.addCandidate(5, "Approve 100% Grant Allocation", "Direct provincial budget to rural education connectivity.");
  await contract.addCandidate(5, "Approve PPP Telecom Concession", "Leverage private sector telecom infrastructure investment.");
  await contract.authorizeVotersBatch(5, allVoters);
  await contract.startElection(5);

  console.log("✓ Sample elections created and whitelisted successfully on-chain!");

  // Auto-update lib/contract.js with the new address
  const contractFilePath = path.join(__dirname, '../lib/contract.js');
  let contractFileContent = fs.readFileSync(contractFilePath, 'utf8');
  contractFileContent = contractFileContent.replace(/export const CONTRACT_ADDRESS = process\.env\.NEXT_PUBLIC_CONTRACT_ADDRESS \|\| "0x[a-fA-F0-9]{40}";/, `export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "${address}";`);
  fs.writeFileSync(contractFilePath, contractFileContent);
  console.log("✓ Frontend lib/contract.js automatically updated with new address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
