"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { useState, useEffect } from "react";

// Contract ABIs (simplified)
const REGISTRY_ABI = [
  {
    inputs: [],
    name: "getAllRegisteredLoaners",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const LOANER_ABI = [
  {
    inputs: [],
    name: "isActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllowedTokens",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "createdLoans",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "i_loanSigner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface LenderData {
  address: string;
  isActive: boolean;
  allowedTokens: string[];
  createdLoans: number;
  loanSigner: string;
}

export function useLenders(registryAddress?: string) {
  const [lenders, setLenders] = useState<LenderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debug: Log the registry address
  console.log('🔍 Registry Address:', registryAddress);

  // Get all registered lender addresses
  const { data: lenderAddresses } = useReadContract({
    address: registryAddress as `0x${string}`,
    abi: REGISTRY_ABI,
    functionName: "getAllRegisteredLoaners",
    query: {
      enabled: !!registryAddress,
    },
  });

  // Debug: Log lender addresses
  console.log('📋 Lender Addresses:', lenderAddresses);

  // Create contracts array for batch reading
  const contracts = lenderAddresses?.flatMap((address) => [
    {
      address: address as `0x${string}`,
      abi: LOANER_ABI,
      functionName: "isActive",
    },
    {
      address: address as `0x${string}`,
      abi: LOANER_ABI,
      functionName: "getAllowedTokens",
    },
    {
      address: address as `0x${string}`,
      abi: LOANER_ABI,
      functionName: "createdLoans",
    },
    {
      address: address as `0x${string}`,
      abi: LOANER_ABI,
      functionName: "i_loanSigner",
    },
  ]) || [];

  // Debug: Log contracts array
  console.log('📊 Contracts Array Length:', contracts.length);

  const { data: contractResults } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!lenderAddresses && lenderAddresses.length > 0,
    },
  });

  // Debug: Log contract results
  console.log('📈 Contract Results:', contractResults);

  useEffect(() => {
    if (lenderAddresses && contractResults) {
      console.log('🔄 Processing lender data...');
      const parsedLenders: LenderData[] = [];
      
      for (let i = 0; i < lenderAddresses.length; i++) {
        const baseIndex = i * 4;
        const isActive = contractResults[baseIndex]?.result as boolean;
        const allowedTokens = contractResults[baseIndex + 1]?.result as string[];
        const createdLoans = contractResults[baseIndex + 2]?.result as bigint;
        const loanSigner = contractResults[baseIndex + 3]?.result as string;

        // Debug: Log individual lender data
        console.log(`👤 Lender ${i + 1}:`, {
          address: lenderAddresses[i],
          isActive,
          allowedTokens,
          createdLoans: Number(createdLoans),
          loanSigner,
        });

        parsedLenders.push({
          address: lenderAddresses[i],
          isActive: isActive || false,
          allowedTokens: allowedTokens || [],
          createdLoans: Number(createdLoans) || 0,
          loanSigner: loanSigner || "",
        });
      }

      // Sort by createdLoans descending and take top 10
      const sortedLenders = parsedLenders
        .sort((a, b) => b.createdLoans - a.createdLoans)
        .slice(0, 10);

      console.log('🏆 Final Sorted Lenders:', sortedLenders);
      setLenders(sortedLenders);
      setIsLoading(false);
    }
  }, [lenderAddresses, contractResults]);

  return {
    lenders,
    isLoading,
    totalLenders: lenderAddresses?.length || 0,
  };
} 