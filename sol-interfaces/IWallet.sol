// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IAaveV3Depositor.sol";

interface IPermissionlessWallet {
    struct Transaction {
        uint256 value;
        bytes data;
        uint256 txNonce;
    }

    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint256 deadline;
        uint256 nonce;
    }

    /// @notice Emitted when a transaction is executed
    /// @param txHash Hash of the transaction
    /// @param to Destination address
    /// @param value Amount of ETH sent
    /// @param nonce Transaction nonce
    event TransactionExecuted(bytes32 indexed txHash, address indexed to, uint256 value, uint256 nonce);

    /// @notice Emitted when tokens are swapped
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input tokens
    /// @param amountOut Amount of output tokens received
    /// @param nonce Transaction nonce
    event TokenSwapped(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 nonce
    );

    /// @notice Get the owner address
    /// @return Address of the owner
    function owner() external view returns (address);

    /// @notice Get the loaner address
    /// @return Address of the loaner
    function loanerSigner() external view returns (address);

    /// @notice Get the loan manager address
    /// @return Address of the loan manager
    function loanManager() external view returns (address);

    /// @notice Get the loaner contract address
    /// @return Address of the loaner contract
    function loanerContract() external view returns (address);

    /// @notice Get the current nonce
    /// @return Current nonce value
    function nonce() external view returns (uint256);

    /// @notice Get the cumulative gas fees paid by the loaner
    /// @return Total gas fees paid by loaner in wei
    function loanerGasFees() external view returns (uint256);

    /// @notice Get the list of loaned tokens
    /// @param index Index in the array
    /// @return Token address at the specified index
    // function loanedTokens(uint256 index) external view returns (IERC20);

    /// @notice Execute a transaction with watcher signature
    /// @param _tx Transaction to execute
    /// @param _v ECDSA signature v
    /// @param _r ECDSA signature r
    /// @param _s ECDSA signature s
    // function executeTransaction(
    //     Transaction calldata _tx,
    //     uint8 _v,
    //     bytes32 _r,
    //     bytes32 _s
    // ) external;

    /// @notice Swap tokens using Uniswap V3 with loaner signature approval
    /// @param params Swap parameters including tokens, amounts, and deadline
    /// @param borrowerSig 65-byte signature from borrower (v,r,s packed) of the domain separator
    /// @return amountOut Amount of output tokens received
    function swap(
        SwapParams calldata params,
        bytes calldata borrowerSig
    ) external returns (uint256 amountOut);

    /// @notice Set the Aave V3 Depositor contract address
    /// @param _aaveV3Depositor Address of the AaveV3Depositor contract
    function setAaveV3Depositor(address _aaveV3Depositor) external;

    /// @notice Supply tokens to Aave V3 with borrower signature verification
    /// @param params Supply parameters including asset, amount, deadline, and nonce
    /// @param borrowerSig 65-byte signature from borrower (v,r,s packed)
    /// @return success True if supply was successful
    function supplyAaveV3(
        IAaveV3Depositor.AaveSupplyParams calldata params,
        bytes calldata borrowerSig
    ) external returns (bool success);

    /// @notice Withdraw tokens from Aave V3 with borrower signature verification
    /// @param params Withdrawal parameters including asset, amount, deadline, and nonce
    /// @param borrowerSig 65-byte signature from borrower (v,r,s packed)
    /// @return amountWithdrawn Amount of tokens withdrawn
    function withdrawAaveV3(
        IAaveV3Depositor.AaveWithdrawParams calldata params,
        bytes calldata borrowerSig
    ) external returns (uint256 amountWithdrawn);

    /// @notice Get the EIP-712 domain separator for this contract
    /// @return The domain separator hash
    function getDomainSeparator() external view returns (bytes32);

    /// @notice Get the hash of swap parameters for signing
    /// @param params Swap parameters to hash
    /// @return The hash that should be signed by the loaner
    function getSwapHash(SwapParams calldata params) external view returns (bytes32);

    /// @notice Liquidate all assets to specified address
    /// @param to Address to send assets to
    /// @param tokens Array of token addresses to liquidate
    function liquidate(address to, address[] memory tokens) external;

    /// @notice Close the wallet
    /// @param tokens Array of token addresses to send to loaner
    /// @param toLoanerFraction Fraction of wallet value to send to loaner (1e8 decimals scale)
    function close(address[] memory tokens, uint256 toLoanerFraction) external;

    /// @notice Receive ETH
    receive() external payable;
} 
