"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { TOKEN_ADDRESSES } from "../tokenLogos";
import ERC20_ABI from "../abis/erc20";
import REGISTRY_ABI from "../abis/registry";
import LOAN_MANAGER_ABI from "../abis/loanManager";

// Type definitions for loan data
export interface LoanData {
  loanAddress: string;
  borrower: string;
  loaner: string;
  collateralValue: bigint;
  collateralEthAmount: bigint;
  collateralCurrentValue: bigint;
  initialLoanValue: bigint;
  currentLoanValue: bigint;
  tokens: string[];
  amounts: bigint[];
  isActive: boolean;
  wallet: string;
}

export function useLoanManager() {
  // Get loan manager address from registry
  const { data: loanManagerAddress, isLoading: loanManagerLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY as `0x${string}`,
    abi: REGISTRY_ABI,
    functionName: "loanManager",
    query: {
      enabled: !!CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY,
    },
  });

  return {
    loanManagerAddress: loanManagerAddress as string,
    isLoading: loanManagerLoading,
  };
}

export function useTokenPrice(tokenAddress: string, usdAmount: number, refetchKey?: number) {
  const { loanManagerAddress } = useLoanManager();

  // We need to reverse-engineer the token amount from USD value
  // This is a simplified approach - in reality, you might need a more sophisticated method
  const { data: tokenAmountForDollar, refetch } = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getTokenValueUSD",
    args: [tokenAddress as `0x${string}`, BigInt(10**18)], // 1 token with 18 decimals
    query: {
      enabled: !!loanManagerAddress && !!tokenAddress && (refetchKey !== undefined ? refetchKey >= 0 : true),
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  });

  // Calculate the actual token amount needed for the USD value
  const tokenAmount = tokenAmountForDollar 
    ? (BigInt(usdAmount * 100000000) * BigInt(10**18)) / tokenAmountForDollar // usdAmount * 10^8 (USD decimals) * 10^18 (token decimals) / price_per_token
    : BigInt(0);

  return {
    tokenAmount,
    tokenAmountForDollar,
    isLoading: !tokenAmountForDollar && !!loanManagerAddress,
    refetch,
  };
}

export function useLenderAvailableFunds(lenderAddress: string, allowedTokens: string[]) {
  const { loanManagerAddress, isLoading: loanManagerLoading } = useLoanManager();

  // Create contracts for getting token balances
  const balanceContracts = allowedTokens.map(tokenAddress => ({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [lenderAddress as `0x${string}`],
  }));

  // Create contracts for getting USD values
  const priceContracts = allowedTokens.map(tokenAddress => ({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getTokenValueUSD",
    args: [tokenAddress as `0x${string}`, BigInt(10**18)], // 1 token with 18 decimals
  }));

  const { data: balanceResults, isLoading: balancesLoading } = useReadContracts({
    contracts: balanceContracts as any,
    query: {
      enabled: !!lenderAddress && allowedTokens.length > 0,
    },
  });

  const { data: priceResults, isLoading: pricesLoading } = useReadContracts({
    contracts: priceContracts as any,
    query: {
      enabled: !!loanManagerAddress && allowedTokens.length > 0,
    },
  });

  // Calculate total available funds in USD
  let totalUsdValue = 0;
  const isLoading = loanManagerLoading || balancesLoading || pricesLoading || 
                   (allowedTokens.length > 0 && loanManagerAddress && (!balanceResults || !priceResults));

  if (balanceResults && priceResults && loanManagerAddress) {
    totalUsdValue = allowedTokens.reduce((total, tokenAddress, index) => {
      const balance = balanceResults[index]?.result as bigint;
      const pricePerToken = priceResults[index]?.result as bigint;
      
      if (balance && pricePerToken && pricePerToken > 0) {
        // Calculate USD value: (balance * pricePerToken) / 10^18 / 10^8
        const usdValue = Number((balance * pricePerToken) / BigInt(10**18));
        return total + usdValue;
      }
      return total;
    }, 0);
  }

  return {
    totalAvailableFunds: totalUsdValue,
    isLoading,
  };
}

export function useLenderTokenBalances(lenderAddress: string, allowedTokens: string[]) {
  const { loanManagerAddress, isLoading: loanManagerLoading } = useLoanManager();

  // Create contracts for getting token balances
  const balanceContracts = allowedTokens.map(tokenAddress => ({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [lenderAddress as `0x${string}`],
  }));

  // Create contracts for getting USD values
  const priceContracts = allowedTokens.map(tokenAddress => ({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getTokenValueUSD",
    args: [tokenAddress as `0x${string}`, BigInt(10**18)], // 1 token with 18 decimals
  }));

  const { data: balanceResults, isLoading: balancesLoading } = useReadContracts({
    contracts: balanceContracts as any,
    query: {
      enabled: !!lenderAddress && allowedTokens.length > 0,
    },
  });

  const { data: priceResults, isLoading: pricesLoading } = useReadContracts({
    contracts: priceContracts as any,
    query: {
      enabled: !!loanManagerAddress && allowedTokens.length > 0,
    },
  });

  // Calculate individual token balances in USD
  const tokenBalances: { [tokenAddress: string]: { balance: number; usdValue: number } } = {};
  const isLoading = loanManagerLoading || balancesLoading || pricesLoading || 
                   (allowedTokens.length > 0 && loanManagerAddress && (!balanceResults || !priceResults));

  if (balanceResults && priceResults && loanManagerAddress) {
    allowedTokens.forEach((tokenAddress, index) => {
      const balance = balanceResults[index]?.result as bigint;
      const pricePerToken = priceResults[index]?.result as bigint;
      
      if (balance && pricePerToken && pricePerToken > 0) {
        // Calculate USD value: (balance * pricePerToken) / 10^18 / 10^8
        const usdValue = Number((balance * pricePerToken) / BigInt(10**18));
        const tokenBalance = Number(balance) / (10**18); // Convert to readable token amount
        
        tokenBalances[tokenAddress] = {
          balance: tokenBalance,
          usdValue: usdValue,
        };
      } else {
        tokenBalances[tokenAddress] = {
          balance: 0,
          usdValue: 0,
        };
      }
    });
  }

  return {
    tokenBalances,
    isLoading,
  };
}

export function useCreateLoan() {
  const { loanManagerAddress } = useLoanManager();

  const convertUsdToTokenAmount = async (tokenAddress: string, usdAmount: number) => {
    if (!loanManagerAddress || usdAmount <= 0) return BigInt(0);

    // Get the price for 1 token (10^18 wei) in USD
    const { data: priceFor1Token } = await useReadContract({
      address: loanManagerAddress as `0x${string}`,
      abi: LOAN_MANAGER_ABI,
      functionName: "getTokenValueUSD",
      args: [tokenAddress as `0x${string}`, BigInt(10**18)],
    });

    if (!priceFor1Token) return BigInt(0);

    // Calculate token amount needed for the USD value
    // Formula: (usdAmount * 10^8 * 10^18) / priceFor1Token
    const tokenAmount = (BigInt(Math.floor(usdAmount * 100000000)) * BigInt(10**18)) / (priceFor1Token as bigint);
    
    return tokenAmount;
  };

  return {
    loanManagerAddress,
    convertUsdToTokenAmount,
  };
}

export function useBorrowerLoans(borrowerAddress: string) {
  const { loanManagerAddress, isLoading: loanManagerLoading } = useLoanManager();

  // Get loan addresses for the borrower
  const { data: loanAddresses, isLoading: loanAddressesLoading } = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getBorrowerLoans",
    args: [borrowerAddress as `0x${string}`],
    query: {
      enabled: !!loanManagerAddress && !!borrowerAddress,
    },
  });

  const loanAddressList = (loanAddresses as string[]) || [];
  
  // Create contracts for getting loan data
  const loanDataContracts = loanAddressList.map(loanAddress => ({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddress as `0x${string}`],
  }));

  // Get all loan data in one batch
  const { data: loanDataResults, isLoading: loanDataLoading } = useReadContracts({
    contracts: loanDataContracts as any,
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 0,
    },
  });

  console.log("data results", loanDataResults);

  // Create contracts for getting current values - keep track of valid indices
  const validLoanIndices: number[] = [];
  const currentValueContracts = loanDataResults?.map((result, index) => {
    const loanData = result.result as any;
    // Only create contract if we have valid loan data
    if (!loanData || !loanData.wallet || !loanData.tokens) {
      return null;
    }
    validLoanIndices.push(index);
    return {
      address: loanManagerAddress as `0x${string}`,
      abi: LOAN_MANAGER_ABI,
      functionName: "getWalletValueUSD",
      args: [
        loanData.wallet as `0x${string}`,
        loanData.tokens as `0x${string}`[]
      ],
    };
  }).filter(contract => contract !== null) || [];

  // Get all current values in one batch
  const { data: currentValueResults, isLoading: currentValueLoading } = useReadContracts({
    contracts: currentValueContracts as any,
    query: {
      enabled: !!loanManagerAddress && currentValueContracts.length > 0,
    },
  });

  const { data: ethPrice, isLoading: ethPriceLoading } = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getTokenValueUSD",
    args: [TOKEN_ADDRESSES.WETH as `0x${string}`, BigInt(10**18)],
    query: {
      enabled: !!loanManagerAddress,
    },
  });

  // Process loan data
  const loans: LoanData[] = [];
  
  if (loanDataResults && ethPrice) {
    loanDataResults.forEach((result, index) => {
      const loanData = result.result as any;
      // Find the corresponding current value result for this loan
      const validResultIndex = validLoanIndices.indexOf(index);
      const currentValue = validResultIndex >= 0 ? currentValueResults?.[validResultIndex]?.result as bigint : undefined;
      
      if (loanData) {
        // Calculate collateral current value based on the collateralEthAmount
        // All values are already in 8 decimals, no need for additional scaling
        const collateralCurrentValue = loanData.collateralEthAmount ? 
          (loanData.collateralEthAmount * ethPrice) / BigInt(10**18) : 
          BigInt(0);

        console.log({
          collateralEthAmount: loanData.collateralEthAmount.toString(),
          initialLoanValue: loanData.initialLoanValue.toString(),
          currentValue: currentValue ? currentValue.toString() : "undefined",
          calculatedValue: collateralCurrentValue.toString(),
          // Add human readable values for debugging
          collateralEthAmountReadable: Number(loanData.collateralEthAmount) / 1e8,
          initialLoanValueReadable: Number(loanData.initialLoanValue) / 1e8,
          currentValueReadable: currentValue ? Number(currentValue) / 1e8 : 0,
          calculatedValueReadable: Number(collateralCurrentValue) / 1e8
        });
        
        loans.push({
          loanAddress: loanAddressList[index],
          borrower: loanData.borrower,
          loaner: loanData.loaner,
          collateralValue: loanData.collateralValue,
          collateralEthAmount: loanData.collateralEthAmount,
          collateralCurrentValue,
          initialLoanValue: loanData.initialLoanValue,
          currentLoanValue: currentValue || BigInt(0),
          tokens: loanData.tokens,
          amounts: loanData.amounts,
          isActive: loanData.isActive,
          wallet: loanData.wallet,
        });
      }
    });
  }

  // Fix loading logic to handle the case when there are no loans
  const isLoading = loanManagerLoading || 
                   loanAddressesLoading || 
                   ethPriceLoading ||
                   (loanAddressList.length > 0 && (loanDataLoading || currentValueLoading));

  const error = loanDataResults?.find(result => result.error)?.error?.message || 
                currentValueResults?.find(result => result.error)?.error?.message;

  return {
    loans,
    isLoading,
    error,
  };
}

export function useWalletTokenBalances(walletAddress: string, tokens: string[]) {
  // Create contracts for getting token balances from the wallet
  const balanceContracts = tokens.map(tokenAddress => ({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [walletAddress as `0x${string}`],
  }));

  const { data: balanceResults, isLoading: balancesLoading } = useReadContracts({
    contracts: balanceContracts as any,
    query: {
      enabled: !!walletAddress && tokens.length > 0,
    },
  });

  // Calculate individual token balances
  const tokenBalances: { [tokenAddress: string]: bigint } = {};
  const isLoading = balancesLoading || (tokens.length > 0 && !balanceResults);

  if (balanceResults) {
    tokens.forEach((tokenAddress, index) => {
      const balance = balanceResults[index]?.result as bigint;
      tokenBalances[tokenAddress] = balance || BigInt(0);
    });
  }

  return {
    tokenBalances,
    isLoading,
  };
} 