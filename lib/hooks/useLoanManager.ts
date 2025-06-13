"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { TOKEN_ADDRESSES } from "../tokenLogos";

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
          { name: "collateralEthAmount", type: "uint256" },
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

  const loanAddressList = (loanAddresses as string[]) || [];
  
  // Create contracts for getting loan data
  const loanDataContracts = loanAddressList.map(loanAddress => ({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "loanToData",
    args: [loanAddress as `0x${string}`],
  }));

  // Get all loan data in one batch
  const { data: loanDataResults } = useReadContracts({
    contracts: loanDataContracts as any,
    query: {
      enabled: !!loanManagerAddress && loanAddressList.length > 0,
    },
  });

  console.log("data results", loanDataResults);

  // Create contracts for getting current values
  const currentValueContracts = loanDataResults?.map((result, index) => {
    const loanData = result.result as any;
    return {
      address: loanManagerAddress as `0x${string}`,
      abi: LOAN_MANAGER_ABI,
      functionName: "getWalletValueUSD",
      args: [
        loanData?.wallet as `0x${string}` || "0x0000000000000000000000000000000000000000",
        loanData?.tokens as `0x${string}`[] || []
      ],
    };
  }) || [];

  // Get all current values in one batch
  const { data: currentValueResults } = useReadContracts({
    contracts: currentValueContracts as any,
    query: {
      enabled: !!loanManagerAddress && currentValueContracts.length > 0,
    },
  });

  const { data: ethPrice } = useReadContract({
    address: loanManagerAddress as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: "getTokenValueUSD",
    args: [TOKEN_ADDRESSES.WETH as `0x${string}`, BigInt(10**18)],
  });

  // Process loan data
  const loans: LoanData[] = [];
  
  if (loanDataResults && currentValueResults && ethPrice) {
    loanDataResults.forEach((result, index) => {
      const loanData = result.result as any;
      const currentValue = currentValueResults[index]?.result as bigint;
      
      if (loanData) {
        // Calculate collateral current value based on the collateralEthAmount
        // All values are already in 8 decimals, no need for additional scaling
        const collateralCurrentValue = loanData.collateralEthAmount ? 
          (loanData.collateralEthAmount * ethPrice) / BigInt(10**18) : 
          BigInt(0);

        console.log({
          collateralEthAmount: loanData.collateralEthAmount.toString(),
          initialLoanValue: loanData.initialLoanValue.toString(),
          currentValue: currentValue.toString(),
          calculatedValue: collateralCurrentValue.toString(),
          // Add human readable values for debugging
          collateralEthAmountReadable: Number(loanData.collateralEthAmount) / 1e8,
          initialLoanValueReadable: Number(loanData.initialLoanValue) / 1e8,
          currentValueReadable: Number(currentValue) / 1e8,
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

  const isLoading = !loanAddresses || !loanDataResults || !currentValueResults;
  const error = loanDataResults?.find(result => result.error)?.error?.message || 
                currentValueResults?.find(result => result.error)?.error?.message;

  return {
    loans,
    isLoading,
    error,
  };
} 