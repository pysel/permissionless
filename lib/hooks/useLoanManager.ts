"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";

// Registry ABI to get loan manager address
const REGISTRY_ABI = [
  {
    inputs: [],
    name: "i_loanManager",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Loan Manager ABI for price queries
const LOAN_MANAGER_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "getTokenValueUSD",
    outputs: [{ name: "usdValue", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "loaner", type: "address" },
          { name: "tokens", type: "address[]" },
          { name: "amounts", type: "uint256[]" },
          { name: "collateralValue", type: "uint256" }
        ]
      }
    ],
    name: "createLoan",
    outputs: [
      { name: "", type: "address" },
      { name: "", type: "address" }
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "_borrower", type: "address" }],
    name: "getBorrowerLoans",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_loan", type: "address" }],
    name: "loanToData",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "borrower", type: "address" },
          { name: "loaner", type: "address" },
          { name: "collateralValue", type: "uint256" },
          { name: "initialLoanValue", type: "uint256" },
          { name: "tokens", type: "address[]" },
          { name: "amounts", type: "uint256[]" },
          { name: "isActive", type: "bool" },
          { name: "wallet", type: "address" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "wallet", type: "address" },
      { name: "tokens", type: "address[]" }
    ],
    name: "getWalletValueUSD",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "loanerGasFees",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ERC20 ABI for balance queries
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Type definitions for loan data
export interface LoanData {
  loanAddress: string;
  borrower: string;
  loaner: string;
  collateralValue: bigint;
  initialLoanValue: bigint;
  currentLoanValue: bigint;
  tokens: string[];
  amounts: bigint[];
  isActive: boolean;
  wallet: string;
}

export function useLoanManager() {
  // Get loan manager address from registry
  const { data: loanManagerAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY as `0x${string}`,
    abi: REGISTRY_ABI,
    functionName: "i_loanManager",
    query: {
      enabled: !!CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY,
    },
  });

  return {
    loanManagerAddress: loanManagerAddress as string,
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
  const { loanManagerAddress } = useLoanManager();

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

  const { data: balanceResults } = useReadContracts({
    contracts: balanceContracts as any,
    query: {
      enabled: !!lenderAddress && allowedTokens.length > 0,
    },
  });

  const { data: priceResults } = useReadContracts({
    contracts: priceContracts as any,
    query: {
      enabled: !!loanManagerAddress && allowedTokens.length > 0,
    },
  });

  // Calculate total available funds in USD
  let totalUsdValue = 0;
  const isLoading = !balanceResults || !priceResults || !loanManagerAddress;

  if (balanceResults && priceResults && !isLoading) {
    totalUsdValue = allowedTokens.reduce((total, tokenAddress, index) => {
      const balance = balanceResults[index]?.result as bigint;
      const pricePerToken = priceResults[index]?.result as bigint;
      
      if (balance && pricePerToken && pricePerToken > 0) {
        // Calculate USD value: (balance * pricePerToken) / 10^18 / 10^8
        const usdValue = Number((balance * pricePerToken) / BigInt(10**18) / BigInt(10**8));
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
  const { loanManagerAddress } = useLoanManager();

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

  const { data: balanceResults } = useReadContracts({
    contracts: balanceContracts as any,
    query: {
      enabled: !!lenderAddress && allowedTokens.length > 0,
    },
  });

  const { data: priceResults } = useReadContracts({
    contracts: priceContracts as any,
    query: {
      enabled: !!loanManagerAddress && allowedTokens.length > 0,
    },
  });

  // Calculate individual token balances in USD
  const tokenBalances: { [tokenAddress: string]: { balance: number; usdValue: number } } = {};
  const isLoading = !balanceResults || !priceResults || !loanManagerAddress;

  if (balanceResults && priceResults && !isLoading) {
    allowedTokens.forEach((tokenAddress, index) => {
      const balance = balanceResults[index]?.result as bigint;
      const pricePerToken = priceResults[index]?.result as bigint;
      
      if (balance && pricePerToken && pricePerToken > 0) {
        // Calculate USD value: (balance * pricePerToken) / 10^18 / 10^8
        const usdValue = Number((balance * pricePerToken) / BigInt(10**18) / BigInt(10**8));
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
  const { loanManagerAddress } = useLoanManager();

  // Get loan addresses for the borrower
  const { data: loanAddresses } = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getBorrowerLoans",
    args: [borrowerAddress as `0x${string}`],
    query: {
      enabled: !!loanManagerAddress && !!borrowerAddress,
    },
  });

  // Always call hooks for up to 10 loans (reasonable maximum) to maintain consistent hook calls
  const loanAddressList = (loanAddresses as string[]) || [];
  
  const loan1Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[0] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 0,
    },
  });

  const loan2Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[1] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 1,
    },
  });

  const loan3Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[2] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 2,
    },
  });

  const loan4Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[3] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 3,
    },
  });

  const loan5Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[4] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 4,
    },
  });

  const loan6Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[5] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 5,
    },
  });

  const loan7Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[6] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 6,
    },
  });

  const loan8Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[7] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 7,
    },
  });

  const loan9Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[8] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 8,
    },
  });

  const loan10Data = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddressList[9] as `0x${string}` || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 9,
    },
  });

  // Current loan value hooks - always call 10 hooks for consistency
  const loan1CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan1Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan1Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 0 && !!loan1Data.data,
    },
  });

  const loan2CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan2Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan2Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 1 && !!loan2Data.data,
    },
  });

  const loan3CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan3Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan3Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 2 && !!loan3Data.data,
    },
  });

  const loan4CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan4Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan4Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 3 && !!loan4Data.data,
    },
  });

  const loan5CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan5Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan5Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 4 && !!loan5Data.data,
    },
  });

  const loan6CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan6Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan6Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 5 && !!loan6Data.data,
    },
  });

  const loan7CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan7Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan7Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 6 && !!loan7Data.data,
    },
  });

  const loan8CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan8Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan8Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 7 && !!loan8Data.data,
    },
  });

  const loan9CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan9Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan9Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 8 && !!loan9Data.data,
    },
  });

  const loan10CurrentValue = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getWalletValueUSD",
    args: [
      (loan10Data.data as any)?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
      (loan10Data.data as any)?.tokens as `0x${string}`[] || []
    ],
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 9 && !!loan10Data.data,
    },
  });

  // Process loan data
  const loans: LoanData[] = [];
  const loanDataHooks = [loan1Data, loan2Data, loan3Data, loan4Data, loan5Data, loan6Data, loan7Data, loan8Data, loan9Data, loan10Data];
  const currentValueHooks = [loan1CurrentValue, loan2CurrentValue, loan3CurrentValue, loan4CurrentValue, loan5CurrentValue, loan6CurrentValue, loan7CurrentValue, loan8CurrentValue, loan9CurrentValue, loan10CurrentValue];
  
  for (let i = 0; i < loanAddressList.length && i < 10; i++) {
    const loanHook = loanDataHooks[i];
    const currentValueHook = currentValueHooks[i];
    
    if (loanHook.data) {
      const loanData = loanHook.data as any;
      const currentValue = currentValueHook.data as bigint;
      
      loans.push({
        loanAddress: loanAddressList[i],
        borrower: loanData.borrower,
        loaner: loanData.loaner,
        collateralValue: loanData.collateralValue,
        initialLoanValue: loanData.initialLoanValue,
        currentLoanValue: currentValue || BigInt(0),
        tokens: loanData.tokens,
        amounts: loanData.amounts,
        isActive: loanData.isActive,
        wallet: loanData.wallet,
      });
    }
  }

  const isLoading = !loanAddresses || loanDataHooks.some((hook, index) => 
    index < loanAddressList.length && hook.isLoading
  ) || currentValueHooks.some((hook, index) => 
    index < loanAddressList.length && hook.isLoading
  );

  const error = loanDataHooks.find((hook, index) => 
    index < loanAddressList.length && hook.error
  )?.error?.message || currentValueHooks.find((hook, index) => 
    index < loanAddressList.length && hook.error
  )?.error?.message;

  return {
    loans,
    isLoading,
    error,
  };
} 