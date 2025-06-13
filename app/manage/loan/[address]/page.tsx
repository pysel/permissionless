"use client";

import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import WalletConnect from "../../../components/WalletConnect";
import { ConnectWalletPrompt } from "../../../components/ConnectWalletPrompt";
import { useBorrowerLoans } from "@/lib/hooks/useLoanManager";
import { getTokenInfo } from "@/lib/tokenLogos";
import { formatUsdAmount } from "@/lib/utils/format";

export const calculateLoanStatus = (loan: any) => {
    if (!loan) return { status: 'unknown', color: 'bg-gray-100 text-gray-800', percentage: 0 };
    
    const initialLoanValue = Number(loan.initialLoanValue);
    const currentLoanValue = Number(loan.currentLoanValue);
    const collateralCurrentValue = Number(loan.collateralCurrentValue);
    
    const diff = currentLoanValue + collateralCurrentValue - initialLoanValue;
    const fraction = diff / collateralCurrentValue;
    
    if (fraction > 0.7) {
      return { status: 'good', color: 'bg-green-100 text-green-800', percentage: Math.round(fraction * 100) };
    } else if (fraction > 0.15) {
      return { status: 'medium', color: 'bg-yellow-100 text-yellow-800', percentage: Math.round(fraction * 100) };
    } else {
      return { status: 'bad', color: 'bg-red-100 text-red-800', percentage: Math.round(fraction * 100) };
    }
  };

export default function LoanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { loans, isLoading, error } = useBorrowerLoans(address || "");
  const loanAddress = params.address as string;
  const loan = loans.find(l => l.loanAddress.toLowerCase() === loanAddress.toLowerCase());

  const formatAddress = (address: string) => {
    return address;
  };

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
          
          {/* Loan Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xl text-gray-500 mb-1">Principal Value</p>
                <p className="text-2xl font-bold text-black">{formatUsdAmount(Number(loan.initialLoanValue))}</p>
              </div>
              <div>
                <p className="text-xl text-gray-500 mb-1">Present Value</p>
                <p className="text-2xl font-bold text-black">{formatUsdAmount(Number(loan.currentLoanValue))}</p>
              </div>
              <div>
                <p className="text-xl text-gray-500 mb-1">Collateral Value</p>
                <p className="text-2xl font-bold text-black">{formatUsdAmount(Number(loan.collateralCurrentValue))}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${loanStatus.color}`}>
                  {loanStatus.status}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">Overall Health</p>
                <p className="text-sm font-medium">{loanStatus.percentage}%</p>
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
          </div>

          {/* Loan Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Borrowed Tokens */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-6">Borrowed Tokens</h2>
              <div className="space-y-3">
                {loan.tokens.map((tokenAddress: string, index: number) => {
                  const tokenInfo = getTokenInfo(tokenAddress);
                  const amount = loan.amounts[index];
                  return (
                    <div key={tokenAddress} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={tokenInfo.logoUrl} 
                          alt={tokenInfo.symbol}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium">{tokenInfo.symbol}</div>
                          <div className="text-xs text-gray-500 font-mono">{tokenAddress}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{(Number(amount) / 1e18).toFixed(4)}</div>
                        <div className="text-xs text-gray-500">{tokenInfo.symbol}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loan Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-6">Loan Information</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Borrower</span>
                  <span className="font-mono text-sm">{loan.borrower}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lender</span>
                  <span className="font-mono text-sm">{loan.loaner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet Address</span>
                  <span className="font-mono text-sm">{loan.wallet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded text-sm ${loan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {loan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-green-400 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Add Collateral
            </button>
            <button className="flex-1 bg-red-400 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Close Loan
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 