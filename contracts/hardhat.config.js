require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    filecoinCalibration: {
      url: "https://api.calibration.node.glif.io/rpc/v1",
      chainId: 314159,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "1000000000", // 1 gwei
    },
    filecoinMainnet: {
      url: "https://api.node.glif.io/rpc/v1",
      chainId: 314,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "1000000000", // 1 gwei
    },
  },
  etherscan: {
    apiKey: {
      filecoinCalibration: "your-api-key-here",
      filecoinMainnet: "your-api-key-here",
    },
    customChains: [
      {
        network: "filecoinCalibration",
        chainId: 314159,
        urls: {
          apiURL: "https://api.calibration.node.glif.io/rpc/v1",
          browserURL: "https://calibration.filscan.io",
        },
      },
      {
        network: "filecoinMainnet",
        chainId: 314,
        urls: {
          apiURL: "https://api.node.glif.io/rpc/v1",
          browserURL: "https://filscan.io",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
