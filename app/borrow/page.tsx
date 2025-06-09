"use client";

import Link from "next/link";
import WalletConnect from "../components/WalletConnect";
import LenderCard from "../components/LenderCard";
import { useAccount } from "wagmi";
import { useLenders } from "@/lib/hooks/useLenders";
import { CONTRACT_ADDRESSES } from "@/lib/constants";

export default function BorrowPage() {
    console.log("BorrowPage");
    console.log(CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY);

    const { isConnected } = useAccount();
    const { lenders, isLoading, totalLenders } = useLenders(CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY);

    return (
        <div className="min-h-screen bg-white text-black">
        {/* Header with Wallet Connect */}
        <header className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-500 hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </Link>
            <h1 className="text-2xl font-bold">Borrow</h1>
            </div>
            <WalletConnect />
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
            <div className="space-y-8">
                <div className="text-center">
                <h2 className="text-3xl font-semibold mb-4">Lenders</h2>
                <p className="text-gray-400 mb-2">Choose from the most active lenders on the platform</p>
                {totalLenders > 0 && (
                    <p className="text-gray-500 text-sm">
                    Showing top 10 of {totalLenders} registered lenders
                    </p>
                )}
                </div>

                {/* Loading State */}
                {isLoading && (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-4 text-gray-400">Loading lenders...</span>
                </div>
                )}

                {/* Lenders Grid */}
                {!isLoading && lenders.length > 0 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                    {lenders.map((lender, index) => (
                    <LenderCard
                        key={lender.address}
                        lender={lender}
                        rank={index + 1}
                    />
                    ))}
                </div>
                )}

                {/* No Lenders Found */}
                {!isLoading && lenders.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🏦</div>
                    <h3 className="text-xl font-semibold mb-2">No Lenders Available</h3>
                    <p className="text-gray-400 mb-4">
                    No active lenders found on the platform yet.
                    </p>
                    <p className="text-gray-500 text-sm">
                    Check back later or become a lender yourself!
                    </p>
                </div>
                )}

                {/* Info Section */}
                <div className="bg-white border border-black p-6 rounded-xl max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-3">How It Works</h3>
                <ul className="space-y-2 text-gray-500 text-lg">
                    <li>• Browse active lenders sorted by their loan activity</li>
                    <li>• Each lender shows supported tokens and current status</li>
                    <li>• Green dot indicates an active lender ready to process loans</li>
                    <li>• Click "Loan" to initiate borrowing from a specific lender</li>
                    <li>• Loan terms and rates are determined by individual lenders</li>
                </ul>
                </div>

                {/* Stats Section */}
                {!isLoading && totalLenders > 0 && (
                <div className="bg-white p-6 rounded-xl border border-black max-w-md mx-auto">
                    <h3 className="text-xl font-semibold mb-3 text-center">Platform Stats</h3>
                    <div className="space-y-2 text-center">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Total Lenders:</span>
                        <span className="text-black font-semibold">{totalLenders}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Active Lenders:</span>
                        <span className="text-green-400 font-semibold">
                        {lenders.filter(l => l.isActive).length}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Total Loans Created:</span>
                        <span className="text-blue-400 font-semibold">
                        {lenders.reduce((sum, l) => sum + l.createdLoans, 0)}
                        </span>
                    </div>
                    </div>
                </div>
                )}
            </div>
        </main>
    </div>
  );
}
