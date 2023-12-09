// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ILeverager {
    // For supply
    //  * @param asset The address of the underlying asset to deposit
    //  * @param supplyToken The address of the cToken / aToken
    //  * @param amount The underlying asset amount to be deposited
    //  * @param flags flags is 3bits expression
    //  * the 1st for lending pool type(1 for aave, 0 for comp)
    //  * the 2nd for leverage/deleverage(1 for leverage, 0 for deleverage)
    //  * the 3rd for quote/base(1 for quote, 0 for base)\
    //  *  For examples,
    //  *  | 0x1 | 0x2 | 0x4 |
    //  *  | 0x0 | 0x0 | 0x0 | comp like deleverage using base
    //  *  | 0x1 | 0x1 | 0x0 | aave like leverage using base
    // * @param data Encoded LeverageParams data
    // For withdraw
    // * @param asset The address of the underlying asset to withdraw
    // * @param supplyToken The address of the cToken / aToken
    // * @param amount The underlying asset amount to withdraw from supplyToken (cToken / aToken amount)
    // * @param flags flags is 1 bit expression
    // * the 1st for lending pool type(1 for aave, 0 for comp)
    // *  For examples,
    // *  | 0x1 |
    // *  | 0x0 | comp like
    // *  | 0x1 | aave like
    // For borrow
    // * @param asset The address of the underlying asset to borrow
    // * @param borrowToken The address of the cToken / debtToken
    // * @param amount The underlying asset amount to be borrowed
    // * @param flags flags is 1 bit expression
    // * the 1st for lending pool type(1 for aave, 0 for comp)
    // *  For examples,
    // *  | 0x1 |
    // *  | 0x0 | comp like
    // *  | 0x1 | aave like
    // * @param data data is for the borrowApprove signature
    // For close
    // * @param asset The address of the underlying asset to deposit
    // * @param borrowToken The address of the cToken / debtToken
    // * @param amount The underlying asset amount to be repaid
    // * @param flags flags is 3bits expression
    // * the 1st for lending pool type(1 for aave, 0 for comp)
    // * the 2nd for leverage/deleverage(1 for leverage, 0 for deleverage)
    // * We assume that repaying directly using the flashloan amount is the most efficient way
    // *  For examples,
    // *  | 0x1 | 0x2 |
    // *  | 0x0 | 0x0 | comp like deleverage using asset
    // *  | 0x1 | 0x1 | aave like leverage using asset
    // * @param data Encoded LeverageParams data
    
    struct InputParams{
        address asset;
        address counterAsset;
        uint256 amount;
        uint8 flags;
        bytes data;
    }
    /**
     * @notice for Aave token would be ETH address(underlying) for aETH token
     * @dev Supplies an `amount` of underlying asset into the target lending pool, receiving in return aTokens.
     * - E.g. User deposits 100 USDC to vault, vault supplys to lending pool, and provides 100 iUSDC to
     * user
     * @param params InputParams struct that contains all the required params to supply
     */
    function supply(
        InputParams memory params
    )
        external
        payable
        returns (uint256);

    /**
     * @notice for Aave token would be ETH address(underlying) for aETH token
     * @dev Supplies an `amount` of underlying asset into the target lending pool, receiving in return aTokens.
     * - E.g. User deposits 100 USDC to vault, vault supplys to lending pool, and provides 100 iUSDC to
     * user
     */
    function withdraw(InputParams memory params) external returns (uint256);

    /**
     * @notice for Aave token would be ETH address(underlying) for aETH token
     * @dev Borrows an `amount` of underlying asset on behalf of msg.sender receiving in return underlying tokens.
     * - E.g. User delegates the borrow allowance to leverager and it borrows `amount` of underlying asset like 100 USDC
     * user
     */
    function borrow(InputParams memory params) external returns (uint256);
    /**
     * @notice for Aave token would be ETH address(underlying) for aETH token
     * @dev Closes the position by repay or deleverage an `amount` of underlying asset into the target lending
     * pool.
     * - E.g. User transfers 100 USDC to vault, vault repays to lending pool on behalf of user (with flashloan amount)
    
     */
    function close(
        InputParams memory params
    )
        external
        payable
        returns (uint256);
}
