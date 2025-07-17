// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface ILoanLiquidator {
    function liquidateLoan(address _loan) external returns (address, address, address);
} 