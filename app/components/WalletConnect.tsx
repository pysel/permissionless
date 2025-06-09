"use client";

import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import ClientOnly from "./ClientOnly";

function WalletConnectInner() {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-white px-4 py-2 rounded-lg border-2 border-black pop-up-min">
          <span className="text-green-700 text-sm font-bold">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={() => open()}
          className="bg-white pop-up-min text-black px-4 py-2 rounded-lg transition-colors border-2 border-black active:bg-black active:text-white"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      className="bg-white pop-up-min text-black px-6 py-2 rounded-lg transition-colors border-2 border-black active:bg-black active:text-white"
    >
      Connect Wallet
    </button>
  );
}

export default function WalletConnect() {
  return (
    <ClientOnly fallback={
      <div className="bg-gray-600 text-gray-400 px-6 py-2 rounded-lg">
        Loading...
      </div>
    }>
      <WalletConnectInner />
    </ClientOnly>
  );
} 