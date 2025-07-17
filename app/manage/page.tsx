"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import Link from "next/link";
import WalletConnect from "../components/WalletConnect";
import { ConnectWalletPrompt } from "../components/ConnectWalletPrompt";
import { useBorrowerLoans } from "@/lib/hooks/useLoanManager";
import { formatUsdAmount, calculateLoanStatus } from "@/lib/utils/format";

export default function ManagePage() {
  const { address, isConnected } = useAccount();
  const { loans, isLoading, error } = useBorrowerLoans(address || "");
  const [showInactiveLoans, setShowInactiveLoans] = useState(false);

  // Filter loans based on the toggle state
  const activeLoans = loans.filter(loan => loan.isActive);
  const inactiveLoans = loans.filter(loan => !loan.isActive);
  const displayedLoans = showInactiveLoans ? [...activeLoans, ...inactiveLoans] : activeLoans;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-500 hover:text-blue-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-black">Manage Loans</h1>
        </div>
        <WalletConnect />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!isConnected ? (
          <div className="flex justify-center">
            <ConnectWalletPrompt />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-gray-600">Loading your loans...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold mb-2 text-black">Error Loading Loans</h2>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold mb-4">No Loans Found</h2>
                <p className="text-gray-600 mb-6">You don't have any loans yet.</p>
                <Link
                  href="/borrow"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Request a Loan
                </Link>
              </div>
            ) : activeLoans.length === 0 && !showInactiveLoans ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold mb-4">No Active Loans</h2>
                <p className="text-gray-600 mb-6">You don't have any active loans at the moment.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/borrow"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Request a Loan
                  </Link>
                  {inactiveLoans.length > 0 && (
                    <button
                      onClick={() => setShowInactiveLoans(true)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      View Past Loans ({inactiveLoans.length})
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {/* Header with loan stats and toggle */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-black mb-2">
                        {showInactiveLoans ? 'All Loans' : 'Active Loans'}
                      </h2>
                      <p className="text-gray-600">
                        {showInactiveLoans 
                          ? `Showing all ${loans.length} loans (${activeLoans.length} active, ${inactiveLoans.length} inactive)`
                          : `Manage and monitor your ${activeLoans.length} active loan${activeLoans.length !== 1 ? 's' : ''}`
                        }
                      </p>
                    </div>
                    
                    {/* Toggle button for inactive loans */}
                    {inactiveLoans.length > 0 && (
                      <button
                        onClick={() => setShowInactiveLoans(!showInactiveLoans)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                      >
                        {showInactiveLoans ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                            Hide Past Loans
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Show Past Loans ({inactiveLoans.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Health indicator legend */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Good Health</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Moderate Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>High Risk</span>
                    </div>
                  </div>
                </div>

                {/* Loans list */}
                <div className="space-y-6">
                  {displayedLoans.map((loan, index) => (
                    <LoanCard key={loan.loanAddress} loan={loan} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Component for displaying individual loan cards
function LoanCard({ loan }: { loan: any }) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const loanStatus = calculateLoanStatus(loan);
  const width = loanStatus.percentage > 100 ? 100 : loanStatus.percentage < 0 ? 0 : loanStatus.percentage;
  const collateralValueNow = Number(loan.collateralCurrentValue);

  // Different styling for inactive loans
  const isActive = loan.isActive;
  const cardClasses = isActive 
    ? "bg-white rounded-lg shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-[1.005] hover:border-blue-300 cursor-pointer"
    : "bg-gray-50 rounded-lg shadow-sm p-6 border border-gray-300 transition-all duration-300 hover:shadow-md cursor-pointer opacity-75";

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
            Loan {formatAddress(loan.loanAddress)}
            {!isActive && <span className="text-sm font-normal text-gray-500 ml-2">(Closed)</span>}
          </h3>
          <p className="text-sm text-gray-500">
            Lender: {formatAddress(loan.loaner)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Active/Inactive Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {isActive ? 'Active' : 'Closed'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className={`rounded-lg p-3 ${isActive ? 'bg-gray-50' : 'bg-gray-100'}`}>
          <p className="text-sm text-gray-500 mb-1">Principal Value</p>
          <p className={`text-lg font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
            {formatUsdAmount(Number(loan.initialLoanValue))}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${isActive ? 'bg-gray-50' : 'bg-gray-100'}`}>
          <p className="text-sm text-gray-500 mb-1">Present Value</p>
          <p className={`text-lg font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
            {formatUsdAmount(Number(loan.currentLoanValue))}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${isActive ? 'bg-gray-50' : 'bg-gray-100'}`}>
          <p className="text-sm text-gray-500 mb-1">Collateral Value</p>
          <p className={`text-lg font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
            {formatUsdAmount(collateralValueNow)}
          </p>
        </div>
      </div>

      {/* Loan Health Indicator - only show for active loans */}
      {isActive && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500">Overall Health</p>
            <p className="text-sm font-medium">
              {loanStatus.status === 'good' ? 'Healthy' : 
               loanStatus.status === 'medium' ? 'Moderate Risk' : 
               'High Risk - Near Liquidation'}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                loanStatus.status === 'good' ? 'bg-green-500 w-full' :
                loanStatus.status === 'medium' ? 'bg-yellow-500 w-2/3' :
                'bg-red-500 w-1/3'
              }`}
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      )}

      {/* Closed loan indicator */}
      {!isActive && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Loan has been closed</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => window.location.href = `/manage/${loan.loanAddress}`}
            className={`px-3 py-1 border rounded-lg transition-colors text-sm ${
              isActive 
                ? 'text-blue-600 border-blue-600 hover:bg-blue-50' 
                : 'text-gray-500 border-gray-400 hover:bg-gray-100'
            }`}
          >
            Manage
          </button>
          {isActive && loanStatus.status === 'bad' && (
            <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
              Add Collateral
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 