const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying BlockHire contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📍 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(
    await hre.ethers.provider.getBalance(deployer.address)
  ), "ETH\n");

  // Deploy contract
  const BlockHire = await hre.ethers.getContractFactory("BlockHire");
  const blockHire = await BlockHire.deploy();
  
  await blockHire.waitForDeployment();
  
  const contractAddress = await blockHire.getAddress();
  
  console.log("✅ BlockHire deployed to:", contractAddress);
  console.log("\n📋 Save this address in your frontend .env file!");
  console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);
  
  // Verify deployment
  const owner = await blockHire.owner();
  const platformFee = await blockHire.platformFeePercent();
  
  console.log("\n📊 Contract Details:");
  console.log("   Owner:", owner);
  console.log("   Platform Fee:", platformFee.toString(), "%");
  
  // Wait for block confirmations if on testnet
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n⏳ Waiting for block confirmations...");
    await blockHire.deploymentTransaction().wait(5);
    console.log("✅ Confirmed!");
    
    // Verify on Etherscan
    console.log("\n🔍 Verifying on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Verified on Etherscan!");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });