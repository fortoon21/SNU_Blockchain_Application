import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { Wallet, ethers, id } from "ethers";
import { Spinner } from "../utils/spinner";
import {
  LINK_ADDRESSES,
  create2DeployerAddress,
  WETH_ADDRESSES,
  LENDING_POOLS,
} from "./constants";
import { Deployer } from "./utils";
import { bytecode as leverage_bytecode } from "../artifacts/contracts/Leverager.sol/Leverager.json";
import { bytecode as multicall3_bytecode } from "../artifacts/contracts/helpers/Multicall3.sol/Multicall3.json";
task(`deploy-leverager`, `Deploys Leverager.sol smart contract`)
  .addOptionalParam(
    `vault`,
    `The address of the Vault contract for flashloan on the source blockchain`
  )
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const routerAddress = taskArguments.router
        ? taskArguments.router
        : getRouterConfig(hre.network.name).address;
      const linkAddress = taskArguments.link
        ? taskArguments.link
        : LINK_ADDRESSES[hre.network.name];

      const wnativeAddress = taskArguments.wnative
        ? taskArguments.wnative
        : WETH_ADDRESSES[hre.network.name];
      const vault = taskArguments.vault
        ? taskArguments.vault
        : LENDING_POOLS[hre.network.name].AaveV3LendingPool;

      const privateKey = getPrivateKey();
      const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

      const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
      const wallet = new Wallet(privateKey);

      const deployer = new Deployer(wallet, provider, create2DeployerAddress);

      const spinner: Spinner = new Spinner();

      console.log(
        `ℹ️  Attempting to deploy SourceMinter smart contract on the ${hre.network.name} blockchain using ${wallet.address} address, with the Router address ${routerAddress} and LINK address ${linkAddress} provided as constructor arguments`
      );
      spinner.start();

      // await deployer.deploy(id("lever-ez"), multicall3_bytecode);

      await deployer.deploy(
        id("lever_ez"),
        leverage_bytecode +
          deployer.encoder(
            ["address", "address", "address", "address"],
            [wnativeAddress, routerAddress, linkAddress, vault]
          )
      );

      spinner.stop();
      console.log(`✅ on the ${hre.network.name} blockchain`);
    }
  );
