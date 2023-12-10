// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { SafeTransferLib } from "contracts/libraries/SafeTransferLib.sol";
import { SafeCastLib } from "contracts/libraries/SafeCastLib.sol";
import { IAToken, IPool, IDebtToken, IFlashLoanReceiver } from "contracts/interfaces/IAave.sol";
import "contracts/interfaces/ICompound.sol";
import "contracts/interfaces/ILeverager.sol";
import { ReentrancyLock } from "contracts/libraries/ReentrancyLock.sol";
import { UniERC20 } from "contracts/libraries/UniERC20.sol";
import { DataTypesV2 } from "contracts/libraries/DataTypesV2.sol";
import { IWETH } from "contracts/interfaces/IWETH.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import {CCIPReceiver} from "contracts/helpers/CCIPReceiver.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {Propagator} from "contracts/Propagator.sol";    
/// @title Leverager
/// @author Eisen (https://app.eisenfinance.com)
/// @notice Provides Flashloan compounding for yield farmers
/// @custom:version 1.0.0

contract Leverager is IFlashLoanReceiver, ReentrancyLock, ILeverager, Ownable, CCIPReceiver {
    using SafeCastLib for uint256;
    using SafeCastLib for int256;
    using UniERC20 for address;
    using SafeTransferLib for address;

    /* ========== STATE VARIABLES ========== */

    address public immutable vault;
    address public immutable WETH9;
    address public  immutable i_link;
    mapping(uint64 => address) public dstToPropagator;
    Propagator public immutable propagator;

    // flags is 3bits expression
    // the 1st for lending pool type(0 for comp 1 for aave)
    // the 2nd for leverage/deleverage(1 for leverage, 0 for deleverage)
    // the 3rd for quote/base(1 for quote, 0 for base)
    // For examples,
    // | 0x1 | 0x2 | 0x4 |
    // | 0x0 | 0x0 | 0x0 | comp like deleverage using base
    struct LeverageParams {
        address onBehalfOf;
        address supplyAssetUnderlying;
        address supplyToken;
        address borrowAssetUnderlying;
        address borrowToken;
        address flashloanAsset;
        uint256 amount;
        uint256 flashloanAmount;
        uint8 flags;
        bytes signature;
    }

    struct Cache{
        uint256 amount;
        address asset;
        address supplyToken;
        address onBehalfOf;
        address borrowAssetUnderlying;
        address borrowToken;
        uint256 flashloanAmount;
        uint8 flags;
        bytes signature;
        address[] assets;
        uint256[] amounts;
        uint256[] modes;
        bytes data;
    }


    /* ========== EVENT ========== */
    event Supply(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Borrow(address indexed user, address indexed token, uint256 amount);
    event Leverage(address indexed user, address indexed token, uint256 amount, uint256 ltv);
    event Deleverage(address indexed user, address indexed token, uint256 amount, uint256 ltv);
    event Close(address indexed user, uint256 srcChainId, uint256 dstChainId, uint256 amount, uint256 ltv);
     // Event emitted when a message is received from another chain.
    event MessageReceived(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed sourceChainSelector, // The chain selector of the source chain.
        address sender, // The address of the sender from the source chain.
        string text // The text that was received.
    );
    // Event emitted when a message is received from another chain.



    /* ========== ERRORS ========== */
     // Custom errors to provide more descriptive revert messages.
    error SenderNotAllowlisted(address sender); // Used when the sender has not been allowlisted by the contract owner.
    error LengthMismatch(); 
    error InvalidFlashloanCallbackSender();
    error InvalidInitiator(address initiator);
    error MsgValueAmountDiff(uint256 msgValue, uint256 amount);


    /* ========== INITIALIZER ========== */

    constructor(address weth9,  address router, address link, address _vault) Ownable(msg.sender) CCIPReceiver(router) {
        WETH9 = weth9;
        vault = _vault; // aaveV3 lending pool
        i_link = link;
        propagator =new Propagator(router, link, msg.sender);
    }


    receive() external payable { }

    function addDstChainPropagators(uint64[] memory destChainSelectors, address[] memory _propagators) external onlyOwner {
        if (destChainSelectors.length != _propagators.length) revert LengthMismatch();
        for (uint256 i; i<destChainSelectors.length; i++){
            dstToPropagator[destChainSelectors[i]]=_propagators[i];
        }
    }


    /// @inheritdoc ILeverager
    function supply(
        InputParams memory inputParams
    )
        external
        payable
        override
        nonReentrant
        returns (uint256 returnAmount)
    {

        if (inputParams.asset.isETH()&& inputParams.amount!=msg.value ) {
            revert MsgValueAmountDiff(msg.value, inputParams.amount);

        } else {
            inputParams.asset.safeTransferFrom(msg.sender, address(this), inputParams.amount);
        }
        returnAmount = inputParams.counterAsset.balanceOf(msg.sender);

        uint256 flashloanAmount;
        if (inputParams.data.length == 0) {
            if (inputParams.flags & 0x1 == 0) {
                _compV2Supply(inputParams.asset.isETH(), inputParams.asset, inputParams.counterAsset, inputParams.amount, msg.sender);
            } else {
                _aaveSupply(inputParams.asset.isETH(), inputParams.asset, inputParams.counterAsset, inputParams.amount, msg.sender);
            }

        } else {
            Cache memory cache;


            ( cache.borrowAssetUnderlying,  cache.borrowToken, cache.flashloanAmount, cache.signature) =
                abi.decode(inputParams.data, (address, address, uint256, bytes));

            cache.assets = new address[](1);
            cache.amounts = new uint256[](1);
            cache.modes = new uint256[](1);

            /// flashloan and leverage
            /// supply in flashloan cmd
            /// borrow quote/base
            /// modes are all 0 -> no borrowing
            cache.assets[0] = inputParams.flags & 0x4 == 0 ? cache.borrowAssetUnderlying : inputParams.asset;
            if (cache.assets[0].isETH()) cache.assets[0] = WETH9;
            flashloanAmount=cache.flashloanAmount;  
            cache.amounts[0] = cache.flashloanAmount;

            IPool(vault).flashLoan(
                address(this),
                cache.assets,
                cache.amounts,
                cache.modes,
                address(this),
                abi.encode(
                    LeverageParams({
                        onBehalfOf: msg.sender,
                        supplyAssetUnderlying: inputParams.asset,
                        supplyToken: inputParams.counterAsset,
                        borrowAssetUnderlying: cache.borrowAssetUnderlying,
                        borrowToken: cache.borrowToken,
                        flashloanAsset: cache.assets[0],
                        flashloanAmount: cache.flashloanAmount,
                        amount: inputParams.amount,
                        flags: inputParams.flags,
                        signature: cache.signature
                    })
                ),
                0
            );

            /// Sweep the dust
            _sweep(inputParams.asset);
            _sweep(cache.borrowAssetUnderlying);

        }
        returnAmount = inputParams.counterAsset.balanceOf(msg.sender) - returnAmount;
        emit Supply(msg.sender, inputParams.asset,  inputParams.amount+flashloanAmount);

    
    }
    /// @inheritdoc ILeverager

    function withdraw(
        InputParams memory inputParams
    )
        external
        override
        returns (uint256 returnAmount)
    {
        bool isETH = inputParams.asset.isETH();
        if (inputParams.flags & 0x1 == 0) {
            returnAmount = _compV2Withdraw(isETH, inputParams.asset, inputParams.counterAsset, inputParams.amount, msg.sender);
        } else {
            returnAmount = _aaveWithdraw(isETH, inputParams.asset, inputParams.counterAsset, inputParams.amount, msg.sender);
        }
        emit Withdraw(msg.sender, inputParams.asset, inputParams.amount);
    
    }

    /// @inheritdoc ILeverager

    function borrow(
        InputParams memory inputParams
    )
        external
        override

        nonReentrant
         returns(uint256 returnAmount)
    {
        bool isETH = inputParams.asset.isETH();
        if (inputParams.flags & 0x1 == 0) {
            inputParams.counterAsset.safeTransferFrom(msg.sender, address(this), inputParams.amount);
            _compV2Borrow(isETH, inputParams.asset, inputParams.counterAsset, inputParams.amount, msg.sender, inputParams.data);
        } else {
            _aaveBorrow(isETH, inputParams.asset, inputParams.counterAsset, inputParams.amount, msg.sender, inputParams.data);
        }
        /// Sweep the assets which are borrowed
        returnAmount=_sweep(inputParams.asset);

        emit Borrow(msg.sender, inputParams.asset, inputParams.amount);


    }
    /// @inheritdoc ILeverager
    function close(
        InputParams memory inputParams
    )
        external
        payable
        override
        nonReentrant 
        returns (uint256)

    {
        bool isETH = inputParams.asset.isETH();

        if (isETH && inputParams.amount != msg.value) {
            revert MsgValueAmountDiff(msg.value, inputParams.amount);

        } else {
            inputParams.asset.safeTransferFrom(msg.sender, address(this), inputParams.amount);
        }

        if (inputParams.data.length == 0) {
            if (inputParams.flags & 0x1 == 0) {
                _compV2Repay(isETH, inputParams.asset, inputParams.counterAsset, inputParams.amount, msg.sender);
            } else {
                _aaveRepay(isETH, inputParams.asset, inputParams.counterAsset, inputParams.amount, msg.sender);
            }
        } else {
            Cache memory cache;
            cache.amount=inputParams.amount;
            cache.onBehalfOf=msg.sender;
            cache.asset=inputParams.asset;
            cache.supplyToken=inputParams.counterAsset;
            cache.flags=inputParams.flags;
            cache.data=inputParams.data;
            _decreasePosition(cache);
        }

    }

    /**
     * @dev Execute callback operation for leveraging/deleveraing a position via flashloan
     * @param assets Array of assets to be flashloaned
     * @param amounts Array of amounts to be flashloaned
     * @param premiums Array of premiums to be flashloaned
     * @param initiator Address of the initiator of the flashloan
     * @param params Encoded data of router version and the flashloan swap descriptions
     * @return bool
     */

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    )
        external
        override returns(bool)
    {
    
        if(vault!=msg.sender){
            revert InvalidFlashloanCallbackSender();
        }
        if(initiator!=address(this)){
            revert InvalidInitiator(msg.sender);
        }
        

        if (params.length > 0) {
            LeverageParams memory levParams = abi.decode(params, (LeverageParams));

            // premium for flashloan is 0.05% of the amount
            // premium for using lever-ez is 0.05% of the amount

            if (levParams.flags & 0x1 == 0) {
                // deleverage
                _deleverage(levParams, amounts[0] +2*premiums[0]);
            } else {
                // leverage
                _leverage(levParams, amounts[0] +  2*premiums[0]);
            }

        }
        // Approve the LendingPool contract allowance to *pull* the owed amount
        for (uint256 i = 0; i < assets.length; i++) {
            assets[i].safeTransfer(owner(), premiums[i]); 
            uint256 amountOwing = amounts[i] + premiums[i];
            assets[i].safeApprove(msg.sender, 0);
            assets[i].safeApprove(msg.sender, amountOwing);
        }

        return true;
    }



    /// Internal Methods ///
    /// Aave V2 & V3 ///
    function _aaveSupply(bool isETH, address token, address supplyToken, uint256 amount, address onBehalfOf) internal {
        if (isETH) {
            token = WETH9;
            IWETH(token).deposit{ value: amount }();
        }

        address lendingPool = IAToken(supplyToken).POOL();
        token.safeApprove(lendingPool, amount);
        IPool(lendingPool).deposit(token, amount, onBehalfOf, 0);
    }

    function _aaveWithdraw(
        bool isETH,
        address token,
        address supplyToken,
        uint256 amount,
        address onBehalfOf
    )
        internal
        returns (uint256 returnAmount)
    {
        supplyToken.safeTransferFrom(onBehalfOf, address(this), amount);

        address lendingPool = IAToken(supplyToken).POOL();

        

        IPool(lendingPool).withdraw(token.isETH()? WETH9: token, amount, address(this));
        if (isETH) {
            IWETH(WETH9).withdraw(amount);
        }

        if (onBehalfOf != address(this)) {
            token.uniTransfer(payable(onBehalfOf), amount);
        }

        returnAmount = amount;
    }

    function _aaveBorrow(
        bool isETH,
        address token,
        address borrowToken,
        uint256 amount,
        address onBehalfOf,
        bytes memory delegateParams
    )
        internal
    {
        address lendingPool = IAToken(borrowToken).POOL();
        if (IDebtToken(borrowToken).borrowAllowance(onBehalfOf, address(this)) < amount) {
            /// should take value max uint256 deadline max uint256 for signature
            (uint8 v, bytes32 r, bytes32 s) = abi.decode(delegateParams, (uint8, bytes32, bytes32));
            IDebtToken(borrowToken).delegationWithSig(
                onBehalfOf, address(this), type(uint256).max, type(uint256).max, v, r, s
            );
        }

        IPool(lendingPool).borrow(token, amount, uint8(DataTypesV2.InterestRateMode.VARIABLE), 0 ,onBehalfOf);

    }

    function _aaveRepay(bool isETH, address token, address borrowToken, uint256 amount, address onBehalfOf) internal {
        address lendingPool = IAToken(borrowToken).POOL();

        uint256 borrowAmount = borrowToken.uniBalanceOf(onBehalfOf);
        uint256 actualAmount = amount > borrowAmount ? borrowAmount : amount;

        if (actualAmount > 0) {
            token.safeApprove(lendingPool, actualAmount);
            IPool(lendingPool).repay(token, actualAmount, uint8(DataTypesV2.InterestRateMode.VARIABLE), onBehalfOf);
        }
    }

    /// Compound V2 ///

    function _compV2Supply(
        bool isETH,
        address token,
        address supplyToken,
        uint256 amount,
        address onBehalfOf
    )
        internal
    {
        if (!isETH) {
            if (token != WETH9) {
                token.safeApprove(supplyToken, amount);
                CToken(supplyToken).mint(amount);
            } else {
                IWETH(WETH9).withdraw(amount);
                CNative(supplyToken).mint{ value: amount }();
            }
        } else {
            CNative(supplyToken).mint{ value: amount }();
        }
        if (onBehalfOf != address(this)) {
            supplyToken.uniTransfer(payable(onBehalfOf), supplyToken.uniBalanceOf(address(this)));
        }
    }

    function _compV2Withdraw(
        bool isETH,
        address token,
        address supplyToken,
        uint256 amount,
        address onBehalfOf
    )
        internal
        returns (uint256 returnAmount)
    {
        supplyToken.safeTransferFrom(onBehalfOf, address(this), amount);

        CToken(supplyToken).redeem(amount);
        returnAmount = token.uniBalanceOf(address(this));
        if (onBehalfOf != address(this)) {
            token.uniTransfer(payable(onBehalfOf), returnAmount);
        }
    }

    function _compV2Borrow(
        bool isETH,
        address token,
        address borrowToken,
        uint256 amount,
        address onBehalfOf,
        bytes memory delegateParams
    )
        internal
    {
        // uint256 userTotalBorrow = CToken(supplyToken).borrowBalanceCurrent(onBehalfOf);
        CToken(borrowToken).borrow(amount);
       
    }

    function _compV2Repay(
        bool isETH,
        address token,
        address borrowToken,
        uint256 amount,
        address onBehalfOf
    )
        internal
    {
        uint256 userTotalBorrow = CToken(borrowToken).borrowBalanceCurrent(onBehalfOf);
        /// actual amount should be less than total borrow of user
        uint256 actualAmount = amount > userTotalBorrow ? userTotalBorrow : amount;

        if (actualAmount > 0) {
            if (!isETH) {
                if (token != WETH9) {
                    token.safeApprove(borrowToken, actualAmount);
                    CToken(borrowToken).repayBorrowBehalf(onBehalfOf, actualAmount);
                } else {
                    IWETH(WETH9).withdraw(amount);
                    CNative(borrowToken).repayBorrowBehalf{ value: actualAmount }(onBehalfOf);
                }
            } else {
                CNative(borrowToken).repayBorrowBehalf{ value: actualAmount }(onBehalfOf);
            }
        }
    }


    /// decrease position function
    function _decreasePosition(Cache memory cache ) internal {
        (cache.borrowAssetUnderlying, cache.borrowToken, cache.flashloanAmount, cache.data) =
            abi.decode(cache.data, (address, address, uint256, bytes));

        cache.assets = new address[](1);
        cache.amounts = new uint256[](1);
        uint256[] memory modes = new uint256[](1);
        /// flashloan and leverage
        /// supply in flashloan cmd
        /// borrow quote/base
        /// modes are all 0 -> no borrowing
        cache.assets[0] = cache.flags & 0x4 == 0 ? cache.borrowAssetUnderlying : cache.asset;
        if (cache.assets[0].isETH()) cache.assets[0] = WETH9;
        cache.amounts[0] = cache.flashloanAmount;

        IPool(vault).flashLoan(
            address(this),
            cache.assets,
            cache.amounts,
            modes,
            address(this),
            abi.encode(
                LeverageParams({
                    onBehalfOf: cache.onBehalfOf,
                    supplyAssetUnderlying: cache.asset,
                    supplyToken: cache.supplyToken,
                    borrowAssetUnderlying: cache.borrowAssetUnderlying,
                    borrowToken: cache.borrowToken,
                    amount: cache.amount,
                    flashloanAmount: cache.flashloanAmount,
                    flashloanAsset: cache.asset,
                    flags: cache.flags,
                    signature: bytes("")
                })
            ),
            0
        );

        if (cache.data.length!=0){
            (uint64[] memory destChainSelectors, bytes[] memory msgsData) =abi.decode(cache.data, (uint64[], bytes[]));
            if (msgsData.length != destChainSelectors.length) revert LengthMismatch();
            Client.EVM2AnyMessage[] memory messages =new Client.EVM2AnyMessage[](destChainSelectors.length);
            for (uint256 i; i<destChainSelectors.length; i++){
                Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
                    receiver: abi.encode(dstToPropagator[destChainSelectors[i]]),
                    data: abi.encode(msg.sender, cache.asset, cache.supplyToken, cache.flags, msgsData),
                    tokenAmounts: new Client.EVMTokenAmount[](0),
                    extraArgs: "",
                    feeToken: address(0)
                });
                messages[i]=message;
            }
            propagator.propagate(messages, destChainSelectors);

        }
    }

    /// leverage function
    function _leverage(LeverageParams memory levParams, uint256 totalBorrow) internal {
        bool isSupplyETH = levParams.supplyAssetUnderlying.isETH();
        bool isBorrowETH = levParams.borrowAssetUnderlying.isETH();

        if (levParams.flags & 0x1 == 0) {
            /// comp like
            /// compound transfer native token from cETH token

            if (levParams.flags & 0x04 == 0 ? isBorrowETH : isSupplyETH) {
                IWETH(WETH9).withdraw(levParams.flashloanAmount);
            }
            /// When (levParams.flags & 0x04 == 1), Flashloan asset is quote token (same with the supplying token)

            _compV2Supply(
                isSupplyETH,
                levParams.supplyAssetUnderlying,
                levParams.supplyToken,
                levParams.amount + levParams.flashloanAmount,
                levParams.onBehalfOf
            );

            _compV2Borrow(
                isBorrowETH,
                levParams.borrowAssetUnderlying,
                levParams.borrowToken,
                totalBorrow,
                levParams.onBehalfOf,
                levParams.signature
            );

            /// flashloan lending pool push/pull back using WETH9 token
            if (levParams.flags & 0x04 == 0 ? isBorrowETH : isSupplyETH) {
                IWETH(WETH9).deposit{value:totalBorrow}();
            }

            if (levParams.flashloanAsset != levParams.borrowAssetUnderlying) { }
        } else {
            /// aave like
            _aaveSupply(
                isSupplyETH,
                levParams.supplyAssetUnderlying,
                levParams.supplyToken,
                levParams.amount + levParams.flashloanAmount,
                levParams.onBehalfOf
            );
            _aaveBorrow(
                isBorrowETH,
                levParams.borrowAssetUnderlying,
                levParams.borrowToken,
                totalBorrow,
                levParams.onBehalfOf,
                levParams.signature
            );
            if (levParams.flashloanAsset != levParams.borrowAssetUnderlying) { }
        }
    }

    /// deleverage function with target ltv calculated value
    function _deleverage(LeverageParams memory levParams, uint256 totalWithdraw) internal {
        bool isSupplyETH = levParams.supplyAssetUnderlying.isETH();
        bool isBorrowETH = levParams.borrowAssetUnderlying.isETH();

        if (levParams.flags & 0x1 == 0) {
            /// comp like
            /// compound transfer native token from cETH token
            if (isBorrowETH) IWETH(WETH9).withdraw(levParams.flashloanAmount);

            _compV2Repay(
                isBorrowETH,
                levParams.borrowAssetUnderlying,
                levParams.borrowToken,
                levParams.amount + levParams.flashloanAmount,
                levParams.onBehalfOf
            );

            _compV2Withdraw(
                isSupplyETH,
                levParams.supplyAssetUnderlying,
                levParams.supplyToken,
                totalWithdraw,
                levParams.onBehalfOf
            );

            /// flashloan lending pool push/pull back using WETH9 token
            if (isSupplyETH) {
                IWETH(WETH9).deposit{value:totalWithdraw}();
            }

            if (levParams.flashloanAsset != levParams.borrowAssetUnderlying) { }
        } else {
            /// aave like
            _aaveRepay(
                isBorrowETH,
                levParams.borrowAssetUnderlying,
                levParams.borrowToken,
                levParams.amount + levParams.flashloanAmount,
                levParams.onBehalfOf
            );

            _aaveWithdraw(
                isSupplyETH,
                levParams.supplyAssetUnderlying,
                levParams.supplyToken,
                totalWithdraw,
                levParams.onBehalfOf
            );
            if (levParams.flashloanAsset != levParams.borrowAssetUnderlying) { }
        }
    }

    /// add destination chain propagators to check the validity of the calls
    function _addDstChainPropagator(uint64 destChainSelector, address _propagator) internal {
        dstToPropagator[destChainSelector]=_propagator;
    }


    function _sweep(address token) internal returns(uint256 amount) {
        if (token.isETH()) {
            token = WETH9;
            amount = IWETH(WETH9).balanceOf(address(this));
            if (amount > 0) {
                IWETH(WETH9).withdraw(amount);
                payable(msg.sender).call{ value: amount }("");
            }
        } else {
            amount = token.balanceOf(address(this));
            if (amount > 0) {
                token.safeTransfer(msg.sender, amount);
            }
        }
    }

    // CCIP Receive from other chains close the position based on the data
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        address sender= abi.decode(message.sender, (address));
        if(dstToPropagator[message.sourceChainSelector]!=sender){
            revert SenderNotAllowlisted(sender);
        }

        (address onBehalfOf, address asset, address supplyToken, uint8 flags, bytes memory data) =
            abi.decode(message.data, (address, address, address, uint8, bytes));

        Cache memory cache;
        cache.onBehalfOf=onBehalfOf;
        cache.asset=asset;
        cache.supplyToken=supplyToken;
        cache.flags=flags;
        cache.data=data;

        _decreasePosition(cache);
    }
}
