export const MAX_UINT256 =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export const ETH_EE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export type AddressMap = { [blockchain: string]: string };
export type TokenAmounts = { token: string; amount: string };
export type RewardTokens = {
  token: string;
  tokenPrice: string;
  tokenPriceDecimals: string;
  isAToken: boolean;
  APR: string;
};
export type APR = {
  rewards: RewardTokens[];
  aTotalAPR: string;
  vTotalAPR: string;
};
export const SECONDS_PER_YEAR = 31536000;

export type TokenUnderlyingAddressMap = {
  [blockchain: string]: {
    DAI: string;
    USDC: string;
    USDT: string;
    WETH: string;
    WBTC: string;
    AAVE: string;
  };
};
export type LendingMap = {
  [blockchain: string]: {
    CompoundV2Comptroller?: string;
    AaveV2LendingPool?: string;
    AaveV2IncentivesController?: string;
    AaveV3LendingPool: string;
    AaveV3IncentivesController?: string;
    AaveV3AddressProvider: string;
    AaveV3UiPoolDataProvider: string;
    AaveV3UiIncentiveDataProvider: string;
  };
};
export type RouterMap = {
  [blockchain: string]: {
    address: string;
    chainSelector: string;
    feeTokens: string[];
  };
};

export enum PayFeesIn {
  Native,
  LINK,
}
export const PERCENTAGE_FACTOR = "10000";
export const RAY = "1000000000000000000000000000";
export const WAD_RAY_RATIO = "1000000000";
export const create2DeployerAddress: string =
  "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2";
export const multicall3Address: string =
  "0x39cA4391f1e462B452750D01Be0820573699A8d9";

export const leveragerAddress: AddressMap = {
  [`ethereumSepolia`]: `0x32D5cA45846275A5c0b237bB3Ba0C14556EBF6d1`,
  [`polygonMumbai`]: `0x904D09f842a256DE8B9c389737D2c40Bd860649A`,
  [`avalancheFuji`]: `0x26d71fA254D8BB0092dA7F22e290F078c19f7A98`,
};

export const supportedNetworks = [
  `ethereumSepolia`,
  `optimismGoerli`,
  `arbitrumTestnet`,
  `avalancheFuji`,
  `polygonMumbai`,
];

export const LINK_ADDRESSES: AddressMap = {
  [`ethereumSepolia`]: `0x779877A7B0D9E8603169DdbD7836e478b4624789`,
  [`polygonMumbai`]: `0x326C977E6efc84E512bB9C30f76E30c160eD06FB`,
  [`optimismGoerli`]: `0xdc2CC710e42857672E7907CF474a69B63B93089f`,
  [`arbitrumTestnet`]: `0xd14838A68E8AFBAdE5efb411d5871ea0011AFd28`,
  [`avalancheFuji`]: `0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846`,
};

export const WETH_ADDRESSES: AddressMap = {
  [`ethereumSepolia`]: `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c`,
  [`polygonMumbai`]: `0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889`,
  [`avalancheFuji`]: `0xd00ae08403B9bbb9124bB305C09058E32C39A48c`,
};

export const LENDING_POOLS: LendingMap = {
  [`ethereumSepolia`]: {
    CompoundV2Comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
    AaveV3LendingPool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    AaveV3IncentivesController: "0x4DA5c4da71C5a167171cC839487536d86e083483",
    AaveV3AddressProvider: "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A",
    AaveV3UiPoolDataProvider: "0x69529987FA4A075D0C00B0128fa848dc9ebbE9CE",
    AaveV3UiIncentiveDataProvider: "0xBA25de9a7DC623B30799F33B770d31B44c2C3b77",
  },

  [`polygonMumbai`]: {
    CompoundV2Comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
    AaveV2LendingPool: "0x9198F13B08E299d85E096929fA9781A1E3d5d827",
    AaveV2IncentivesController: "0xd41aE58e803Edf4304334acCE4DC4Ec34a63C644",
    AaveV3LendingPool: "0xcC6114B983E4Ed2737E9BD3961c9924e6216c704",
    AaveV3IncentivesController: "0xBcEF55508Efb890C71c8a6211B3dE02B00430503",
    AaveV3AddressProvider: "0x4CeDCB57Af02293231BAA9D39354D6BFDFD251e0",
    AaveV3UiPoolDataProvider: "0xD64dDe119f11C88850FD596BE11CE398CC5893e6",
    AaveV3UiIncentiveDataProvider: "0x322bCff7b69F832B1a1F56E6BC600C9229CFb907",
  },
  [`avalancheFuji`]: {
    CompoundV2Comptroller: "0x0fEC306943Ec9766C1Da78C1E1b18c7fF23FE09e",
    AaveV2LendingPool: "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9",
    AaveV2IncentivesController: "0x01D83Fe6A10D2f2B7AF17034343746188272cAc9",
    AaveV3LendingPool: "0xccEa5C65f6d4F465B71501418b88FBe4e7071283",
    AaveV3IncentivesController: "0x25f130Df328c8c2f2C0270377D0e7a984E96ce56",
    AaveV3AddressProvider: "0xfb87056c0587923f15EB0aABc7d0572450Cc8003",
    AaveV3UiPoolDataProvider: "0x279c790Afcd547e2f20d896c5DDEe3846b9790B5",
    AaveV3UiIncentiveDataProvider: "0x279c790Afcd547e2f20d896c5DDEe3846b9790B5",
  },
};

export const MINTABLE_ERC20_TOKENS: TokenUnderlyingAddressMap = {
  [`ethereumSepolia`]: {
    DAI: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
    WBTC: "0x29f2D40B0605204364af54EC677bD022dA425d03",
    AAVE: "0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a",
  },
  [`polygonMumbai`]: {
    DAI: "0xc8c0Cf9436F4862a8F60Ce680Ca5a9f0f99b5ded",
    USDC: "0x52D800ca262522580CeBAD275395ca6e7598C014",
    USDT: "0x1fdE0eCc619726f4cD597887C9F3b4c8740e19e2",
    WETH: "0xc199807AF4fEDB02EE567Ed0FeB814A077de4802",
    WBTC: "0x2Fa2e7a6dEB7bb51B625336DBe1dA23511914a8A",
    AAVE: "0x1558c6FadDe1bEaf0f6628BDd1DFf3461185eA24",
  },
  [`avalancheFuji`]: {
    DAI: "0x676bD5B5d0955925aeCe653C50426940c58036c8",
    USDC: "0xCaC7Ffa82c0f43EBB0FC11FCd32123EcA46626cf",
    USDT: "0xBDE7fbbb1DC89E74B73C54Ad911A1C9685caCD83",
    WETH: "0xf97b6C636167B529B6f1D729Bd9bC0e2Bd491848",
    WBTC: "0x0EFD8Ad2231c0B9C4d63F892E0a0a59a626Ce88d",
    AAVE: "0xfB4CeA030Fa61FC435E922CFDc4bF9C80456E19b",
  },
};

export const AAVE_V3_A_TOKENS: TokenUnderlyingAddressMap = {
  [`ethereumSepolia`]: {
    DAI: "0x29598b72eb5CeBd806C5dCD549490FdA35B13cD8",
    USDC: "0x16dA4541aD1807f4443d92D26044C1147406EB80",
    USDT: "0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6",
    WETH: "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830",
    WBTC: "0x1804Bf30507dc2EB3bDEbbbdd859991EAeF6EefF",
    AAVE: "0x6b8558764d3b7572136F17174Cb9aB1DDc7E1259",
  },
  [`polygonMumbai`]: {
    DAI: "0x8903bbBD684B7ef734c01BEb00273Ff52703514F",
    USDC: "0x4086fabeE92a080002eeBA1220B9025a27a40A49",
    USDT: "0x5F3a71D07E95C1E54B9Cc055D418a219586A3473",
    WETH: "0xAba444af64ad33A6d8575b8A353226997d6A126a",
    WBTC: "0xdA67e6C1171D4f0D522Db7f127B88405eA1535d4",
    AAVE: "0xE05705857b3d78aCe3d872b26D9c951B266ECC8d",
  },
  [`avalancheFuji`]: {
    DAI: "0xc2E0542ae75DF6ceC02fea12972918a5D18Eb956",
    USDC: "0xb1c85310a1b809C70fA6806d27Da425C1261F801",
    USDT: "0x13f2B2AFCbe58e72b3d275aC197c3f602CC57735",
    WETH: "0x812664237ad3DfdaA697B77b7919bBde7486D90E",
    WBTC: "0x3d1F7da320eFDE834Cb7974d68591ca65de92FDC",
    AAVE: "0x8419b35fA4AE8105d3241687a6421abA7303E642",
  },
};

export const AAVE_V3_DEBT_TOKENS: TokenUnderlyingAddressMap = {
  [`ethereumSepolia`]: {
    DAI: "0x22675C506A8FC26447aFFfa33640f6af5d4D4cF0",
    USDC: "0x36B5dE936eF1710E1d22EabE5231b28581a92ECc",
    USDT: "0x9844386d29EEd970B9F6a2B9a676083b0478210e",
    WETH: "0x22a35DB253f4F6D0029025D6312A3BdAb20C2c6A",
    WBTC: "0xEB016dFd303F19fbDdFb6300eB4AeB2DA7Ceac37",
    AAVE: "0xf12fdFc4c631F6D361b48723c2F2800b84B519e6",
  },
  [`polygonMumbai`]: {
    DAI: "0x8584Fa491eAF3B959dE0888b5B5b9EF60660eb02",
    USDC: "0x90d909005F13D1Dfd2D8Ab62289309C27E1a066d",
    USDT: "0x04A2bc818911a729460b3FfB4B9ff841CFEC93a1",
    WETH: "0x6B9f12aD327e2760816A8a6c7A740AeA901fEB21",
    WBTC: "0x4ac5719fbd9986b17911815058d3D4f50E6608eA",
    AAVE: "0xe5e880dAd60A9D0f6Cea43a664517F2eb6fe3233",
  },
  [`avalancheFuji`]: {
    DAI: "0x22675C506A8FC26447aFFfa33640f6af5d4D4cF0",
    USDC: "0x36B5dE936eF1710E1d22EabE5231b28581a92ECc",
    USDT: "0x9844386d29EEd970B9F6a2B9a676083b0478210e",
    WETH: "0x22a35DB253f4F6D0029025D6312A3BdAb20C2c6A",
    WBTC: "0xEB016dFd303F19fbDdFb6300eB4AeB2DA7Ceac37",
    AAVE: "0x202AB06b46b0b37804753CF8B2bC0C750b6d6A35",
  },
};

// export const AAVE_V2_A_TOKENS: TokenUnderlyingAddressMap = {
//   [`ethereumSepolia`]: {
//     DAI: "0x29598b72eb5CeBd806C5dCD549490FdA35B13cD8",
//     USDC: "0x16dA4541aD1807f4443d92D26044C1147406EB80",
//     USDT: "0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6",
//     WETH: "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830",
//     WBTC: "0x1804Bf30507dc2EB3bDEbbbdd859991EAeF6EefF",
//   },
//   [`polygonMumbai`]: {
//     DAI: "0x8903bbBD684B7ef734c01BEb00273Ff52703514F",
//     USDC: "0x4086fabeE92a080002eeBA1220B9025a27a40A49",
//     USDT: "0x5F3a71D07E95C1E54B9Cc055D418a219586A3473",
//     WETH: "0xAba444af64ad33A6d8575b8A353226997d6A126a",
//     WBTC: "0xdA67e6C1171D4f0D522Db7f127B88405eA1535d4",
//   },
//   [`avalancheFuji`]: {
//     DAI: "0xc2E0542ae75DF6ceC02fea12972918a5D18Eb956",
//     USDC: "0xb1c85310a1b809C70fA6806d27Da425C1261F801",
//     USDT: "0x13f2B2AFCbe58e72b3d275aC197c3f602CC57735",
//     WETH: "0x812664237ad3DfdaA697B77b7919bBde7486D90E",
//     WBTC: "0x3d1F7da320eFDE834Cb7974d68591ca65de92FDC",
//   },
// };
// export const AAVE_V2_DEBT_TOKENS: TokenUnderlyingAddressMap = {
//   [`ethereumSepolia`]: {
//     DAI: "0x22675C506A8FC26447aFFfa33640f6af5d4D4cF0",
//     USDC: "0x36B5dE936eF1710E1d22EabE5231b28581a92ECc",
//     USDT: "0x9844386d29EEd970B9F6a2B9a676083b0478210e",
//     WETH: "0x22a35DB253f4F6D0029025D6312A3BdAb20C2c6A",
//     WBTC: "0xEB016dFd303F19fbDdFb6300eB4AeB2DA7Ceac37",
//   },
//   [`polygonMumbai`]: {
//     DAI: "0x8584Fa491eAF3B959dE0888b5B5b9EF60660eb02",
//     USDC: "0x90d909005F13D1Dfd2D8Ab62289309C27E1a066d",
//     USDT: "0x04A2bc818911a729460b3FfB4B9ff841CFEC93a1",
//     WETH: "0x6B9f12aD327e2760816A8a6c7A740AeA901fEB21",
//     WBTC: "0x4ac5719fbd9986b17911815058d3D4f50E6608eA",
//   },
//   [`avalancheFuji`]: {
//     DAI: "0x22675C506A8FC26447aFFfa33640f6af5d4D4cF0",
//     USDC: "0x36B5dE936eF1710E1d22EabE5231b28581a92ECc",
//     USDT: "0x9844386d29EEd970B9F6a2B9a676083b0478210e",
//     WETH: "0x22a35DB253f4F6D0029025D6312A3BdAb20C2c6A",
//     WBTC: "0xEB016dFd303F19fbDdFb6300eB4AeB2DA7Ceac37",
//   },
// };

export const routerConfig: RouterMap = {
  ethereumSepolia: {
    address: `0xd0daae2231e9cb96b94c8512223533293c3693bf`,
    chainSelector: `16015286601757825753`,
    feeTokens: [
      LINK_ADDRESSES[`ethereumSepolia`],
      `0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534`,
    ],
  },
  optimismGoerli: {
    address: `0xeb52e9ae4a9fb37172978642d4c141ef53876f26`,
    chainSelector: `2664363617261496610`,
    feeTokens: [
      LINK_ADDRESSES[`optimismGoerli`],
      `0x4200000000000000000000000000000000000006`,
    ],
  },
  avalancheFuji: {
    address: `0x554472a2720e5e7d5d3c817529aba05eed5f82d8`,
    chainSelector: `14767482510784806043`,
    feeTokens: [
      LINK_ADDRESSES[`avalancheFuji`],
      `0xd00ae08403B9bbb9124bB305C09058E32C39A48c`,
    ],
  },
  arbitrumTestnet: {
    address: `0x88e492127709447a5abefdab8788a15b4567589e`,
    chainSelector: `6101244977088475029`,
    feeTokens: [
      LINK_ADDRESSES[`arbitrumTestnet`],
      `0x32d5D5978905d9c6c2D4C417F0E06Fe768a4FB5a`,
    ],
  },
  polygonMumbai: {
    address: `0x70499c328e1e2a3c41108bd3730f6670a44595d1`,
    chainSelector: `12532609583862916517`,
    feeTokens: [
      LINK_ADDRESSES[`polygonMumbai`],
      `0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889`,
    ],
  },
};
