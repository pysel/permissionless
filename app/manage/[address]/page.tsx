"use client";

import { useParams, useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import WalletConnect from "../../components/WalletConnect";
import { ConnectWalletPrompt } from "../../components/ConnectWalletPrompt";
import { useBorrowerLoans, useLoanManager, useWalletTokenBalances } from "@/lib/hooks/useLoanManager";
import { useLoanerAllowedTokens } from "@/lib/hooks/useLoaners";
import { useAaveTokens } from "@/lib/hooks/useAave";
import { getTokenInfo } from "@/lib/tokenLogos";
import { formatUsdAmount, calculateLoanStatus } from "@/lib/utils/format";
import LOAN_MANAGER_ABI from "@/lib/abis/loanManager";
import SwapModal from "../../components/SwapModal";
import SupplyModal from "../../components/SupplyModal";


// Custom hook to fetch token USD values
function useTokenUsdValues(tokens: string[], amounts: bigint[], loanManagerAddress: string) {
  // Create contracts for getting USD values for each token amount
  const priceContracts = tokens.map((tokenAddress, index) => ({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getTokenValueUSD",
    args: [tokenAddress as `0x${string}`, amounts[index] || BigInt(0)],
  }));

  const { data: priceResults, isLoading: pricesLoading } = useReadContracts({
    contracts: priceContracts as any,
    query: {
      enabled: !!loanManagerAddress && tokens.length > 0 && amounts.length > 0,
    },
  });

  // Calculate USD values
  const tokenUsdValues: { [tokenAddress: string]: number } = {};
  
  if (priceResults && !pricesLoading) {
    tokens.forEach((tokenAddress, index) => {
      const usdValue = priceResults[index]?.result as bigint;
      if (usdValue) {
        // Convert from 8 decimal USD format to regular number
        tokenUsdValues[tokenAddress] = Number(usdValue) / 1e8;
      } else {
        tokenUsdValues[tokenAddress] = 0;
      }
    });
  }

  return {
    tokenUsdValues,
    isLoading: pricesLoading,
  };
}

// Collapsible Loan Information Component
function LoanInformationSection({ loan }: { loan: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">Loan Information</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </span>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Borrower</span>
                <span className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">{loan.borrower}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Lender</span>
                <span className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">{loan.loaner}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Wallet Address</span>
                <span className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">{loan.wallet}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${loan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {loan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { loans, isLoading, error } = useBorrowerLoans(address || "");
  const { loanManagerAddress } = useLoanManager();
  const queryClient = useQueryClient();
  const loanAddress = params.address as string;
  const loan = loans.find(l => l.loanAddress.toLowerCase() === loanAddress.toLowerCase());

  // State for close loan functionality
  const [isClosingLoan, setIsClosingLoan] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  
  // State for swap modal
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  // Get allowed tokens for the loaner
  const { allowedTokens, isLoading: allowedTokensLoading } = useLoanerAllowedTokens(loan?.loaner || "");

  // Get current wallet token balances for all allowed tokens (not just loan tokens)
  const { tokenBalances: currentTokenBalances, isLoading: balancesLoading } = useWalletTokenBalances(
    loan?.wallet || "",
    allowedTokens || []
  );

  // Filter allowed tokens to only show tokens with balances > 0
  const tokensWithBalances = allowedTokens.filter((tokenAddress: string) => {
    const balance = currentTokenBalances[tokenAddress] || BigInt(0);
    return balance > BigInt(0);
  });

  // Get USD values for tokens with current amounts from wallet (for all allowed tokens)
  const currentAmounts = allowedTokens.map((tokenAddress: string) => 
    currentTokenBalances[tokenAddress] || BigInt(0)
  ) || [];

  // Fetch real USD values for tokens using current amounts
  const { tokenUsdValues, isLoading: usdValuesLoading } = useTokenUsdValues(
    allowedTokens || [],
    currentAmounts,
    loanManagerAddress || ""
  );

  // Define a unified type for the tokens
  type TokenDisplayInfo = {
    address: string;
    aTokenAddress?: string;
    balance: bigint;
    isAave: boolean;
  };

  // Fetch Aave tokens
  const { aaveTokens, isLoading: aaveTokensLoading } = useAaveTokens(
    loan?.wallet || "",
    allowedTokens || []
  );

  // Combine regular tokens and Aave tokens
  const allTokens: TokenDisplayInfo[] = [
    ...tokensWithBalances.map(tokenAddress => ({
      address: tokenAddress,
      balance: currentTokenBalances[tokenAddress] || BigInt(0),
      isAave: false
    })),
    ...(aaveTokens || []).map((aaveToken: any) => ({
      address: aaveToken.underlyingAsset,
      aTokenAddress: aaveToken.aTokenAddress,
      balance: aaveToken.balance,
      isAave: true
    }))
  ];

  // Write contract hook for closing loan
  const { 
    writeContract: closeLoan, 
    data: closeLoanHash,
    isPending: isCloseLoanPending,
    error: closeLoanError 
  } = useWriteContract();

  // Wait for transaction receipt
  const { 
    isLoading: isCloseLoanConfirming, 
    isSuccess: isCloseLoanConfirmed,
    error: closeLoanReceiptError 
  } = useWaitForTransactionReceipt({
    hash: closeLoanHash,
  });

  const formatAddress = (address: string) => {
    return address;
  };

  // Function to refresh loan data after swap
  const handleActionSuccess = async () => {
    try {
      // Invalidate all relevant queries to refresh the data
      await Promise.all([
        // Invalidate all wagmi read contract queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            if (Array.isArray(queryKey) && queryKey.length > 0) {
              const firstKey = queryKey[0];
              return firstKey === 'readContract' || firstKey === 'readContracts';
            }
            return false;
          }
        }),
        // Invalidate queries specific to this loan and borrower
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            if (Array.isArray(queryKey)) {
              const keyString = JSON.stringify(queryKey);
              return (
                keyString.includes(loanAddress) ||
                keyString.includes(address || '') ||
                keyString.includes('getBorrowerLoans') ||
                keyString.includes('getTokenValueUSD') ||
                keyString.includes('getWalletValueUSD') ||
                keyString.includes('loanToData')
              );
            }
            return false;
          }
        })
      ]);
    } catch (error) {
      console.error('Error refreshing loan data after action:', error);
    }
  };

  const handleCloseLoan = async () => {
    if (!loanManagerAddress || !loan) {
      console.error("Missing loan manager address or loan data");
      return;
    }

    try {
      setIsClosingLoan(true);
      
      await closeLoan({
        address: loanManagerAddress as `0x${string}`,
        abi: LOAN_MANAGER_ABI,
        functionName: "closeLoan",
        args: [loan.loanAddress as `0x${string}`],
      });

    } catch (error) {
      console.error("Error closing loan:", error);
      setIsClosingLoan(false);
    }
  };

  // Handle transaction confirmation with useEffect
  useEffect(() => {
    if (isCloseLoanConfirmed && isClosingLoan) {
      setIsClosingLoan(false);
      setShowCloseConfirmation(false);
      // Redirect to manage page after successful close
      router.push("/manage");
    }
  }, [isCloseLoanConfirmed, isClosingLoan, router]);

  // Handle transaction error with useEffect
  useEffect(() => {
    if ((closeLoanError || closeLoanReceiptError) && isClosingLoan) {
      setIsClosingLoan(false);
      console.error("Transaction failed:", closeLoanError || closeLoanReceiptError);
    }
  }, [closeLoanError, closeLoanReceiptError, isClosingLoan]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white text-black">
        <header className="flex justify-between items-center p-6 border-b border-gray-200">
          <Link href="/manage" className="text-blue-500 hover:text-blue-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <WalletConnect />
        </header>
        <div className="flex justify-center items-center py-20">
          <ConnectWalletPrompt />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <header className="flex justify-between items-center p-6 border-b border-gray-200">
          <Link href="/manage" className="text-blue-500 hover:text-blue-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <WalletConnect />
        </header>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-white text-black">
        <header className="flex justify-between items-center p-6 border-b border-gray-200">
          <Link href="/manage" className="text-blue-500 hover:text-blue-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <WalletConnect />
        </header>
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-600">Loan not found.</p>
        </div>
      </div>
    );
  }

  const loanStatus = calculateLoanStatus(loan);
  const width = loanStatus.percentage > 100 ? 100 : loanStatus.percentage < 0 ? 0 : loanStatus.percentage;

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/manage" className="text-blue-500 hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-black">Loan Details</h1>
                <p className="text-gray-600 text-sm">{formatAddress(loan.loanAddress)}</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          
          {/* Main Layout - Borrowed Tokens and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Borrowed Tokens - Main Content (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Wallet Tokens</h2>
                  <button
                    onClick={() => setShowSwapModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Swap
                  </button>
                </div>
                <div className="space-y-6">
                  {allTokens.length === 0 && !balancesLoading && !allowedTokensLoading && !aaveTokensLoading ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Tokens Available</h3>
                      <p className="text-gray-500 text-sm">Your wallet currently has no balances for the allowed tokens.</p>
                    </div>
                  ) : (
                    allTokens.map((token: TokenDisplayInfo, index: number) => {
                      const tokenAddress = token.address;
                      const tokenInfo = getTokenInfo(tokenAddress);
                      const tokenAmount = (Number(token.balance) / 1e18);
                      const realUsdValue = tokenUsdValues[tokenAddress] || 0;
                      
                      return (
                        <div key={`${tokenAddress}-${token.isAave}`} className="group">
                          <div className={`flex items-center gap-6 p-6 border rounded-2xl transition-all duration-300 hover:shadow-md ${token.isAave ? 'bg-purple-50 border-purple-200 hover:border-purple-300' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                            {/* Token Icon */}
                            <div className="relative">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${token.isAave ? 'bg-purple-100 group-hover:border-purple-300' : 'bg-white shadow-lg border-2 border-gray-100 group-hover:border-blue-300'}`}>
                                <img 
                                  src={tokenInfo.logoUrl} 
                                  alt={tokenInfo.symbol}
                                  className="w-10 h-10 rounded-full"
                                />
                                {token.isAave && (
                                  <img
                                    src="/aave-logo.png"
                                    alt="Aave"
                                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white"
                                  />
                                )}
                              </div>
                            </div>
                            
                            {/* Token Information */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 mb-1">{token.isAave ? `a${tokenInfo.symbol}` : tokenInfo.symbol}</h3>
                                  <p className="text-sm text-gray-500 font-mono truncate">{token.isAave ? token.aTokenAddress : tokenAddress}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {balancesLoading || aaveTokensLoading ? (
                                      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                                    ) : (
                                      tokenAmount < 0.0001 ? tokenAmount.toExponential(3) : tokenAmount.toFixed(4)
                                    )}
                                  </div>
                                  <div className="text-lg font-semibold text-green-600">
                                  {usdValuesLoading || balancesLoading || aaveTokensLoading ? (
                                    <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                                  ) : (
                                    `$${(realUsdValue / (Number(currentTokenBalances[tokenAddress] || BigInt(1))) * Number(token.balance)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  )}
                                </div>
                                </div>
                              </div>
                               <div className="mt-4 flex justify-end">
                                  {token.isAave ? (
                                    <button
                                      // onClick={() => handleWithdraw(token)} // TODO: Implement withdraw
                                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                    >
                                      Withdraw
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedToken(tokenAddress);
                                        setShowSupplyModal(true);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 border-1 border-purple-500 text-purple-500 rounded-lg hover:opacity-90 transition-opacity font-medium"
                                    >
                                      <img src="/aave-logo.png" alt="Aave" className="w-4 h-4" />
                                      Earn
                                    </button>
                                  )}
                                </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Loan Overview (1/3 width) */}
            <div className="space-y-6">
              {/* Loan Overview - Enhanced with bigger numbers */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-6 text-gray-900">Loan Overview</h3>
                <div className="space-y-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-600 mb-2 font-medium">Principal Value</p>
                    <p className="text-3xl font-bold text-blue-900">{formatUsdAmount(Number(loan.initialLoanValue))}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-600 mb-2 font-medium">Present Value</p>
                    <p className="text-3xl font-bold text-blue-900">{formatUsdAmount(Number(loan.currentLoanValue))}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-600 mb-2 font-medium">Collateral Value</p>
                    <p className="text-3xl font-bold text-blue-900">{formatUsdAmount(Number(loan.collateralCurrentValue))}</p>
                  </div>
                  
                  {/* Health Bar with Percentage */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Health</span>
                      <span className="text-lg font-bold text-gray-900">{loanStatus.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          loanStatus.status === 'good' ? 'bg-green-500' :
                          loanStatus.status === 'medium' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    <button className="w-full border-green-600 bg-green-50 border-1 text-green-600 px-4 py-3 rounded-lg hover:bg-green-100 transition-colors font-medium">
                      Add Collateral
                    </button>
                    <button 
                      onClick={() => setShowCloseConfirmation(true)}
                      disabled={isClosingLoan || isCloseLoanPending || isCloseLoanConfirming}
                      className="w-full border-red-600 bg-red-50 border-1 text-red-600 px-4 py-3 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isClosingLoan || isCloseLoanPending || isCloseLoanConfirming ? "Closing..." : "Close Loan"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Loan Information */}
          <LoanInformationSection loan={loan} />
        </div>
      </main>

      {/* Swap Modal */}
      <SwapModal 
        isOpen={showSwapModal} 
        onClose={() => setShowSwapModal(false)} 
        tokens={allowedTokens}
        amounts={currentAmounts}
        walletAddress={loan.wallet}
        borrowerAddress={loan.borrower}
        onSwapSuccess={handleActionSuccess}
      />

      {showSupplyModal && selectedToken && (
        <SupplyModal
            isOpen={showSupplyModal}
            onClose={() => setShowSupplyModal(false)}
            tokenAddress={selectedToken}
            tokenBalance={currentTokenBalances[selectedToken] || BigInt(0)}
            walletAddress={loan.wallet}
            borrowerAddress={loan.borrower}
            onSupplySuccess={handleActionSuccess}
        />
      )}

      {/* Close Loan Confirmation Modal */}
      {showCloseConfirmation && (
        <>
          {/* Backdrop with blur effect */}
          <div 
            className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40"
            onClick={() => setShowCloseConfirmation(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md pointer-events-auto animate-in slide-in-from-bottom-80 fade-in duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Confirm Loan Closure
                </h3>
                <button
                  onClick={() => setShowCloseConfirmation(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Close this loan?</h4>
                    <p className="text-gray-600 text-sm">
                      This action cannot be undone. The loan will be permanently closed.
                    </p>
                  </div>
                </div>

                {/* Loan Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Loan Address</span>
                      <span className="font-mono text-xs text-gray-900">{loan?.loanAddress.slice(0, 10)}...{loan?.loanAddress.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Value</span>
                      <span className="font-semibold text-gray-900">{formatUsdAmount(Number(loan?.currentLoanValue))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Collateral Value</span>
                      <span className="font-semibold text-gray-900">{formatUsdAmount(Number(loan?.collateralCurrentValue))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with buttons */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowCloseConfirmation(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCloseConfirmation(false);
                    handleCloseLoan();
                  }}
                  disabled={isClosingLoan || isCloseLoanPending || isCloseLoanConfirming}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isClosingLoan || isCloseLoanPending || isCloseLoanConfirming ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    "Close Loan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction Status Messages */}
      {closeLoanError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <p className="font-semibold">Transaction Failed</p>
          <p className="text-sm">{closeLoanError.message}</p>
        </div>
      )}

      {closeLoanReceiptError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <p className="font-semibold">Transaction Failed</p>
          <p className="text-sm">Failed to confirm transaction</p>
        </div>
      )}

      {isCloseLoanConfirming && (
        <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg shadow-lg">
          <p className="font-semibold">Transaction Confirming</p>
          <p className="text-sm">Please wait for confirmation...</p>
        </div>
      )}
    </div>
  );
} 