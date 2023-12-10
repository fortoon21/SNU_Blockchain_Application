import {
  PayFeesIn,
  routerConfig,
  RAY,
  WAD_RAY_RATIO,
  PERCENTAGE_FACTOR,
  SECONDS_PER_YEAR,
} from "./constants";

import {
  AbiCoder,
  ParamType,
  formatUnits,
  getBigInt,
  getCreate2Address,
  keccak256,
  parseUnits,
} from "ethers";
import {
  Create2DeployerLocal__factory,
  Create2DeployerLocal,
} from "../typechain-types/contracts";
import { Wallet, JsonRpcProvider } from "ethers";

export const getProviderRpcUrl = (network: string) => {
  let rpcUrl;

  switch (network) {
    case "ethereumSepolia":
      rpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;
      break;
    case "optimismGoerli":
      rpcUrl = process.env.OPTIMISM_GOERLI_RPC_URL;
      break;
    case "arbitrumTestnet":
      rpcUrl = process.env.ARBITRUM_TESTNET_RPC_URL;
      break;
    case "avalancheFuji":
      rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
      break;
    case "polygonMumbai":
      rpcUrl = process.env.POLYGON_MUMBAI_RPC_URL;
      break;
    default:
      throw new Error("Unknown network: " + network);
  }
  console.log("rpcUrl", rpcUrl);

  if (!rpcUrl)
    throw new Error(
      `rpcUrl empty for network ${network} - check your environment variables`
    );

  return rpcUrl;
};

export const getPrivateKey = () => {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey)
    throw new Error(
      "private key not provided - check your environment variables"
    );

  return privateKey;
};

export const getRouterConfig = (network: string) => {
  switch (network) {
    case "ethereumSepolia":
      return routerConfig.ethereumSepolia;
    case "optimismGoerli":
      return routerConfig.optimismGoerli;
    case "arbitrumTestnet":
      return routerConfig.arbitrumTestnet;
    case "avalancheFuji":
      return routerConfig.avalancheFuji;
    case "polygonMumbai":
      return routerConfig.polygonMumbai;
    default:
      throw new Error("Unknown network: " + network);
  }
};

export const getPayFeesIn = (payFeesIn: string) => {
  let fees;

  switch (payFeesIn) {
    case "Native":
      fees = PayFeesIn.Native;
      break;
    case "native":
      fees = PayFeesIn.Native;
      break;
    case "LINK":
      fees = PayFeesIn.LINK;
      break;
    case "link":
      fees = PayFeesIn.LINK;
      break;
    default:
      fees = PayFeesIn.Native;
      break;
  }

  return fees;
};

export class Deployer {
  public encoder;
  public create2Address;
  public wallet: Wallet;
  public factoryAddress: string;

  constructor(_wallet: Wallet, _provider: JsonRpcProvider, factory: string) {
    this.wallet = _wallet.connect(_provider);
    this.factoryAddress = factory;

    this.encoder = (
      types: readonly (string | ParamType)[],
      values: readonly any[]
    ) => {
      const encodeParams = new AbiCoder().encode(types, values);
      return encodeParams.slice(2);
    };
    this.create2Address = (saltHex: string, initCode: string) => {
      const create2Addr: string = getCreate2Address(
        this.factoryAddress,
        saltHex,
        keccak256(initCode)
      );
      return create2Addr;
    };
  }

  async deploy(this: any, salt: string, initCode: string) {
    const create2Addr: string = this.create2Address(salt, initCode);
    console.log("precomputed address: ", create2Addr);

    const create2Factory: Create2DeployerLocal =
      Create2DeployerLocal__factory.connect(this.factoryAddress, this.wallet);
    const tx = await create2Factory.deploy(0, salt, initCode);
    await tx.wait();

    console.log("deployed address: ", create2Addr);
  }
}

export function rayMul(a: bigint, b: bigint) {
  return (
    (getBigInt(a) * getBigInt(b) + getBigInt(RAY) / getBigInt(2)) /
    getBigInt(RAY)
  );
}

export function rayDiv(a: bigint, b: bigint) {
  return (
    (getBigInt(a) * getBigInt(RAY) + getBigInt(b) / getBigInt(2)) / getBigInt(b)
  );
}

export function wadToRay(a: bigint) {
  return getBigInt(a) * getBigInt(WAD_RAY_RATIO);
}
export function getOverallBorrowRate(
  totalStableDebt: bigint,
  totalVariableDebt: bigint,
  currentVariableBorrowRate: bigint,
  averageStableBorrowRate: bigint
): bigint {
  const totalBorrow = totalStableDebt + totalVariableDebt;
  if (totalBorrow === getBigInt(0)) return getBigInt(0);
  const weightedVariableRate = rayMul(
    wadToRay(totalVariableDebt),
    currentVariableBorrowRate
  );
  const weightedStableRate = rayMul(
    wadToRay(totalStableDebt),
    averageStableBorrowRate
  );
  return rayDiv(
    weightedVariableRate + weightedStableRate,
    wadToRay(totalBorrow)
  );
}

function percentMul(value: bigint, percentage: bigint) {
  return (
    (value * percentage + getBigInt(PERCENTAGE_FACTOR) / getBigInt(2)) /
    getBigInt(PERCENTAGE_FACTOR)
  );
}

export function calculateLinearInterest(
  rate: bigint,
  currentTimestamp: bigint,
  lastUpdateTimestamp: bigint
): bigint {
  const timeDelta = currentTimestamp - lastUpdateTimestamp;

  return getBigInt(RAY) + (rate * timeDelta) / getBigInt(SECONDS_PER_YEAR);
}

export function calculateCompoundedInterest(
  rate: bigint,
  currentTimestamp: bigint,
  lastUpdateTimestamp: bigint
): bigint {
  const timeDelta = currentTimestamp - lastUpdateTimestamp;
  if (timeDelta === getBigInt(0)) return getBigInt(RAY);
  let expMinusOne: bigint;
  let expMinusTwo: bigint;
  let basePowerTwo: bigint;
  let basePowerThree: bigint;

  expMinusOne = timeDelta - getBigInt(1);

  expMinusTwo =
    timeDelta > getBigInt(2) ? timeDelta - getBigInt(2) : getBigInt(0);

  basePowerTwo =
    rayMul(rate, rate) /
    (getBigInt(SECONDS_PER_YEAR) * BigInt(SECONDS_PER_YEAR));
  basePowerThree = rayMul(basePowerTwo, rate) / getBigInt(SECONDS_PER_YEAR);

  let secondTerm: bigint = timeDelta * expMinusOne * basePowerTwo;
  secondTerm /= 2n;

  let thirdTerm: bigint =
    timeDelta * expMinusOne * expMinusTwo * basePowerThree;
  thirdTerm /= 6n;

  return (
    getBigInt(RAY) +
    (rate * timeDelta) / getBigInt(SECONDS_PER_YEAR) +
    secondTerm +
    thirdTerm
  );
}

export function calculateAvailableBorrows(
  totalCollateralBase: bigint,
  totalDebtBase: bigint,
  avgLTV: bigint
): bigint {
  let availableBorrowBase = percentMul(totalCollateralBase, avgLTV);
  if (availableBorrowBase === totalDebtBase) return getBigInt(0);

  availableBorrowBase = availableBorrowBase - totalDebtBase;

  return availableBorrowBase;
}

export function calculateAaveInterestRate({
  totalStableDebt,
  totalVariableDebt,
  availableLiquidity,
  optimalUtilization,
  optimalStableToTotalDebtRatio,
  maxExcessStableToTotalDebtRatio,
  baseVariableBorrowRate,
  stableRateSlope1,
  stableRateSlope2,
  variableRateSlope1,
  variableRateSlope2,
  baseStableBorrowRate,
  stableRateExcessOffset,
  reserveFactor,
  unbacked,
  isDai,
}: {
  totalStableDebt: bigint;
  totalVariableDebt: bigint;
  availableLiquidity: bigint;
  optimalUtilization: bigint;
  optimalStableToTotalDebtRatio: bigint;
  maxExcessStableToTotalDebtRatio: bigint;
  baseVariableBorrowRate: bigint;
  stableRateSlope1: bigint;
  stableRateSlope2: bigint;
  variableRateSlope1: bigint;
  variableRateSlope2: bigint;
  baseStableBorrowRate: bigint;
  stableRateExcessOffset: bigint;
  reserveFactor: bigint;
  unbacked: bigint;
  isDai: boolean;
}): {
  borrowUsageRatio: bigint;
  currentLiquidityRate: bigint;
  currentStableBorrowRate: bigint;
  currentVariableBorrowRate: bigint;
} {
  const totalBorrow = totalStableDebt + totalVariableDebt;

  const totalLiquidity = availableLiquidity + totalBorrow;

  let borrowUsageRatio = getBigInt(0);
  let supplyUsageRatio = getBigInt(0);

  let currentVariableBorrowRate = baseVariableBorrowRate;
  let currentStableBorrowRate = baseStableBorrowRate;
  let stableToTotalDebtRatio = getBigInt(0);
  if (totalBorrow !== getBigInt(0)) {
    stableToTotalDebtRatio = rayDiv(totalStableDebt, totalBorrow);
    borrowUsageRatio = rayDiv(totalBorrow, totalLiquidity);
    supplyUsageRatio = rayDiv(totalBorrow, totalLiquidity + unbacked);
  }

  if (borrowUsageRatio > optimalUtilization) {
    const excessBorrowUsageRatio = rayDiv(
      borrowUsageRatio - optimalUtilization,
      getBigInt(RAY) - optimalUtilization
    );
    currentStableBorrowRate +=
      stableRateSlope1 + rayMul(stableRateSlope2, excessBorrowUsageRatio);
    currentVariableBorrowRate +=
      variableRateSlope1 + rayMul(variableRateSlope2, excessBorrowUsageRatio);
  } else {
    currentStableBorrowRate += rayDiv(
      rayMul(stableRateSlope1, borrowUsageRatio),
      optimalUtilization
    );
    currentVariableBorrowRate += rayDiv(
      rayMul(variableRateSlope1, borrowUsageRatio),
      optimalUtilization
    );
  }

  if (stableToTotalDebtRatio > optimalStableToTotalDebtRatio) {
    const excessStableDebtRatio = rayDiv(
      stableToTotalDebtRatio - optimalStableToTotalDebtRatio,
      maxExcessStableToTotalDebtRatio
    );
    currentStableBorrowRate += rayMul(
      stableRateExcessOffset,
      excessStableDebtRatio
    );
  }

  const currentLiquidityRate = percentMul(
    rayMul(
      getOverallBorrowRate(
        totalStableDebt,
        totalVariableDebt,
        currentVariableBorrowRate,
        currentStableBorrowRate
      ),
      supplyUsageRatio
    ),
    getBigInt(PERCENTAGE_FACTOR) - reserveFactor
  );

  if (isDai) {
    console.log("totalStableDebt", formatUnits(totalStableDebt, 18));
    console.log("totalVariableDebt", totalVariableDebt);
    console.log("availableLiquidity", availableLiquidity);
    console.log("optimalUtilization", optimalUtilization);
    console.log("optimalStableToTotalDebtRatio", optimalStableToTotalDebtRatio);
    console.log(
      "maxExcessStableToTotalDebtRatio",
      maxExcessStableToTotalDebtRatio
    );
    console.log("baseVariableBorrowRate", baseVariableBorrowRate);
    console.log("stableRateSlope1", stableRateSlope1);
    console.log("stableRateSlope2", stableRateSlope2);
    console.log("variableRateSlope1", variableRateSlope1);
    console.log("variableRateSlope2", variableRateSlope2);
    console.log("baseStableBorrowRate", baseStableBorrowRate);
    console.log("stableRateExcessOffset", stableRateExcessOffset);
    console.log("reserveFactor", reserveFactor);
    console.log("unbacked", unbacked);

    console.log("stableToTotalDebtRatio", stableToTotalDebtRatio);
    console.log("optimalStableToTotalDebtRatio", optimalStableToTotalDebtRatio);

    const data = {
      totalStableDebt: String(totalStableDebt),
      totalVariableDebt: String(totalVariableDebt),
      availableLiquidity: String(availableLiquidity),
      optimalUtilization: String(optimalUtilization),
      optimalStableToTotalDebtRatio: String(optimalStableToTotalDebtRatio),
      maxExcessStableToTotalDebtRatio: String(maxExcessStableToTotalDebtRatio),
      baseVariableBorrowRate: String(baseVariableBorrowRate),
      stableRateSlope1: String(stableRateSlope1),
      stableRateSlope2: String(stableRateSlope2),
      variableRateSlope1: String(variableRateSlope1),
      variableRateSlope2: String(variableRateSlope2),
      baseStableBorrowRate: String(baseStableBorrowRate),
      stableRateExcessOffset: String(stableRateExcessOffset),
      reserveFactor: String(reserveFactor),
      unbacked: String(unbacked),
      stableToTotalDebtRatio: String(stableToTotalDebtRatio),
    };
    writeFileSync("interface/output.json", JSON.stringify(data));
  }

  return {
    borrowUsageRatio,
    currentLiquidityRate,
    currentStableBorrowRate,
    currentVariableBorrowRate,
  };
}

export function calculateLeverage(
  supplyAmt: number,
  suppliedAmt: number,
  currentLTV: number,
  targetLTV: number,
  priceBorrow: number,
  priceSupplyExchangeRate: number, // ray expressions
  flashloanFeePremium: number // precision 10000
) {
  const numerator =
    (supplyAmt + suppliedAmt) * (1 + flashloanFeePremium) -
    suppliedAmt * priceBorrow * currentLTV;

  let denominator =
    1 + flashloanFeePremium - targetLTV * priceBorrow * priceSupplyExchangeRate;

  if (suppliedAmt === 0) {
    denominator *= suppliedAmt;
  } else {
    denominator *= supplyAmt;
  }

  return { leverage: numerator / denominator };
}
/// Take USD
export function calculateFlashloanLeverageToTargetLTV(
  supplyAmt: number,
  suppliedAmt: number,
  borrowedAmt: number,
  leverage: number,
  priceBorrow: number,
  priceSupplyExchangeRate: number, // ray expressions
  flashloanFeePremium: number // precision 10000
): { targetLTV: number } {
  const numerator =
    (suppliedAmt + supplyAmt) * (leverage - 1) * (1 + flashloanFeePremium) +
    priceBorrow * borrowedAmt * priceSupplyExchangeRate;

  const denominator =
    (suppliedAmt + supplyAmt) *
    leverage *
    priceBorrow *
    priceSupplyExchangeRate;

  return { targetLTV: numerator / denominator };
}

export function calculateFlashloanDeleverageBaseAmount(
  supplyAmt: number,
  suppliedAmt: number,
  currentLTV: number,
  targetLTV: number,
  priceBorrow: number,
  priceSupplyExchangeRate: number, // ray expressions
  flashloanFeePremium: number
): { flashloanAmount: number } {
  const numerator =
    (suppliedAmt * priceBorrow * currentLTV -
      supplyAmt -
      suppliedAmt * targetLTV) *
    priceSupplyExchangeRate;
  const denominator =
    (1 + flashloanFeePremium) * targetLTV + priceSupplyExchangeRate;

  return { flashloanAmount: numerator / denominator };
}

export function calculateFlashloanLeverageBaseAmount(
  supplyAmt: number,
  suppliedAmt: number,
  currentLTV: number,
  targetLTV: number,
  priceBorrow: number,
  priceSupplyExchangeRate: number, // ray expressions
  flashloanFeePremium: number
): { flashloanAmount: number } {
  const numerator =
    (supplyAmt * targetLTV + suppliedAmt * (targetLTV - currentLTV)) *
    priceBorrow *
    priceSupplyExchangeRate;

  const denominator =
    1 + flashloanFeePremium - targetLTV * priceBorrow * priceSupplyExchangeRate;

  return { flashloanAmount: numerator / denominator };
}

export function calculateFlashloanLeverageQuoteAmount(
  supplyAmt: number,
  suppliedAmt: number,
  currentLTV: number,
  targetLTV: number,
  priceBorrow: number,
  priceSupplyExchangeRate: number, // ray expressions
  flashloanFeePremium: number
): { flashloanAmount: number } {
  const numerator =
    (suppliedAmt * (targetLTV - currentLTV) + supplyAmt * targetLTV) *
    priceBorrow;
  const denominator =
    1 + flashloanFeePremium - targetLTV * priceBorrow * priceSupplyExchangeRate;

  return { flashloanAmount: numerator / denominator };
}
