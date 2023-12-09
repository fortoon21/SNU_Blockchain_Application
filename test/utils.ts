import hre from "hardhat";
import { getProviderRpcUrl } from "../tasks/utils";
export const resetFork = async (chainName: string) => {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: `${getProviderRpcUrl(chainName)}`,
        },
      },
    ],
  });
};
