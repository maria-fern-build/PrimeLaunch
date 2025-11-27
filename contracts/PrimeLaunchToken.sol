// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC7984} from "confidential-contracts-v91/contracts/token/ERC7984/ERC7984.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";

/// @title PrimeLaunchToken
/// @notice Confidential ERC7984 token that can be deployed by the PrimeLaunchFactory.
contract PrimeLaunchToken is ERC7984, ZamaEthereumConfig {
    /// @notice Address of the PrimeLaunchFactory that deployed this token.
    address public immutable factory;

    /// @notice Creator that requested this token deployment.
    address public immutable creator;

    /// @notice Initial supply that was minted during deployment.
    uint64 public immutable initialSupply;

    error InvalidCreator();
    error InvalidMintAmount();

    constructor(string memory name_, string memory symbol_, address creator_, uint64 initialSupply_)
        ERC7984(name_, symbol_, "")
    {
        if (creator_ == address(0)) {
            revert InvalidCreator();
        }

        factory = msg.sender;
        creator = creator_;
        initialSupply = initialSupply_;

        if (initialSupply_ > 0) {
            euint64 encryptedAmount = FHE.asEuint64(initialSupply_);
            _mint(creator_, encryptedAmount);
        }
    }

    /// @notice Allows anyone to mint additional tokens to their own address at no cost.
    /// @param clearAmount Amount of tokens to mint expressed as cleartext.
    /// @return mintedAmount The encrypted amount that was minted.
    function freemint(uint64 clearAmount) external returns (euint64 mintedAmount) {
        if (clearAmount == 0) {
            revert InvalidMintAmount();
        }

        euint64 encryptedAmount = FHE.asEuint64(clearAmount);
        mintedAmount = _mint(msg.sender, encryptedAmount);
    }
}
