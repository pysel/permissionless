// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IPermissionlessRegistry {
    // Events
    event LoanerRegistered(address indexed loanerEOA, address indexed loanerContract);

    // Public state variable getters
    function addressToLoaner(address) external view returns (address);
    function loanManager() external view returns (address);
    function loanManagerStorage() external view returns (address);
    function loanLiquidator() external view returns (address);
    function loanCreator() external view returns (address);
    function swapRouter() external view returns (address);
    function weth() external view returns (address);
    function aaveV3Depositor() external view returns (address);
    
    // Public functions
    function registerAsLoaner() external returns (address loaner);
    function setPriceFeed(address token, address priceFeed) external;
    
    // Query functions for loaner enumeration
    function getTotalRegisteredLoaners() external view returns (uint256);
    function getRegisteredLoanerAt(uint256 index) external view returns (address);
    function getAllRegisteredLoaners() external view returns (address[] memory);
    function isLoanerRegistered(address loanerContract) external view returns (bool);
} 