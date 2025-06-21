"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { useState, useEffect } from "react";
import REGISTRY_ABI from "../abis/registry";
import LOANER_ABI from "../abis/loaner";

export interface LenderData {
  address: string;
  isActive: boolean;
  allowedTokens: string[];
  createdLoans: number;
  loanSigner: string;
}

export function useLenders(registryAddress?: string) {
  const [lenders, setLenders] = useState<LenderData[]>([]);

  // Debug: Log the registry address
  console.log('🔍 Registry Address:', registryAddress);

  // Get all registered lender addresses
  const { data: lenderAddresses, isLoading: lenderAddressesLoading } = useReadContract({
    address: registryAddress as `0x${string}`,
    abi: REGISTRY_ABI,
    functionName: "getAllRegisteredLoaners",
    query: {
      enabled: !!registryAddress,
    },
  });

  // Debug: Log lender addresses
  console.log('📋 Lender Addresses:', lenderAddresses);

  const lenderAddressList = (lenderAddresses as string[]) || [];

  // Create contracts array for batch reading
  const contracts = lenderAddressList.flatMap((address) => [
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
      functionName: "loanSigner",
    },
  ]);

  // Debug: Log contracts array
  console.log('📊 Contracts Array Length:', contracts.length);

  const { data: contractResults, isLoading: contractResultsLoading } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!lenderAddresses && lenderAddressList.length > 0,
    },
  });

  // Debug: Log contract results
  console.log('📈 Contract Results:', contractResults);

  // Calculate loading state properly
  const isLoading = lenderAddressesLoading || 
                   (lenderAddressList.length > 0 && contractResultsLoading);

  useEffect(() => {
    // Handle the case when we have lender addresses and contract results
    if (lenderAddresses && lenderAddressList.length > 0 && contractResults) {
      console.log('🔄 Processing lender data...');
      const parsedLenders: LenderData[] = [];
      
      for (let i = 0; i < lenderAddressList.length; i++) {
        const baseIndex = i * 4;
        const isActive = contractResults[baseIndex]?.result as boolean;
        const allowedTokens = contractResults[baseIndex + 1]?.result as string[];
        const createdLoans = contractResults[baseIndex + 2]?.result as bigint;
        const loanSigner = contractResults[baseIndex + 3]?.result as string;

        // Debug: Log individual lender data
        console.log(`👤 Lender ${i + 1}:`, {
          address: lenderAddressList[i],
          isActive,
          allowedTokens,
          createdLoans: Number(createdLoans),
          loanSigner,
        });

        parsedLenders.push({
          address: lenderAddressList[i],
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
    } 
    // Handle the case when we have confirmed there are no lenders
    else if (lenderAddresses && lenderAddressList.length === 0) {
      console.log('📭 No lenders found');
      setLenders([]);
    }
  }, [lenderAddresses, contractResults, lenderAddressList.length]);

  return {
    lenders,
    isLoading,
    totalLenders: lenderAddressList.length,
  };
} 