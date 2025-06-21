"use client";

import { useState, useEffect } from "react";
import { useReadContract, useReadContracts, useSignTypedData } from "wagmi";
import { useLoanManager } from "./useLoanManager";
import LOAN_MANAGER_ABI from "../abis/loanManager";
import WALLET_ABI from "../abis/wallet";

interface SwapParams {
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  fee: number;
  amountIn: bigint;
  amountOutMinimum: bigint;
  deadline: bigint;
  nonce: bigint;
}

export function useSwap(walletAddress: string, tokens: string[]) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const { loanManagerAddress } = useLoanManager();

  // Get current nonce from wallet contract
  const { data: currentNonce, refetch: refetchNonce } = useReadContract({
    address: walletAddress as `0x${string}`,
    abi: WALLET_ABI,
    functionName: "nonce",
    query: {
      enabled: !!walletAddress,
    },
  });

  // Sign typed data for swap intent
  const { signTypedData, data: signature, isPending: isSigningPending, reset: resetSignature } = useSignTypedData();

  // Calculate estimated amount out
  const calculateAmountOut = async (
    fromTokenIndex: number,
    toTokenIndex: number,
    fromAmount: string
  ): Promise<string> => {
    if (!fromAmount || !loanManagerAddress || !tokens[fromTokenIndex] || !tokens[toTokenIndex]) {
      return '';
    }

    setIsCalculating(true);

    try {
      // Get token prices
      const { data: tokenPrices } = await useReadContracts({
        contracts: [
          {
            address: loanManagerAddress as `0x${string}`,
            abi: LOAN_MANAGER_ABI,
            functionName: "getTokenValueUSD",
            args: [tokens[fromTokenIndex] as `0x${string}`, BigInt(10**18)], // 1 token
          },
          {
            address: loanManagerAddress as `0x${string}`,
            abi: LOAN_MANAGER_ABI,
            functionName: "getTokenValueUSD",
            args: [tokens[toTokenIndex] as `0x${string}`, BigInt(10**18)], // 1 token
          },
        ],
      });

      if (!tokenPrices) return '';

      const fromTokenPrice = tokenPrices[0]?.result as bigint;
      const toTokenPrice = tokenPrices[1]?.result as bigint;

      if (fromTokenPrice && toTokenPrice && fromTokenPrice > 0 && toTokenPrice > 0) {
        // Convert input amount to wei
        const fromAmountWei = BigInt(Math.floor(parseFloat(fromAmount) * 1e18));
        
        // Calculate USD value of input amount
        const fromAmountUsd = (fromAmountWei * fromTokenPrice) / BigInt(10**18);
        
        // Calculate output amount in target token
        const toAmountWei = (fromAmountUsd * BigInt(10**18)) / toTokenPrice;
        
        // Convert back to readable format
        const toAmountReadable = Number(toAmountWei) / 1e18;
        
        return toAmountReadable.toFixed(6);
      }
    } catch (error) {
      console.error("Error calculating amount out:", error);
    } finally {
      setIsCalculating(false);
    }

    return '';
  };

  // Execute swap intent
  const executeSwap = async (
    fromTokenIndex: number,
    toTokenIndex: number,
    fromAmount: string,
    estimatedAmountOut: string,
    slippage: string
  ) => {
    if (!fromAmount || !estimatedAmountOut || !currentNonce || !walletAddress) {
      throw new Error("Missing required data for swap");
    }

    setIsSwapping(true);

    try {
      // Calculate minimum amount out with slippage
      const estimatedAmountOutWei = BigInt(Math.floor(parseFloat(estimatedAmountOut) * 1e18));
      const slippageMultiplier = BigInt(Math.floor((100 - parseFloat(slippage)) * 100));
      const amountOutMinimum = (estimatedAmountOutWei * slippageMultiplier) / BigInt(10000);

      // Create swap parameters
      const swapParams: SwapParams = {
        tokenIn: tokens[fromTokenIndex] as `0x${string}`,
        tokenOut: tokens[toTokenIndex] as `0x${string}`,
        fee: 3000, // 0.3% fee tier (common for most pairs)
        amountIn: BigInt(Math.floor(parseFloat(fromAmount) * 1e18)),
        amountOutMinimum,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1800), // 30 minutes from now
        nonce: currentNonce as bigint,
      };

      // Sign the swap intent
      await signTypedData({
        domain: {
          name: "PermissionlessWallet",
          version: "1",
          chainId: 11155111, // Sepolia
          verifyingContract: walletAddress as `0x${string}`,
        },
        types: {
          SwapParams: [
            { name: "tokenIn", type: "address" },
            { name: "tokenOut", type: "address" },
            { name: "fee", type: "uint24" },
            { name: "amountIn", type: "uint256" },
            { name: "amountOutMinimum", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "nonce", type: "uint256" },
          ],
        },
        primaryType: "SwapParams",
        message: swapParams,
      });

      return swapParams;
    } catch (error) {
      setIsSwapping(false);
      throw error;
    }
  };

  // Send signed intent to backend
  const sendSwapIntent = async (
    swapParams: SwapParams,
    signature: `0x${string}`
  ) => {
    try {
      const response = await fetch('http://localhost:3002/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          params: {
            tokenIn: swapParams.tokenIn,
            tokenOut: swapParams.tokenOut,
            fee: swapParams.fee,
            amountIn: swapParams.amountIn.toString(),
            amountOutMinimum: swapParams.amountOutMinimum.toString(),
            deadline: swapParams.deadline.toString(),
            nonce: swapParams.nonce.toString(),
          },
          signature,
          walletAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit swap intent");
      }

      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsSwapping(false);
      resetSignature();
    }
  };

  return {
    currentNonce,
    signature,
    isCalculating,
    isSwapping,
    isSigningPending,
    calculateAmountOut,
    executeSwap,
    sendSwapIntent,
    refetchNonce,
    resetSignature,
  };
} 