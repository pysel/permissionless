// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IAaveV3Depositor {
    struct AaveSupplyParams {
        address asset;
        uint256 amount;
        uint256 deadline;
        uint256 nonce;
    }

    struct AaveWithdrawParams {
        address asset;
        uint256 amount; // Use type(uint256).max for full withdrawal
        uint256 deadline;
        uint256 nonce;
    }

    /// @notice Emitted when tokens are supplied to Aave
    /// @param asset The asset supplied to Aave
    /// @param amount The amount supplied
    /// @param wallet The wallet that supplied the tokens
    /// @param nonce The transaction nonce
    event AaveSupplied(
        address indexed asset,
        uint256 amount,
        address indexed wallet,
        uint256 nonce
    );

    /// @notice Emitted when tokens are withdrawn from Aave
    /// @param asset The asset withdrawn from Aave
    /// @param amount The amount withdrawn
    /// @param wallet The wallet that withdrew the tokens
    /// @param nonce The transaction nonce
    event AaveWithdrawn(
        address indexed asset,
        uint256 amount,
        address indexed wallet,
        uint256 nonce
    );

    /// @notice Supply tokens to Aave V3 pool with borrower signature verification
    /// @param params The supply parameters
    /// @param borrowerSig The borrower's signature
    /// @return success True if supply was successful
    function supplyAaveV3(
        AaveSupplyParams calldata params,
        bytes calldata borrowerSig
    ) external returns (bool success);

    /// @notice Withdraw tokens from Aave V3 pool with borrower signature verification
    /// @param params The withdrawal parameters
    /// @param borrowerSig The borrower's signature
    /// @return amountWithdrawn The actual amount withdrawn
    function withdrawAaveV3(
        AaveWithdrawParams calldata params,
        bytes calldata borrowerSig
    ) external returns (uint256 amountWithdrawn);

    /// @notice Liquidate all Aave deposits and send to specified address
    /// @param wallet The wallet whose deposits to liquidate
    /// @param to The address to send liquidated funds to
    /// @param assets The assets to liquidate from Aave
    function liquidateAaveDeposits(
        address wallet,
        address to,
        address[] calldata assets
    ) external;

    /// @notice Get the total USD value of Aave deposits for a wallet
    /// @param wallet The wallet address to check
    /// @return totalValueUSD The total value in USD (8 decimals)
    function getWalletAaveValueUSD(address wallet) external view returns (uint256 totalValueUSD);

    /// @notice Get the value of a specific asset deposit for a wallet
    /// @param wallet The wallet address to check
    /// @param asset The asset to check
    /// @return valueUSD The value in USD (8 decimals)
    function getWalletAssetValueUSD(address wallet, address asset) external view returns (uint256 valueUSD);

    function getAaveWithdrawHash(AaveWithdrawParams calldata params) external view returns (bytes32);

    function getAaveSupplyHash(AaveSupplyParams calldata params) external view returns (bytes32);

    function networkConfigs(uint256 chainId) external view returns (address poolAddress, bool isActive);

    function closeAaveV3Deposits(
        address wallet,
        address[] calldata assets
    ) external;
} 