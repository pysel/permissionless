// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Loaner.sol";
import "../LoanTypes.sol";
import {ILoanCloser} from "./ILoanCloser.sol";
import {ILoanLiquidator} from "./ILoanLiquidator.sol";
import {ILoanCreator} from "./ILoanCreator.sol";

interface ILoanManager {
    /// @notice Emitted when a new loan is created
    /// @param loaner Address of the loaner
    /// @param borrower Address of the borrower
    /// @param loan Address of the created loan
    event LoanCreated(address indexed loaner, address indexed borrower, address loan);

    /// @notice Emitted when a loan is closed
    /// @param loan Address of the closed loan
    /// @param borrower Address of the borrower who closed the loan
    /// @param loaner Address of the loaner who closed the loan
    event LoanClosed(address indexed loaner, address indexed borrower, address loan);

    /// @notice Emitted when a loan is liquidated
    /// @param loaner Address of the loaner
    /// @param borrower Address of the borrower
    /// @param loan Address of the liquidated loan
    event LoanLiquidated(address indexed loaner, address indexed borrower, address loan);

    /// @notice Emitted when a price feed is updated
    /// @param token Address of the token
    /// @param priceFeed Address of the new price feed
    event PriceFeedUpdated(address indexed token, address indexed priceFeed);

    /// @notice Creates a new loan
    /// @param request Loan request parameters
    /// @return loan Address of the created loan contract
    /// @return wallet Address of the created wallet contract
    function createLoan(LoanTypes.LoanRequest calldata request) external payable returns (address, address);

    /// @notice Liquidates a loan if collateral ratio is below threshold
    /// @param loan Address of the loan to liquidate
    function liquidateLoan(address loan) external;

    /// @notice Closes a loan by repaying the full amount
    /// @param loan Address of the loan to close
    function closeLoan(address loan) external payable;

    /// @notice Gets the loan data for a loan
    /// @param loan Address of the loan
    /// @return Loan data
    function loanToData(address loan) external view returns (LoanTypes.LoanData memory);

    /// @notice Gets the loan address for a loaner and borrower
    /// @param loaner Address of the loaner
    /// @param borrower Address of the borrower
    /// @return Loan address
    function loanerBorrowerLoans(address loaner, address borrower) external view returns (address);

    /// @notice Gets the USD value of a specific amount of tokens
    /// @param token The ERC20 token address
    /// @param amount The amount of tokens (in token's native decimals)
    /// @return usdValue The value in USD (8 decimals)
    function getTokenValueUSD(address token, uint256 amount) external view returns (uint256 usdValue);

    function getPortfolioValueUSD(
        address[] calldata tokens, 
        uint256[] calldata amounts
    ) external view returns (uint256 totalUsdValue);

    function getWalletValueUSD(address wallet, address[] calldata tokens) external view returns (uint256);

    function getBorrowerLoans(address borrower) external view returns (address[] memory);

    function loanCollateralValueNow(address loan) external view returns (uint256);

    function isLoanUnderwater(address _loan, address[] calldata _tokens, uint256[] calldata _amounts, uint256 _extraGas) external view returns (bool);

    function loanCloser() external view returns (ILoanCloser);
    function loanLiquidator() external view returns (ILoanLiquidator);
    function loanCreator() external view returns (ILoanCreator);

    /// @notice Gets all active loans for a borrower
    /// @param borrower Address of the borrower
    /// @return Array of active loan addresses
    // function getActiveLoansByBorrower(address borrower) external view returns (address[] memory);

    /// @notice Gets all active loans for a loaner
    /// @param loaner Address of the loaner
    /// @return Array of active loan addresses
    // function getActiveLoansByLoaner(address loaner) external view returns (address[] memory);

    /// @notice Checks if a loan is active
    /// @param loan Address of the loan to check
    /// @return True if loan is active, false otherwise
    // function isLoanActive(address loan) external view returns (bool);

    /// @notice Gets the current health factor of a loan
    /// @param loan Address of the loan to check
    /// @return Health factor as a percentage (100 = 100%)
    // function getLoanHealth(address loan) external view returns (uint256);

    /// @notice Gets the liquidation threshold
    /// @return Threshold as a percentage (100 = 100%)
    // function liquidationThreshold() external view returns (uint256);
}
