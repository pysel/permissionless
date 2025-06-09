"use client";

import Link from "next/link";
import WalletConnect from "./WalletConnect";
import { useAccount } from "wagmi";

export default function Dashboard() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header with Wallet Connect */}
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <WalletConnect />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-5xl font-semibold mb-4">Permissionless.Fi</h1>
              <p className="text-gray-600 mb-8">Manage your DeFi activities</p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Borrow Card */}
              <Link href="/borrow">
                <div className="bg-white pop-up-med transition-colors transition-transform p-6 rounded-xl border-2 border-black cursor-pointer group active:scale-98">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Borrow</h3>
                    <div className="text-blue-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 transition-colors">Access undercollateralized loans</p>
                </div>
              </Link>

              {/* Placeholder for future features */}
              <div className="bg-white p-6 rounded-xl border-2 border-black opacity-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-black">Lend</h3>
                  <div className="text-black">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600">Coming soon...</p>
              </div>

              {/* Manage Card */}
              <Link href="/manage">
                <div className="bg-white pop-up-med transition-colors transition-transform p-6 rounded-xl border-2 border-black cursor-pointer group active:scale-98">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Manage</h3>
                    <div className="text-green-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 transition-colors">View and manage your active loans</p>
                </div>
              </Link>
            </div>
          </div>
      </main>
    </div>
  );
}
