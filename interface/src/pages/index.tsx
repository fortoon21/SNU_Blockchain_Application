// pages/index.js
import { formatUnits } from "ethers";
import { promises as fs } from "fs";
import Image from "next/image";
import { useRouter } from "next/router";

const DEMO_LINK = "https://www.desmos.com/calculator/fpshn0nmvn";

function calculateAaveInterestRate({
  totalStableDebt,
  totalVariableDebt,
  availableLiquidity,
  optimalUtilization,
  baseStableBorrowRate,
  baseVariableBorrowRate,
  stableRateSlope1,
  stableRateSlope2,
  variableRateSlope1,
  variableRateSlope2,
}: {
  totalStableDebt: number;
  totalVariableDebt: number;
  availableLiquidity: number;
  optimalUtilization: number;
  baseStableBorrowRate: number;
  baseVariableBorrowRate: number;
  stableRateSlope1: number;
  stableRateSlope2: number;
  variableRateSlope1: number;
  variableRateSlope2: number;
}): {
  currentStableBorrowRate: number;
  currentVariableBorrowRate: number;
} {
  const totalBorrow = totalStableDebt + totalVariableDebt;

  const totalLiquidity = availableLiquidity + totalBorrow;

  let borrowUsageRatio = 0;

  let currentVariableBorrowRate = baseVariableBorrowRate;
  let currentStableBorrowRate = baseStableBorrowRate;
  let stableToTotalDebtRatio = 0;
  if (totalBorrow !== 0) {
    stableToTotalDebtRatio = totalStableDebt / totalBorrow;
    borrowUsageRatio = totalBorrow / totalLiquidity;
  }

  if (borrowUsageRatio > optimalUtilization) {
    const excessBorrowUsageRatio =
      (borrowUsageRatio - optimalUtilization) / (1 - optimalUtilization);
    currentStableBorrowRate +=
      stableRateSlope1 + stableRateSlope2 * excessBorrowUsageRatio;
    currentVariableBorrowRate +=
      variableRateSlope1 + variableRateSlope2 * excessBorrowUsageRatio;
  } else {
    currentStableBorrowRate +=
      (stableRateSlope1 * borrowUsageRatio) / optimalUtilization;
    currentVariableBorrowRate +=
      (variableRateSlope1 * borrowUsageRatio) / optimalUtilization;
  }

  return {
    currentStableBorrowRate,
    currentVariableBorrowRate,
  };
}

type AaveData = {
  totalStableDebt: bigint;
  totalVariableDebt: bigint;
  availableLiquidity: bigint;
  optimalUtilization: bigint;
  baseVariableBorrowRate: bigint;
  stableRateSlope1: bigint;
  stableRateSlope2: bigint;
  variableRateSlope1: bigint;
  variableRateSlope2: bigint;
  baseStableBorrowRate: bigint;
};

const aaveToInputData = (data: AaveData) => {
  const {
    totalStableDebt,
    totalVariableDebt,
    availableLiquidity,
    optimalUtilization,
    baseVariableBorrowRate,
    stableRateSlope1,
    stableRateSlope2,
    variableRateSlope1,
    variableRateSlope2,
    baseStableBorrowRate,
  } = data;

  const result = {
    totalStableDebt: Number(formatUnits(totalStableDebt, 18)),
    totalVariableDebt: Number(formatUnits(totalVariableDebt, 18)),
    availableLiquidity: Number(formatUnits(availableLiquidity, 18)),
    optimalUtilization: Number(formatUnits(optimalUtilization, 27)),
    baseVariableBorrowRate: Number(formatUnits(baseVariableBorrowRate, 27)),
    stableRateSlope1: Number(formatUnits(stableRateSlope1, 27)),
    stableRateSlope2: Number(formatUnits(stableRateSlope2, 27)),
    variableRateSlope1: Number(formatUnits(variableRateSlope1, 27)),
    variableRateSlope2: Number(formatUnits(variableRateSlope2, 27)),
    baseStableBorrowRate: Number(formatUnits(baseStableBorrowRate, 27)),
  };
  return result;
};

export default function Home({ fromAAVE }: { fromAAVE: string }) {
  const router = useRouter();
  const d: AaveData = JSON.parse(fromAAVE);

  const aaveData = aaveToInputData(d);
  const {
    availableLiquidity,
    baseStableBorrowRate,
    baseVariableBorrowRate,
    optimalUtilization,
    stableRateSlope1,
    stableRateSlope2,
    totalStableDebt,
    totalVariableDebt,
    variableRateSlope1,
    variableRateSlope2,
  } = aaveData;

  const totalBorrow = totalStableDebt + totalVariableDebt;
  const totalLiquidity = availableLiquidity + totalBorrow;
  let borrowUsageRatio = 0;

  let currentVariableBorrowRate = baseVariableBorrowRate;
  let currentStableBorrowRate = baseStableBorrowRate;
  let stableToTotalDebtRatio = 0;
  if (totalBorrow !== 0) {
    stableToTotalDebtRatio = totalStableDebt / totalBorrow;
    borrowUsageRatio = totalBorrow / totalLiquidity;
  }

  if (borrowUsageRatio > optimalUtilization) {
    const excessBorrowUsageRatio =
      (borrowUsageRatio - optimalUtilization) / (1 - optimalUtilization);
    currentStableBorrowRate +=
      stableRateSlope1 + stableRateSlope2 * excessBorrowUsageRatio;
    currentVariableBorrowRate +=
      variableRateSlope1 + variableRateSlope2 * excessBorrowUsageRatio;
  } else {
    currentStableBorrowRate +=
      (stableRateSlope1 * borrowUsageRatio) / optimalUtilization;
    currentVariableBorrowRate +=
      (variableRateSlope1 * borrowUsageRatio) / optimalUtilization;
  }

  const R_t = currentStableBorrowRate;
  const U_t = borrowUsageRatio;
  const R_0 = baseStableBorrowRate;
  const U_opt = optimalUtilization;
  const R_s1 = stableRateSlope1;
  const R_s2 = stableRateSlope2;

  return (
    <div className="m-20 ">
      <h1>Utilization Ratio(DAI) - AAVE v3 in Sephoria</h1>
      <Image width={600} height={300} src="/utilization.png" />

      <div className="mt-4">
        <div>R_0 : {R_0} </div>
        <div>U_opt : {U_opt} </div>
        <div>R_s1 : {R_s1} </div>
        <div>R_s2 : {R_s2} </div>
        <div>U_t : {(U_t * 100).toFixed(2)} % </div>
        <div>R_t : {(R_t * 100).toFixed(2)} % </div>
      </div>

      <div>
        <iframe src={`${DEMO_LINK}?embed`} width="400" height="400"></iframe>
      </div>

      <button
        onClick={() => router.push(DEMO_LINK)}
        className="bg-blue-700 px-4 py-2 rounded-md mt-2"
      >
        Link
      </button>
    </div>
  );
}

// pages/index.js
export async function getStaticProps() {
  const data = await fs.readFile(process.cwd() + "/output.json", "utf8");

  return {
    props: { fromAAVE: data },
  };
}
