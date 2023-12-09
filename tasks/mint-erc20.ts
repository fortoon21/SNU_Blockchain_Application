import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { Wallet, ethers, parseEther } from "ethers";
import { Spinner } from "../utils/spinner";
import { AAVE_V3_A_TOKENS, MINTABLE_ERC20_TOKENS } from "./constants";
import { MockERC20, MockERC20__factory } from "../typechain-types";

task(`mint-erc20`, `Mints several ERC20 tokens to EOA`).setAction(
  async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const routerAddress = taskArguments.router
      ? taskArguments.router
      : getRouterConfig(hre.network.name).address;

    const privateKey = getPrivateKey();
    const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

    const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(provider);

    const spinner: Spinner = new Spinner();
    console.log(
      `ℹ️  Attempting to mint several ERC20 tokens on the ${hre.network.name} blockchain using ${wallet.address} address`
    );
    spinner.start();
    console.log(hre.network.name);
    console.log(rpcProviderUrl);
    console.log(wallet);
    const dai: MockERC20 = MockERC20__factory.connect(
      MINTABLE_ERC20_TOKENS[hre.network.name].DAI,
      signer
    );
    const usdc: MockERC20 = MockERC20__factory.connect(
      MINTABLE_ERC20_TOKENS[hre.network.name].USDC,
      signer
    );
    const usdt: MockERC20 = MockERC20__factory.connect(
      MINTABLE_ERC20_TOKENS[hre.network.name].USDT,
      signer
    );
    const weth: MockERC20 = MockERC20__factory.connect(
      MINTABLE_ERC20_TOKENS[hre.network.name].WETH,
      signer
    );
    const wbtc: MockERC20 = MockERC20__factory.connect(
      MINTABLE_ERC20_TOKENS[hre.network.name].WBTC,
      signer
    );

    const promises = [
      dai.mint(wallet.address, parseEther("1000000")),
      usdc.mint(wallet.address, parseEther("1000000")),
      usdt.mint(wallet.address, parseEther("1000000")),
      wbtc.mint(wallet.address, parseEther("1000000")),
    ];
    if (hre.network.name !== "ethereumSepolia") {
      promises.push(weth.mint(wallet.address, parseEther("1000000")));
    }

    for await (const tx of promises) {
      await tx.wait();
    }

    spinner.stop();
    console.log(
      `✅ All ERC20 tokens are minted to address ${wallet.address} on the ${hre.network.name} blockchain`
    );
  }
);
