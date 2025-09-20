const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting PlayStoreX Smart Contract Deployment...");

  // Get the contract factories
  const GamingAssetNFT = await ethers.getContractFactory("GamingAssetNFT");
  const PaymentManager = await ethers.getContractFactory("PaymentManager");
  const PlayStoreX = await ethers.getContractFactory("PlayStoreX");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "FIL");

  // Deploy GamingAssetNFT
  console.log("\n🎮 Deploying GamingAssetNFT...");
  const gamingAssetNFT = await GamingAssetNFT.deploy(
    "PlayStoreX Gaming Assets",
    "PSXA"
  );
  await gamingAssetNFT.deployed();
  console.log("✅ GamingAssetNFT deployed to:", gamingAssetNFT.address);

  // Deploy PaymentManager
  console.log("\n💳 Deploying PaymentManager...");
  const paymentManager = await PaymentManager.deploy();
  await paymentManager.deployed();
  console.log("✅ PaymentManager deployed to:", paymentManager.address);

  // Deploy PlayStoreX
  console.log("\n🏪 Deploying PlayStoreX Marketplace...");
  const playStoreX = await PlayStoreX.deploy();
  await playStoreX.deployed();
  console.log("✅ PlayStoreX deployed to:", playStoreX.address);

  // Set up initial configuration
  console.log("\n⚙️ Setting up initial configuration...");
  
  // Set base URI for NFT metadata
  await gamingAssetNFT.setBaseURI("https://api.playstorex.io/metadata/");
  console.log("✅ NFT base URI set");

  // Set platform fee to 2.5%
  await paymentManager.setPlatformFee(250); // 2.5%
  await playStoreX.setPlatformFee(250); // 2.5%
  console.log("✅ Platform fee set to 2.5%");

  // Add USDFC as supported payment token (if available)
  try {
    const USDFC_ADDRESS = "0x80B98d3aa09ffff255c3ba4A241111Ff1262F045"; // Filecoin Calibration USDFC
    await paymentManager.addPaymentToken(USDFC_ADDRESS, "USDFC", 18, true);
    console.log("✅ USDFC added as supported payment token");
  } catch (error) {
    console.log("⚠️ Could not add USDFC token:", error.message);
  }

  // Verify contracts (if on testnet/mainnet)
  if (process.env.NETWORK !== "hardhat") {
    console.log("\n🔍 Verifying contracts...");
    try {
      await hre.run("verify:verify", {
        address: gamingAssetNFT.address,
        constructorArguments: ["PlayStoreX Gaming Assets", "PSXA"],
      });
      console.log("✅ GamingAssetNFT verified");
    } catch (error) {
      console.log("⚠️ GamingAssetNFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: paymentManager.address,
        constructorArguments: [],
      });
      console.log("✅ PaymentManager verified");
    } catch (error) {
      console.log("⚠️ PaymentManager verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: playStoreX.address,
        constructorArguments: [],
      });
      console.log("✅ PlayStoreX verified");
    } catch (error) {
      console.log("⚠️ PlayStoreX verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: process.env.NETWORK || "hardhat",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      GamingAssetNFT: {
        address: gamingAssetNFT.address,
        name: "PlayStoreX Gaming Assets",
        symbol: "PSXA"
      },
      PaymentManager: {
        address: paymentManager.address,
        platformFee: "2.5%"
      },
      PlayStoreX: {
        address: playStoreX.address,
        platformFee: "2.5%"
      }
    },
    configuration: {
      nftBaseURI: "https://api.playstorex.io/metadata/",
      platformFeePercentage: 250,
      supportedTokens: ["FIL", "USDFC"]
    }
  };

  // Write deployment info to file
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "deployments", `${process.env.NETWORK || "hardhat"}.json`);
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.dirname(deploymentPath);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

  console.log("\n🎉 PlayStoreX Smart Contract Deployment Complete!");
  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🎮 GamingAssetNFT: ${gamingAssetNFT.address}`);
  console.log(`💳 PaymentManager: ${paymentManager.address}`);
  console.log(`🏪 PlayStoreX: ${playStoreX.address}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n🔗 Next Steps:");
  console.log("1. Update your frontend configuration with the new contract addresses");
  console.log("2. Test the contracts with sample transactions");
  console.log("3. Deploy to Filecoin Mainnet when ready");
  console.log("4. Update your README with the deployed contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
