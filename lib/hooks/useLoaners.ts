"use client";

import { useReadContract, useReadContracts } from "wagmi";
import LOANER_ABI from "../abis/loaner";

// Hook to get allowed tokens for a specific loaner
export function useLoanerAllowedTokens(loanerAddress: string) {
  const { data: allowedTokens, isLoading } = useReadContract({
    address: loanerAddress as `0x${string}`,
    abi: LOANER_ABI,
    functionName: "getAllowedTokens",
    query: {
      enabled: !!loanerAddress,
    },
  });

  return {
    allowedTokens: (allowedTokens as string[]) || [],
    isLoading,
  };
} 