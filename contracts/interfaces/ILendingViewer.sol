//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ILendingViewer {
    /**
     * @notice Get the balance of the account
     * @dev If supplyToken and borrowToken are the same, it is compound V2 like lending
     * @param account The address of account
     * @param underlyingAsset The underlying asset address
     * @param supplyToken The supply token address
     * @param borrowToken The borrow token address
     * @return collaterals The amount of collaterals
     * @return debts The amount of debts
     */
    function balance(
        address account,
        address underlyingAsset,
        address supplyToken,
        address borrowToken
    )
        external
        returns (uint256 collaterals, uint256 debts);

    /**
     * @notice Get the price of the asset
     * @param asset The asset address
     * @return price The price of the asset
     */
    function price(address asset) external view returns (uint256 price);
    /**
     * @notice Get the ltv value of the position
     * @param collateralAsset The collateral asset address
     * @param debtAsset The debt asset address
     * @return ltv The loan to value of the position
     */
    function ltv(address collateralAsset, address debtAsset) external view returns (uint256 ltv);

    function liquidity(
        address collateralAsset,
        address debtAsset
    )
        external
        view
        returns (uint256 lending, uint256 borrowing);

    function interestRates(
        address supplyToken,
        address borrowToken
    )
        external
        view
        returns (uint256 lending, uint256 borrowing);
}
