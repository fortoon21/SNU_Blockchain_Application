

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeTransferLib} from "contracts/libraries/SafeTransferLib.sol";
contract Propagator is Ownable {
    using SafeTransferLib for address;

    enum PayFeesIn {
        Native,
        LINK
    }
    // Event emitted when a message is sent to another chain.
    event ClosePositionMsgSent(bytes32 indexed messageId, uint64 indexed destinationChainSelector, address indexed sender, address lendingProtocol, uint256 fees);
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error OnlyLeverager(); 

    address public immutable leverager;
    address public immutable i_router;
    address public  immutable i_link;

    constructor(address router, address link, address owner) Ownable(owner) {
        leverager=msg.sender;
        i_router = router;
        i_link = link;
        LinkTokenInterface(i_link).approve(i_router, type(uint256).max);
    }
    receive() external payable {}

    function isChainSupported(uint64 destChainSelector) external view returns (bool supported) {
        return IRouterClient(i_router).isChainSupported(destChainSelector);
    }



    function propagate(Client.EVM2AnyMessage[] memory messages, uint64[] memory destinationChainSelectors) external returns(bytes32 [] memory messageIds)
    {
        // only leverager can call propagate functions
        // all leverager addresses are the same in multiple chains
        if(msg.sender!=leverager) revert OnlyLeverager();

        messageIds = new bytes32[](messages.length);
        for (uint256 i; i< messages.length; i++) {
            messageIds[i]=_propagate(messages[i], destinationChainSelectors[i]);
        }
    }


    function withdraw(address to, uint256 amount) public onlyOwner {
        uint256 balance = address(this).balance;
        if (amount > balance) {
            amount = balance;
        }
        
        (bool sent, ) = to.call{value: amount}("");
        if (!sent) revert FailedToWithdrawEth(msg.sender, to, amount);
    }

    function withdrawToken(
        address to,
        address token,
        uint256 amount
    ) public onlyOwner {
        uint256 balance= token.balanceOf(address(this));
        if (amount > balance) {
            amount = balance;
        }
        token.safeTransfer(to, amount);
    }


    /// Propagate message from leverager /// 
    /// @param message message from leverager which contains data for closing all positions of each lending protocol
    /// @param destinationChainSelector destination Chain Id
    function _propagate(Client.EVM2AnyMessage memory message, uint64 destinationChainSelector) internal returns(bytes32) {
        uint256 fees = IRouterClient(i_router).getFee(
            destinationChainSelector,
            message
        );

        bytes32 messageId;

        if (message.feeToken==address(0)) {
            // LinkTokenInterface(i_link).approve(i_router, fees);
            messageId = IRouterClient(i_router).ccipSend{value: fees}(destinationChainSelector,message);
        } else {
            messageId = IRouterClient(i_router).ccipSend(destinationChainSelector,message);
        }
         // Emit an event with message details

         (address onBehalfOf, ,,,  ) = abi.decode(message.data, (address, address, address, uint8, bytes));
        emit ClosePositionMsgSent(messageId, destinationChainSelector, onBehalfOf,  address(this), fees);
        return messageId;
    }



}