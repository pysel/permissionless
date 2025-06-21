"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import WalletConnect from "../../components/WalletConnect";
import { ConnectWalletPrompt } from "../../components/ConnectWalletPrompt";
import { useAccount } from "wagmi";
import { useLenders } from "@/lib/hooks/useLenders";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getTokenInfo } from "@/lib/tokenLogos";
import { useLenderTokenBalances } from "@/lib/hooks/useLoanManager";
import QuoteModal from "../../components/QuoteModal";
import { formatUsdAmount } from "@/lib/utils/format";

export default function LenderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { lenders, isLoading } = useLenders(CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY);
  
  // Loan request form state - modified for multiple tokens
  const [selectedTokens, setSelectedTokens] = useState<{[key: string]: string}>({});
  const [collateralAmount, setCollateralAmount] = useState("");
  const [loanDuration, setLoanDuration] = useState("30");
  const [interestRate, setInterestRate] = useState("");
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const lenderAddress = params.address as string;
  const lender = lenders.find(l => l.address.toLowerCase() === lenderAddress.toLowerCase());

  // Get individual token balances
  const { tokenBalances, isLoading: balancesLoading } = useLenderTokenBalances(
    lender?.address || "", 
    lender?.allowedTokens || []
  );

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleTokenAmountChange = (tokenAddress: string, amount: string) => {
    setSelectedTokens(prev => ({
      ...prev,
      [tokenAddress]: amount
    }));
  };

  const removeToken = (tokenAddress: string) => {
    setSelectedTokens(prev => {
      const newTokens = { ...prev };
      delete newTokens[tokenAddress];
      return newTokens;
    });
  };

  const handleRequestLoan = () => {
    const activeTokens = Object.entries(selectedTokens).filter(([_, amount]) => amount && parseFloat(amount) > 0);
    const totalBorrowAmount = activeTokens.reduce((sum, [_, amount]) => sum + parseFloat(amount), 0);
    const maxBorrowAmount = parseFloat(collateralAmount) * 10;
    
    if (activeTokens.length === 0 || !collateralAmount) {
      alert("Please specify collateral amount and at least one token amount");
      return;
    }
    
    if (totalBorrowAmount > maxBorrowAmount) {
      alert(`Total borrow amount ($${totalBorrowAmount}) exceeds maximum allowed ($${maxBorrowAmount})`);
      return;
    }
    
    // Show quote modal instead of alert
    setShowQuoteModal(true);
  };

  const handleConfirmLoan = () => {
    // TODO: Implement actual loan request logic
    console.log("Loan Request:", {
      lender: lenderAddress,
      tokens: Object.entries(selectedTokens).filter(([_, amount]) => amount && parseFloat(amount) > 0),
      collateral: collateralAmount,
      duration: loanDuration,
      interestRate,
    });
    
    setShowQuoteModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Loading lender details...</span>
      </div>
    );
  }

  if (!lender) {
    return (
      <div className="min-h-screen bg-white text-black">
        <header className="flex justify-between items-center p-6 border-b border-gray-200">
          <Link href="/borrow" className="text-blue-500 hover:text-blue-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <WalletConnect />
        </header>
        
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold mb-4">Lender Not Found</h1>
          <p className="text-gray-600 mb-6">The lender address you're looking for doesn't exist or is no longer active.</p>
          <Link
            href="/borrow"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Lenders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/borrow" className="text-blue-500 hover:text-blue-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black">Request Loan</h1>
            <p className="text-gray-600 text-sm">from {formatAddress(lender.address)}</p>
          </div>
        </div>
        <WalletConnect />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!isConnected ? (
          <ConnectWalletPrompt />
        ) : (   
          <div className="max-w-2xl mx-auto">
            {/* Loan Request Panel */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 text-black">Loan Request</h2>

              {!lender.isActive ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold mb-2 text-black">Lender Inactive</h3>
                  <p className="text-gray-600">This lender is currently not accepting new loan requests.</p>
                </div>
              ) : (
                <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleRequestLoan(); }}>
                  {/* Collateral Amount - First */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-lg font-semibold text-black">
                        Collateral Amount (USD) *
                      </label>
                      <div className="relative group">
                        <div className="w-5 h-5 bg-gray-400 hover:bg-gray-600 rounded-full flex items-center justify-center cursor-help transition-colors">
                          <span className="text-white text-xs font-bold">i</span>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          This amount will be paid with Ethereum from your wallet
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                      <input
                        type="number"
                        step="1"
                        placeholder="0.00"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 text-black text-lg border-b-2 border-gray-300 focus:border-blue-500 outline-none bg-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                      />
                    </div>
                    {collateralAmount && parseFloat(collateralAmount) > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        Maximum you can borrow: <span className="font-semibold">${(parseFloat(collateralAmount) * 10).toFixed(2)}</span>
                      </p>
                    )}
                  </div>

                  {/* Token Selection and Amounts */}
                  {collateralAmount && parseFloat(collateralAmount) > 0 && (
                    <div>
                      <label className="block text-lg font-semibold text-black mb-4">
                        Select Tokens & Amounts (USD) *
                      </label>
                      
                      {/* Current total and remaining */}
                      {(() => {
                        const totalBorrowing = Object.values(selectedTokens)
                          .filter(amount => amount && parseFloat(amount) > 0)
                          .reduce((sum, amount) => sum + parseFloat(amount), 0);
                        const maxBorrow = parseFloat(collateralAmount) * 10;
                        const remaining = maxBorrow - totalBorrowing;
                        const isOverLimit = totalBorrowing > maxBorrow;
                        
                        return (
                          <div className="mb-4 p-3 bg-gray-50 border-l-4 border-blue-500">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total borrowing:</span>
                              <span className={`font-semibold ${isOverLimit ? 'text-red-600' : 'text-black'}`}>
                                ${totalBorrowing.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Remaining available:</span>
                              <span className={`font-semibold ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>
                                ${Math.max(0, remaining).toFixed(2)}
                              </span>
                            </div>
                            {isOverLimit && (
                              <div className="mt-2 text-sm text-red-600 font-medium">
                                ⚠️ Borrow amount exceeds maximum allowed
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="space-y-3">
                        {lender.allowedTokens.map((tokenAddress, index) => {
                          const tokenInfo = getTokenInfo(tokenAddress);
                          const tokenBalance = tokenBalances[tokenAddress];
                          const availableUsd = tokenBalance?.usdValue || 0;
                          const selectedAmount = parseFloat(selectedTokens[tokenAddress] || "0");
                          const isOverAvailable = selectedAmount > availableUsd && availableUsd > 0;
                          
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <img
                                  src={tokenInfo.logoUrl}
                                  alt={tokenInfo.symbol}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-black font-medium">{tokenInfo.symbol}</div>
                                    <div className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                                      {balancesLoading ? (
                                        <div className="flex items-center gap-1">
                                          <div className="w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                          <span>Loading...</span>
                                        </div>
                                      ) : (
                                        <span>Available: {formatUsdAmount(availableUsd)}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-gray-500 text-sm">{tokenInfo.name}</div>
                                  {isOverAvailable && (
                                    <div className="text-red-600 text-xs mt-1 font-medium">
                                        Lender doesn't have that much {tokenInfo.symbol} available now
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="1"
                                    placeholder="0.00"
                                    value={selectedTokens[tokenAddress] || ""}
                                    onChange={(e) => handleTokenAmountChange(tokenAddress, e.target.value)}
                                    className={`w-32 pl-6 pr-3 py-2 text-black border-b-2 outline-none bg-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${
                                      isOverAvailable 
                                        ? 'border-red-500 focus:border-red-600' 
                                        : 'border-gray-300 focus:border-blue-500'
                                    }`}
                                  />
                                </div>
                                {selectedTokens[tokenAddress] && parseFloat(selectedTokens[tokenAddress]) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeToken(tokenAddress)}
                                    className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Enter USD amounts for the tokens you want to borrow</p>
                    </div>
                  )}

                  {/* Loan Duration */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Loan Duration
                    </label>
                    <select
                      value={loanDuration}
                      onChange={(e) => setLoanDuration(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                      <option value="90">90 Days</option>
                      <option value="180">180 Days</option>
                      <option value="365">365 Days</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={(() => {
                      const totalBorrowing = Object.values(selectedTokens)
                        .filter(amount => amount && parseFloat(amount) > 0)
                        .reduce((sum, amount) => sum + parseFloat(amount), 0);
                      const maxBorrow = parseFloat(collateralAmount) * 10;
                      
                      // Check if any token amount exceeds available balance
                      const hasExceededAvailable = lender.allowedTokens.some(tokenAddress => {
                        const selectedAmount = parseFloat(selectedTokens[tokenAddress] || "0");
                        const availableUsd = tokenBalances[tokenAddress]?.usdValue || 0;
                        return selectedAmount > 0 && availableUsd > 0 && selectedAmount > availableUsd;
                      });
                      
                      return !collateralAmount || totalBorrowing === 0 || totalBorrowing > maxBorrow || hasExceededAvailable;
                    })()}
                    className="w-full active:scale-99 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Get a Quote
                  </button>

                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        collateralUsdAmount={parseFloat(collateralAmount) || 0}
        selectedTokens={selectedTokens}
        onConfirm={handleConfirmLoan}
        lenderAddress={lenderAddress}
      />
    </div>
  );
} 