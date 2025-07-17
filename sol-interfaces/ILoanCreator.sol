// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../LoanTypes.sol";

interface ILoanCreator {
    function createLoan(
        address borrower,
        LoanTypes.LoanRequest calldata request
    ) external payable returns (address, address);
} 