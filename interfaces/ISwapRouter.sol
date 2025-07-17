// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

/// @title Router token swapping functionality
/// @notice Functions for swapping tokens via Uniswap V3
interface ISwapRouter {
    // Version 1: With deadline in params (e.g., SwapRouter02)
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    // Version 2: Without deadline in params (e.g., older SwapRouter)
    struct ExactInputSingleParamsNoDeadline {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another token (with deadline in params)
    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
    /// @return amountOut The amount of the received token
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);

    /// @notice Swaps `amountIn` of one token for as much as possible of another token (deadline passed separately)
    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParamsNoDeadline` in calldata
    /// @return amountOut The amount of the received token
    function exactInputSingle(ExactInputSingleParamsNoDeadline calldata params) external payable returns (uint256 amountOut);
} 