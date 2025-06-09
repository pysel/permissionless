"use client";

import { useWeb3Modal } from "@web3modal/wagmi/react";
import Image from "next/image";

export function ConnectWalletPrompt() {
  const { open } = useWeb3Modal();

  return (
    <div className="max-w-md mx-auto bg-white p-6 text-center">
      <div className="mb-4">
        <Image
          src="/connect.png"
          alt="Connect Wallet"
          width={0}
          height={0}
          sizes="30vw"
          style={{ width: '20vw', height: 'auto', minWidth: '200px', maxWidth: '400px' }}
          className="mx-auto"
        />
      </div>
      <p className="text-black mb-6 text-xl">
        Please, Connect Your Wallet
      </p>
    </div>
  );
} 