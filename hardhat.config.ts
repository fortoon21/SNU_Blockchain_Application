import * as dotenvenc from "@chainlink/env-enc";
dotenvenc.config();
import "xdeployer";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks";
import "hardhat-tracer";
import "hardhat-contract-sizer";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHEREUM_SEPOLIA_RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL;
const POLYGON_MUMBAI_RPC_URL = process.env.POLYGON_MUMBAI_RPC_URL;
const OPTIMISM_GOERLI_RPC_URL = process.env.OPTIMISM_GOERLI_RPC_URL;
const ARBITRUM_TESTNET_RPC_URL = process.env.ARBITRUM_TESTNET_RPC_URL;
const AVALANCHE_FUJI_RPC_URL = process.env.AVALANCHE_FUJI_RPC_URL;
console.log("ETHEREUM_SEPOLIA_RPC_URL", ETHEREUM_SEPOLIA_RPC_URL);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    // settings: {
    //   viaIR: true,
    // },
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },
    ethereumSepolia: {
      url:
        ETHEREUM_SEPOLIA_RPC_URL !== undefined ? ETHEREUM_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    polygonMumbai: {
      url: POLYGON_MUMBAI_RPC_URL !== undefined ? POLYGON_MUMBAI_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 80001,
    },
    optimismGoerli: {
      url: OPTIMISM_GOERLI_RPC_URL !== undefined ? OPTIMISM_GOERLI_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 420,
    },
    arbitrumTestnet: {
      url:
        ARBITRUM_TESTNET_RPC_URL !== undefined ? ARBITRUM_TESTNET_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 421613,
    },
    avalancheFuji: {
      url: AVALANCHE_FUJI_RPC_URL !== undefined ? AVALANCHE_FUJI_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 43113,
    },
  },

  // @ts-ignore
  contractSizer: {
    runOnCompile: true,
  },
  mocha: {
    timeout: 40000000,
    require: ["hardhat/register"],
  },

  xdeploy: {
    contract: "Leverager",
    constructorArgsPath: "./config/",
    salt: "lever_ez",
    signer: PRIVATE_KEY,
    networks: ["hardhat", "ethereumSepolia", "polygonMumbai", "avalancheFuji"],
    rpcUrls: [
      "hardhat",
      ETHEREUM_SEPOLIA_RPC_URL,
      POLYGON_MUMBAI_RPC_URL,
      AVALANCHE_FUJI_RPC_URL,
    ],
    gasLimit: 1_500_000,
  },
};

export default config;
