"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import WalletConnect from "../components/WalletConnect";
import { ConnectWalletPrompt } from "../components/ConnectWalletPrompt";
import { useBorrowerLoans } from "@/lib/hooks/useLoanManager";
import { getTokenInfo } from "@/lib/tokenLogos";
import { calculateLoanStatus } from "./loan/[address]/page";

export default function ManagePage() {
  const { address, isConnected } = useAccount();
  const { loans, isLoading, error } = useBorrowerLoans(address || "");

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
                <p className="text-gray-600 mb-6">You don't have any active loans yet.</p>
                <Link
                  href="/borrow"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Request a Loan
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-black mb-2">Your Loans</h2>
                  <p className="text-gray-600">Manage and monitor your active loans</p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
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

                <div className="space-y-6">
                  {loans.map((loan, index) => (
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

  const formatUsdAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };

  const loanStatus = calculateLoanStatus(loan);
  const width = loanStatus.percentage > 100 ? 100 : loanStatus.percentage < 0 ? 0 : loanStatus.percentage;
  const collateralValueNow = Number(loan.collateralCurrentValue);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-[1.005] hover:border-blue-300 cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Loan {formatAddress(loan.loanAddress)}
          </h3>
          <p className="text-sm text-gray-500">
            Lender: {formatAddress(loan.loaner)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Active/Inactive Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            loan.isActive 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {loan.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500 mb-1">Principal Value</p>
          <p className="text-lg font-semibold">
            {formatUsdAmount(Number(loan.initialLoanValue) / 1e8)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500 mb-1">Present Value</p>
          <p className="text-lg font-semibold">
            {formatUsdAmount(Number(loan.currentLoanValue) / 1e8)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500 mb-1">Collateral Value</p>
          <p className="text-lg font-semibold">
            {formatUsdAmount(collateralValueNow)}
          </p>
        </div>
      </div>

      {/* Loan Health Indicator */}
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

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => window.open(`/manage/loan/${loan.loanAddress}`, '_blank')}
            className="px-3 py-1 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            View Details
          </button>
          {loan.isActive && loanStatus.status === 'bad' && (
            <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
              Add Collateral
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 