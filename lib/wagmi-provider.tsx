"use client";
 
import React, { ReactNode, useEffect, useState } from "react";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { State, WagmiProvider } from "wagmi";
import { config } from "./config";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) throw new Error("NEXT_PUBLIC_PROJECT_ID is not defined");

// Prevent multiple initializations with a more robust check
let modalInitialized = false;
let modalInstance: ReturnType<typeof createWeb3Modal> | null = null;

const initializeModal = () => {
  if (typeof window !== 'undefined' && !modalInitialized) {
    try {
      modalInstance = createWeb3Modal({
        wagmiConfig: config,
        projectId,
        enableAnalytics: false, // Disable analytics to reduce console warnings
        themeMode: 'light',
        themeVariables: {
          '--w3m-border-radius-master': '4px',
        }
      });
      modalInitialized = true;
    } catch (error) {
      console.warn('WalletConnect modal already initialized:', error);
      modalInitialized = true; // Prevent further attempts
    }
  }
};
 
export const WagmiProviderComp = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) => {
  const [mounted, setMounted] = useState(false);
  
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false, // Reduce retries to minimize console noise
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  );

  useEffect(() => {
    // Add a small delay to ensure proper mounting
    const timer = setTimeout(() => {
      setMounted(true);
      initializeModal();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
 
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

export default WagmiProviderComp;