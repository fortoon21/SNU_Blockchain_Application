import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { ethers } from "ethers";
import { getPrivateKey, getProviderRpcUrl } from "./utils";

import {
  AAVE_V3_A_TOKENS,
  AAVE_V3_DEBT_TOKENS,
  LENDING_POOLS,
  MINTABLE_ERC20_TOKENS,
  multicall3Address,
} from "./constants";
import { Wallet } from "ethers";

import {
  IPool__factory,
  Multicall3,
  Multicall3__factory,
} from "../typechain-types/contracts";
import { Spinner } from "../utils/spinner";

task("lending-user-status", "Gets the balance of tokens for provided address")
  .addParam(`blockchain`, `The blockchain where to check`)
  .setAction(async (taskArguments: TaskArguments) => {
    const rpcProviderUrl = getProviderRpcUrl(taskArguments.blockchain);
    const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
    const privateKey = getPrivateKey();
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(provider);

    const spinner: Spinner = new Spinner();

    const multicall: Multicall3 = Multicall3__factory.connect(
      multicall3Address,
      signer
    );

    const aaveV3 = IPool__factory.createInterface();
    const calls: Multicall3.Call3Struct[] = [];

    for (const lending in LENDING_POOLS[taskArguments.blockchain]) {
      if (lending.includes("AAVE")) {
        calls.push({
          target: LENDING_POOLS[taskArguments.blockchain][lending],
          allowFailure: true,
          callData: aaveV3.encodeFunctionData("getUserAccountData", [
            wallet.address,
          ]),
        });
      }
    }

    spinner.start();

    const results = await multicall.aggregate3.staticCall(calls);

    const walletStatus: Record<string, Record<string, string>> = {};

    let name = "";
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.success) {
        name = aaveV3
          .decodeFunctionResult("getUserAccountData", result.returnData)
          .toString();
        walletStatus[name] = {};
      }
    }

    walletStatus["NATIVE"]["balance"] = (
      await provider.getBalance(wallet.address)
    ).toString();
    console.log(walletStatus);

    console.log(
      `ℹ️  Attempting to check the balance of ERC20 tokens (${taskArguments.myNft}) for the ${wallet.address} account`
    );

    spinner.stop();
    // console.log(
    //   `ℹ️  The balance of MyNFTs of the ${
    //     wallet.address
    //   } account is ${BigInt(balanceOf)}`
    // );
  });
