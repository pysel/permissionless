// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface ILoanCloser {
    function closeLoan(address _loan, address _sender) external payable returns (address, address, address);
} 