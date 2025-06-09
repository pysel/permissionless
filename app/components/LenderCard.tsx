"use client";

import { LenderData } from "@/lib/hooks/useLenders";
import { getTokenInfo } from "@/lib/tokenLogos";
import { useLenderAvailableFunds } from "@/lib/hooks/useLoanManager";
import Link from "next/link";

interface LenderCardProps {
  lender: LenderData;
  rank: number;
}

export default function LenderCard({ lender, rank }: LenderCardProps) {
  const { totalAvailableFunds, isLoading: fundsLoading } = useLenderAvailableFunds(
    lender.address, 
    lender.allowedTokens
  );

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

  return (
    <div className="bg-white hover:bg-gray-200 transition-colors p-7 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between">
        {/* Left section - Lender info and rank */}
        <div className="flex items-center gap-6 flex-1">
          {/* Rank */}
          <div className="bg-blue-600 text-white text-lg font-bold rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
            #{rank}
          </div>
          
          {/* Lender Details */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-xl font-semibold">Lender</h3>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${lender.isActive ? "bg-green-500" : "bg-red-500"}`} />
                <span className={`text-sm font-medium ${lender.isActive ? "text-green-400" : "text-red-400"}`}>
                  {lender.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-black-500">
              <div>
                <span className="">Address:</span>
                <div className="text-black font-mono">{formatAddress(lender.address)}</div>
              </div>
              <div>
                <span className="">Signer:</span>
                <div className="text-black font-mono">{formatAddress(lender.loanSigner)}</div>
              </div>
              <div>
                <span className="">Loans Created:</span>
                <div className="text-black font-semibold">{lender.createdLoans}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right section - Action button */}
        <div className="flex-shrink-0 ml-6">
          {lender.isActive ? (
            <Link 
              href={`/lender/${lender.address}`}
              className="inline-block py-3 px-6 active:scale-96 rounded-lg transition-colors font-medium bg-green-500 hover:bg-green-700 text-white"
            >
              Borrow
            </Link>
          ) : (
            <button
              className="py-3 px-6 rounded-lg transition-colors font-medium bg-gray-600 text-gray-400 cursor-not-allowed"
              disabled
            >
              Lender Inactive
            </button>
          )}
        </div>
      </div>

      {/* Supported Tokens and Available Funds - Full width below */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-start justify-between">
          {/* Left side - Supported Tokens */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-black font-medium">Supported Tokens:</h4>
              {/* <span className="text-gray-500 text-sm">{lender.allowedTokens.length} tokens</span> */}
            </div>
            
            <div className="flex flex-wrap gap-3">
              {lender.allowedTokens.length > 0 ? (
                lender.allowedTokens.map((tokenAddress, index) => {
                  const tokenInfo = getTokenInfo(tokenAddress);
                  console.log(tokenInfo);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-gray-400 transition-colors"
                      title={`${tokenInfo.name} (${tokenInfo.symbol})`}
                    >
                      <img
                        src={tokenInfo.logoUrl}
                        alt={tokenInfo.symbol}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          // Prevent infinite loop by checking if it's already the fallback
                          const target = e.currentTarget;
                          if (!target.src.startsWith('data:')) {
                            // Use a base64 encoded SVG as fallback to avoid external requests
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM5Q0EzQUYiLz4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9IkFyaWFsIj4/PC90ZXh0Pgo8L3N2Zz4K';
                          }
                        }}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-sm italic">No tokens configured</div>
              )}
            </div>
          </div>

          {/* Right side - Available Funds */}
          <div className="flex-shrink-0 ml-8 text-right">
            <h4 className="text-black font-medium mb-3">Available Funds:</h4>
            <div className="text-2xl font-bold text-black">
              {fundsLoading ? (
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-500 text-base">Loading...</span>
                </div>
              ) : (
                formatUsdAmount(totalAvailableFunds)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 