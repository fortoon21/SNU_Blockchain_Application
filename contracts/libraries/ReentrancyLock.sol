// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;


/// @title ReentrancyLock
/// @author Eisen (https://app.eisenfinance.com)
/// @notice Abstract contract to provide protection against reentrancy
abstract contract ReentrancyLock {
    /// Storage ///

    bytes32 private constant NAMESPACE = bytes32(0x579d790592639b2d681736f3c42db3029bc25bdee19fb1af9a117b3462375585);
    // bytes32(uint256(bytes32(keccak256("com.eisen.reentrancylock")))-1);

    /// Types ///

    struct ReentrancyStorage {
        uint256 isLocked;
    }

    /// Errors ///
    error ReentrancyLock();

    /// Modifiers ///

    modifier nonReentrant() {
        ReentrancyStorage storage s = reentrancyStorage();

        if (s.isLocked != 0) revert ReentrancyLock();
        s.isLocked = 1;
        _;
        s.isLocked = 0;
    }

    /// Private Methods ///

    /// @dev fetch local storage
    function reentrancyStorage() private pure returns (ReentrancyStorage storage data) {
        bytes32 position = NAMESPACE;
        // solhint-disable-next-line no-inline-assembly
        assembly ("memory-safe") {
            data.slot := position
        }
    }
}
