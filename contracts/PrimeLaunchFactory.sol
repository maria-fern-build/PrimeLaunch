// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {PrimeLaunchToken} from "./PrimeLaunchToken.sol";

/// @title PrimeLaunchFactory
/// @notice Deploys confidential ERC7984 tokens with a fixed default supply and tracks their metadata.
contract PrimeLaunchFactory {
    /// @notice Default supply minted for every new token (10,000,000,000 units).
    uint64 public constant DEFAULT_SUPPLY = 10_000_000_000;

    struct TokenInfo {
        address token;
        string name;
        string symbol;
        address creator;
        uint64 initialSupply;
        uint256 createdAt;
    }

    TokenInfo[] private _tokens;
    mapping(address creator => uint256[] tokenIndexes) private _tokensByCreator;

    event TokenCreated(address indexed creator, address indexed token, string name, string symbol, uint64 initialSupply);

    error InvalidTokenName();
    error InvalidTokenSymbol();

    /// @notice Deploy a new PrimeLaunchToken using the default supply.
    /// @param name_ Name for the confidential token.
    /// @param symbol_ Symbol for the confidential token.
    /// @return tokenAddress Address of the deployed token.
    function createToken(string calldata name_, string calldata symbol_) external returns (address tokenAddress) {
        if (bytes(name_).length == 0) {
            revert InvalidTokenName();
        }
        if (bytes(symbol_).length == 0) {
            revert InvalidTokenSymbol();
        }

        PrimeLaunchToken token = new PrimeLaunchToken(name_, symbol_, msg.sender, DEFAULT_SUPPLY);
        tokenAddress = address(token);

        TokenInfo memory info = TokenInfo({
            token: tokenAddress,
            name: name_,
            symbol: symbol_,
            creator: msg.sender,
            initialSupply: DEFAULT_SUPPLY,
            createdAt: block.timestamp
        });

        _tokens.push(info);
        _tokensByCreator[msg.sender].push(_tokens.length - 1);

        emit TokenCreated(msg.sender, tokenAddress, name_, symbol_, DEFAULT_SUPPLY);
    }

    /// @notice Total number of tokens deployed through this factory.
    function getTokenCount() external view returns (uint256) {
        return _tokens.length;
    }

    /// @notice Returns metadata for a token by index.
    function getToken(uint256 index) external view returns (TokenInfo memory) {
        require(index < _tokens.length, "Invalid token index");
        return _tokens[index];
    }

    /// @notice Returns metadata for all deployed tokens.
    function getAllTokens() external view returns (TokenInfo[] memory) {
        return _tokens;
    }

    /// @notice Returns metadata for tokens created by a specific address.
    function getTokensByCreator(address creator) external view returns (TokenInfo[] memory) {
        uint256[] storage indexes = _tokensByCreator[creator];
        TokenInfo[] memory creatorTokens = new TokenInfo[](indexes.length);

        for (uint256 i = 0; i < indexes.length; i++) {
            creatorTokens[i] = _tokens[indexes[i]];
        }

        return creatorTokens;
    }
}
