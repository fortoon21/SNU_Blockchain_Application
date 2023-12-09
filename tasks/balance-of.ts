import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { ethers } from "ethers";
import { getPrivateKey, getProviderRpcUrl } from "./utils";

import {
  AAVE_V3_A_TOKENS,
  AAVE_V3_DEBT_TOKENS,
  MINTABLE_ERC20_TOKENS,
  multicall3Address,
  leveragerAddress,
} from "./constants";
import { Wallet } from "ethers";

import {
  MockERC20__factory,
  Multicall3,
  Multicall3__factory,
} from "../typechain-types";
import { Spinner } from "../utils/spinner";

task("balance-of", "Gets the balance of tokens for provided address")
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

    const mockERC20 = MockERC20__factory.createInterface();
    const calls: Multicall3.Call3Struct[] = [];

    const tokens = ["DAI", "USDC", "USDT", "WBTC", "WETH"] as const;
    tokens.forEach((token) => {
      calls.push({
        target: MINTABLE_ERC20_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("name"),
      });
      calls.push({
        target: MINTABLE_ERC20_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("decimals"),
      });
      calls.push({
        target: MINTABLE_ERC20_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("balanceOf", [wallet.address]),
      });

      calls.push({
        target: MINTABLE_ERC20_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("allowance", [
          wallet.address,
          leveragerAddress[taskArguments.blockchain],
        ]),
      });
      calls.push({
        target: AAVE_V3_A_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("name"),
      });
      calls.push({
        target: AAVE_V3_A_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("decimals"),
      });
      calls.push({
        target: AAVE_V3_A_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("balanceOf", [wallet.address]),
      });
      calls.push({
        target: AAVE_V3_A_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("allowance", [
          wallet.address,
          leveragerAddress[taskArguments.blockchain],
        ]),
      });
      calls.push({
        target: AAVE_V3_DEBT_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("name"),
      });
      calls.push({
        target: AAVE_V3_DEBT_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("decimals"),
      });
      calls.push({
        target: AAVE_V3_DEBT_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("balanceOf", [wallet.address]),
      });
      calls.push({
        target: AAVE_V3_DEBT_TOKENS[taskArguments.blockchain][token],
        allowFailure: true,
        callData: mockERC20.encodeFunctionData("borrowAllowance", [
          wallet.address,
          leveragerAddress[taskArguments.blockchain],
        ]),
      });
    });

    spinner.start();

    const results = await multicall.aggregate3.staticCall(calls);

    const walletStatus: Record<string, Record<string, string>> = {};

    let name = "";
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.success) {
        if (i % 4 === 0) {
          name = mockERC20
            .decodeFunctionResult("name", result.returnData)
            .toString();
          walletStatus[name] = {};
        }
        if (i % 4 === 1) {
          walletStatus[name]["decimals"] = mockERC20
            .decodeFunctionResult("decimals", result.returnData)
            .toString();
        }
        if (i % 4 === 2) {
          walletStatus[name]["balance"] = mockERC20
            .decodeFunctionResult("balanceOf", result.returnData)
            .toString();
        }
        if (i % 4 === 3) {
          walletStatus[name]["allowance"] =
            i % 9 == 8
              ? mockERC20
                  .decodeFunctionResult("borrowAllowance", result.returnData)
                  .toString()
              : mockERC20
                  .decodeFunctionResult("allowance", result.returnData)
                  .toString();
        }
      }
    }

    walletStatus["NATIVE"] = {};
    walletStatus["NATIVE"]["decimals"] = "18";

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
