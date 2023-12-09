import {
  Leverager__factory,
  Leverager,
  ILeverager,
  IPool__factory,
  IPool,
  MockERC20,
  MockERC20__factory,
} from "../typechain-types";
import { resetFork } from "./utils";
import {
  MINTABLE_ERC20_TOKENS,
  AAVE_V3_A_TOKENS,
  AAVE_V3_DEBT_TOKENS,
  MAX_UINT256,
  WETH_ADDRESSES,
  LINK_ADDRESSES,
  LENDING_POOLS,
  routerConfig,
  ETH_EE_ADDRESS,
} from "../tasks/constants";
import { getPrivateKey } from "../tasks/utils";
import { expect } from "chai";
import { AbiCoder, Wallet, ethers, parseEther, parseUnits } from "ethers";
import hre from "hardhat";
describe("Leverager", () => {
  let leverager: Leverager;
  let signer: any;
  let network: string;
  const ERC20: Record<string, MockERC20> = {};
  const aERC20: Record<string, MockERC20> = {};
  const cERC20: Record<string, MockERC20> = {};
  const debtERC20: Record<string, MockERC20> = {};

  beforeEach(async () => {
    network = process.env.network || "ethereumSepolia";
    console.log("network:", network);
    await resetFork(network);
    console.log("Fork done");

    const privateKey = getPrivateKey();
    const wallet = new Wallet(privateKey);

    signer = await hre.ethers.getSigner(wallet.address);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [signer.address],
    });

    leverager = (
      await (
        await hre.ethers.getContractFactory("Leverager")
      ).deploy(
        WETH_ADDRESSES[network],
        routerConfig[network].address,
        LINK_ADDRESSES[network],
        LENDING_POOLS[network].AaveV3LendingPool
      )
    ).connect(signer);

    // const aaveLendingContract: IPool = await IPool__factory.connect(
    //   LENDING_POOLS[network].AaveV3LendingPool,
    //   signer
    // );

    const leverageAddress = await leverager.getAddress();

    console.log("Leverager deployed to:", leverageAddress);

    for (const [tokenName, tokenAddress] of Object.entries(
      MINTABLE_ERC20_TOKENS[network]
    )) {
      if (tokenName === "DAI" || tokenName === "WETH") {
        ERC20[tokenName] = MockERC20__factory.connect(tokenAddress, signer);
        await ERC20[tokenName].approve(leverageAddress, MAX_UINT256);
        // await aaveLendingContract.setUserUseReserveAsCollateral(
        //   tokenAddress,
        //   true
        // );
      }
    }
    console.log("Approve to Leverager(ERC20) is finished", leverageAddress);

    for (const [tokenName, tokenAddress] of Object.entries(
      AAVE_V3_A_TOKENS[network]
    )) {
      if (tokenName === "DAI" || tokenName === "WETH") {
        aERC20[tokenName] = MockERC20__factory.connect(tokenAddress, signer);
        await aERC20[tokenName].approve(leverageAddress, MAX_UINT256);
      }
    }

    console.log("Approve to Leverager(aToken) is finished", leverageAddress);

    for (const [tokenName, tokenAddress] of Object.entries(
      AAVE_V3_DEBT_TOKENS[network]
    )) {
      if (tokenName === "DAI" || tokenName === "WETH") {
        debtERC20[tokenName] = MockERC20__factory.connect(tokenAddress, signer);
        await debtERC20[tokenName].approveDelegation(
          leverageAddress,
          MAX_UINT256
        );
      }
    }
    console.log("Approve to Leverager(debtToken) is finished", leverageAddress);
  });
  it("supplies DAI using AaveV3", async () => {
    const token = "DAI";
    let flags = 0;
    flags += 1; // aave
    flags += 2; // leverage
    // base

    let amount = parseUnits("1", "ether");
    const balance = await ERC20[token].balanceOf(signer.address);
    console.log(balance, amount.toString());

    /// Vanilla Supply

    const params: ILeverager.InputParamsStruct = {
      asset: MINTABLE_ERC20_TOKENS[network][token],
      counterAsset: AAVE_V3_A_TOKENS[network][token],
      amount: amount,
      flags: flags,
      data: "0x",
    };
    leverager.connect(signer);

    const tx = await leverager.supply(params);
    const receipt = await tx.wait();

    /// Withdraw
    // amount = await aERC20[token].balanceOf(signer.address);
    // flags = 0;
    // flags += 1; // aave
    // // leverage
    // flags += 4; // base

    // const tx2 = await leverager.withdraw(params);
    // const receipt2 = await tx2.wait();
    // console.log("receipt2:", receipt2);

    // expect(await ERC20[token].balanceOf(signer.address)).to.equal(balance);

    /// Borrow
    amount = parseUnits("0.5", "ether");
    params.amount = amount;
    params.counterAsset = AAVE_V3_DEBT_TOKENS[network][token];

    console.log("before ", await ERC20[token].balanceOf(signer.address));
    console.log(
      "before debt",
      await debtERC20[token].balanceOf(signer.address)
    );
    const tx3 = await leverager.borrow(params);
    const receipt3 = await tx3.wait();

    console.log("after ", await ERC20[token].balanceOf(signer.address));
    console.log(
      "after debt ",
      await debtERC20[token].balanceOf(signer.address)
    );

    /// Vanilla Close(Repay)
    params.amount = parseUnits("0.5", "ether");
    params.data = "0x";

    console.log(
      "before debt",
      await debtERC20[token].balanceOf(signer.address)
    );
    const tx4 = await leverager.close(params);
    const receipt4 = await tx4.wait();
    console.log(
      "after debt ",
      await debtERC20[token].balanceOf(signer.address)
    );

    const repayFlashloanData = new AbiCoder().encode(
      ["address", "address", "uint256", "bytes"],
      [
        AAVE_V3_DEBT_TOKENS[network][token],
        MINTABLE_ERC20_TOKENS[network][token],
        parseUnits("2", "ether"),
        "0x",
      ]
    );

    flags = 0;
    flags += 1; // aave

    /// Leverage Supply
    const supplyFlashloanData = new AbiCoder().encode(
      ["address", "address", "uint256", "bytes"],
      [
        MINTABLE_ERC20_TOKENS[network][token],
        AAVE_V3_DEBT_TOKENS[network][token],
        parseUnits("2", "ether"),
        "0x",
      ]
    );
    params.data = supplyFlashloanData;
    const tx5 = await leverager.supply(params);
    const receipt5 = await tx5.wait();

    // deleverage

    const closeFlashloanData = new AbiCoder().encode(
      ["address", "address", "uint256", "bytes"],
      [
        MINTABLE_ERC20_TOKENS[network][token],
        AAVE_V3_DEBT_TOKENS[network][token],
        parseUnits("2", "ether"),
        "0x",
      ]
    );
    params.amount = "0";

    params.data = closeFlashloanData;
    const tx6 = await leverager.close(params);
    const receipt6 = await tx6.wait();

    expect(await debtERC20[token].balanceOf(signer.address)).to.equal(
      parseUnits("1", "ether")
    );
    expect(await aERC20[token].balanceOf(signer.address)).to.equal(
      parseUnits("2", "ether")
    );
    expect(await ERC20[token].balanceOf(signer.address)).to.equal(balance);
  });

  // it("supplies ETH using AaveV3", async () => {
  //   const token = "WETH";
  //   let flags = 0;
  //   flags += 1; // aave
  //   flags += 2; // leverage
  //   // base

  //   let amount = parseUnits("1", "gwei");
  //   const ethBalance = await hre.ethers.provider.getBalance(signer.address);
  //   const balance = await ERC20[token].balanceOf(signer.address);
  //   console.log(balance, amount.toString());

  //   const params: ILeverager.InputParamsStruct = {
  //     asset: ETH_EE_ADDRESS,
  //     counterAsset: AAVE_V3_A_TOKENS[network][token],
  //     amount: amount,
  //     flags: flags,
  //     data: "0x",
  //   };
  //   leverager.connect(signer);
  //   const tx = await leverager.supply(params, { value: amount });
  //   const receipt = await tx.wait();

  //   console.log("receipt:", receipt);

  //   amount = await aERC20[token].balanceOf(signer.address);
  //   flags = 0;
  //   flags += 1; // aave
  //   // leverage
  //   flags += 4; // base

  //   console.log("aWETH amount" + amount.toString());
  //   params.amount = amount;

  //   const tx2 = await leverager.withdraw(params);
  //   const receipt2 = await tx2.wait();
  //   console.log("receipt2:", receipt2);
  //   console.log(
  //     "ethBalance:",
  //     ethBalance,
  //     await hre.ethers.provider.getBalance(signer.address)
  //   );
  //   expect(await ERC20[token].balanceOf(signer.address)).to.equal(balance);
  // });
});
