// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface ICompoundV2Viewer {
    struct CompV2PoolParamsResponse {
        address token;
        uint256 decimals;
        address underlyingToken;
        uint256 underlyingDecimals;
        uint256 reserveFactorMantissa;
        bool isListed;
        bool mintPaused;
        bool borrowPaused;
        uint256 collateralFactorMantissa;
    }

    struct CompV2PoolStateResponse {
        uint256 currentNumber;
        uint256 accrualNumber;
        uint256 exchangeRate;
        uint256 supplyRate;
        uint256 borrowRate;
        uint256 totalBorrows;
        uint256 totalReserves;
        uint256 totalSupply;
        uint256 totalCash;
        uint256 borrowCap;
        bool isPerBlock;
    }

    function compV2PoolParams(
        address comptroller,
        address pool
    )
        external
        view
        returns (CompV2PoolParamsResponse memory);

    function compV2PoolState(
        address comptroller,
        address pool
    )
        external
        view
        returns (CompV2PoolStateResponse memory);
}

interface ICompoundV3Viewer {
    struct CompV3PoolParamsResponse {
        address token;
        uint256 decimals;
        address underlyingToken;
        uint256 underlyingDecimals;
        uint256 reserveFactorMantissa;
        bool isListed;
        bool mintPaused;
        bool borrowPaused;
        uint256 collateralFactorMantissa;
    }

    struct CompV3PoolStateResponse {
        uint256 currentNumber;
        uint256 accrualNumber;
        uint256 exchangeRate;
        uint256 supplyRate;
        uint256 borrowRate;
        uint256 totalBorrows;
        uint256 totalReserves;
        uint256 totalSupply;
        uint256 totalCash;
        uint256 borrowCap;
        bool isPerBlock;
    }

    function compV3PoolParams(
        address comptroller,
        address pool
    )
        external
        view
        returns (CompV3PoolParamsResponse memory);

    function compV3PoolState(
        address comptroller,
        address pool
    )
        external
        view
        returns (CompV3PoolStateResponse memory);
}

interface CompoundV3Pool {
    function numAssets() external view returns (uint256);

    function supplyTo(address dst, address asset, uint256 amount) external;

    function withdrawTo(address to, address asset, uint256 amount) external;

    function baseToken() external view returns (address);

    function totalSupply() external view returns (uint256);

    function totalBorrow() external view returns (uint256);

    function totalReserves() external view returns (uint256);

    function borrowPerSecondInterestRateBase() external view returns (uint256);

    function borrowPerSecondInterestRateSlopeHigh() external view returns (uint256);

    function borrowPerSecondInterestRateSlopeLow() external view returns (uint256);

    function supplyPerSecondInterestRateSlopeLow() external view returns (uint256);

    function supplyPerSecondInterestRateSlopeHigh() external view returns (uint256);

    function supplyKink() external view returns (uint256);

    function borrowKink() external view returns (uint256);

    function storeFrontPriceFactor() external view returns (uint256);

    function isWithdrawPaused() external view returns (bool);

    function isTransferPaused() external view returns (bool);

    function isSupplyPaused() external view returns (bool);

    function isBuyPaused() external view returns (bool);

    function getUtilization() external view returns (uint256);

    function getReserves() external view returns (int256);

    function baseTrackingSupplySpeed() external view returns (uint256);

    function baseTrackingBorrowSpeed() external view returns (uint256);

    function baseScale() external view returns (uint256);

    function baseMinForRewards() external view returns (uint256);

    function baseBorrowMin() external view returns (uint256);
}

interface ComptrollerStorage {
    /**
     * @notice Return all of the markets
     * @dev The automatic getter may be used to access an individual market.
     * @return The list of market addresses
     */
    function getAllMarkets() external view returns (address[] memory);
}

interface ComptrollerLensInterface {
    function markets(address) external view returns (bool, uint256);

    function borrowCaps(address) external view returns (uint256);

    function mintGuardianPaused(address) external view returns (bool);

    function borrowGuardianPaused(address) external view returns (bool);

    function guardianPaused(address) external view returns (bool, bool);
}

interface Comptroller {
    /**
     * @notice Return the address of the COMP token
     * @return The address of COMP
     */
    function getCompAddress() external view returns (address);

    /**
     * @notice Claim all the comp accrued by holder  in the specified markets
     * @param holder The address to claim COMP for
     * @param cTokens The list of markets to claim COMP in
     */
    function claimComp(address holder, address[] memory cTokens) external;


    function getAccountLiquidity(address account) external view returns (uint, uint, uint);
}

interface CNative {
    function mint() external payable;
    function repayBorrowBehalf(address borrower) external  payable returns (uint256);

}

interface CToken {
    function borrowRateMaxMantissa() external view returns (uint256);

    function accrualBlockNumber() external view returns (uint256);

    function accrualBlockTimestamp() external view returns (uint256);

    function borrowIndex() external view returns (uint256);

    function comptroller() external view returns (address);

    function symbol() external view returns (string memory);

    function reserveFactorMantissa() external view returns (uint256);

    function totalBorrows() external view returns (uint256);

    function totalReserves() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function totalCash() external view returns (uint256);

    function decimals() external view returns (uint8);

    /**
     * User Interface **
     */

    function transfer(address dst, uint256 amount) external returns (bool);

    function transferFrom(address src, address dst, uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function underlying() external view returns (address);

    function balanceOf(address owner) external view returns (uint256);

    function balanceOfUnderlying(address owner) external returns (uint256);

    function getAccountSnapshot(address account) external view returns (uint256, uint256, uint256, uint256);

    function borrowRatePerBlock() external view returns (uint256);

    function supplyRatePerBlock() external view returns (uint256);

    function borrowRatePerTimestamp() external view returns (uint256);

    function supplyRatePerTimestamp() external view returns (uint256);

    function totalBorrowsCurrent() external returns (uint256);

    function borrowBalanceCurrent(address account) external returns (uint256);

    function borrowBalanceStored(address account) external view returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function exchangeRateStored() external view returns (uint256);

    function getCash() external view returns (uint256);

    function accrueInterest() external returns (uint256);

    function seize(address liquidator, address borrower, uint256 seizeTokens) external returns (uint256);

    function mint(uint256 mintAmount) external;

    function redeem(uint256 redeemTokens) external;

    function redeemUnderlying(uint256 redeemAmount) external;

    function borrow(uint256 borrowAmount) external returns (uint256);

    function repayBorrow(uint256 repayAmount) external returns (uint256);

    function repayBorrowBehalf(address borrower, uint256 repayAmount) external  returns (uint256);

    function liquidateBorrow(
        address borrower,
        uint256 repayAmount,
        address cTokenCollateral
    )
        external
        returns (uint256);
}
