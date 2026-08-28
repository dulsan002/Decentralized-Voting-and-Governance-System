const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const fs = require('fs');
  const path = require('path');
  const dbData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/db.json'), 'utf8'));
  
  const wallets = dbData.users
    .map(u => u.linkedWalletAddress)
    .filter(addr => addr && addr.startsWith('0x'));

  for (let wallet of wallets) {
    const tx = await deployer.sendTransaction({
      to: wallet,
      value: ethers.parseEther("100.0")
    });
    await tx.wait();
    console.log(`✓ Funded ${wallet} with 100 ETH`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
