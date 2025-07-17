"use client";

import { useState, useEffect } from "react";
import { useReadContract, useReadContracts, useAccount, useSignMessage } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { getTokenInfo } from "@/lib/tokenLogos";
import { useLoanManager } from "@/lib/hooks/useLoanManager";
import LOAN_MANAGER_ABI from "@/lib/abis/loanManager";
import WALLET_ABI from "@/lib/abis/wallet";
import TransactionConfirmationModal, { TransactionConfirmationConfig } from "./TransactionConfirmationModal";

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params: any[] }) => Promise<any>;
    };
  }
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: string[];
  amounts: bigint[];
  walletAddress: string;
  borrowerAddress: string;
  onSwapSuccess?: () => void; // Optional callback for when swap is successful
}

interface SwapParams {
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  fee: number;
  amountIn: bigint;
  amountOutMinimum: bigint;
  deadline: bigint;
  nonce: bigint;
}

export default function SwapModal({ isOpen, onClose, tokens, amounts, walletAddress, borrowerAddress, onSwapSuccess }: SwapModalProps) {
  const [fromToken, setFromToken] = useState(0);
  const [toToken, setToToken] = useState(1);
  const [fromAmount, setFromAmount] = useState('');
  const [estimatedAmountOut, setEstimatedAmountOut] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapParams, setSwapParams] = useState<SwapParams | null>(null);
  
  // Transaction confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<TransactionConfirmationConfig | null>(null);

  const { loanManagerAddress } = useLoanManager();
  const { address: connectedAddress } = useAccount();
  const queryClient = useQueryClient();
  
  // Use wagmi's useSignMessage hook for proper wallet integration
  const { 
    data: signature, 
    error: signError, 
    isPending: isSigningPending, 
    signMessage, 
    reset: resetSignature 
  } = useSignMessage();

  // Reset signature and swap params when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      resetSignature();
      setSwapParams(null);
      setIsSwapping(false);
    }
  }, [isOpen, resetSignature]);

  // Also reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetSignature();
      setSwapParams(null);
      setIsSwapping(false);
      setFromAmount('');
      setEstimatedAmountOut('');
    }
  }, [isOpen, resetSignature]);

  // Check if connected wallet matches borrower
  const isAuthorized = connectedAddress?.toLowerCase() === borrowerAddress.toLowerCase();

  // Get current nonce from wallet contract
  const { data: currentNonce, isLoading: nonceLoading, error: nonceError } = useReadContract({
    address: walletAddress as `0x${string}`,
    abi: WALLET_ABI,
    functionName: "nonce",
    query: {
      enabled: !!walletAddress && isOpen,
    },
  });

  // Get swap hash from wallet contract when swap params are ready
  const { data: swapHash, isLoading: hashLoading } = useReadContract({
    address: walletAddress as `0x${string}`,
    abi: WALLET_ABI,
    functionName: "getSwapHash",
    args: swapParams ? [swapParams] : undefined,
    query: {
      enabled: !!walletAddress && !!swapParams,
    },
  });

  // Get token prices for calculation
  const { data: tokenPrices, isLoading: pricesLoading } = useReadContracts({
    contracts: [
      {
        address: loanManagerAddress as `0x${string}`,
        abi: LOAN_MANAGER_ABI,
        functionName: "getTokenValueUSD",
        args: [tokens[fromToken] as `0x${string}`, BigInt(10**18)], // 1 token
      },
      {
        address: loanManagerAddress as `0x${string}`,
        abi: LOAN_MANAGER_ABI,
        functionName: "getTokenValueUSD",
        args: [tokens[toToken] as `0x${string}`, BigInt(10**18)], // 1 token
      },
    ],
    query: {
      enabled: !!loanManagerAddress && tokens.length > 1 && isOpen,
    },
  });

  // Calculate estimated amount out when fromAmount or token selection changes
  useEffect(() => {
    if (!fromAmount || !tokenPrices || pricesLoading || !loanManagerAddress) {
      setEstimatedAmountOut('');
      return;
    }

    setIsCalculating(true);
    
    const fromTokenPrice = tokenPrices[0]?.result as bigint;
    const toTokenPrice = tokenPrices[1]?.result as bigint;
    
    if (fromTokenPrice && toTokenPrice && fromTokenPrice > 0 && toTokenPrice > 0) {
      // Convert input amount to wei
      const fromAmountWei = BigInt(Math.floor(parseFloat(fromAmount) * 1e18));
      
      // Calculate USD value of input amount
      const fromAmountUsd = (fromAmountWei * fromTokenPrice) / BigInt(10**18);
      
      // Calculate output amount in target token
      const toAmountWei = (fromAmountUsd * BigInt(10**18)) / toTokenPrice;
      
      // Convert back to readable format with proper precision
      const toAmountReadable = Number(toAmountWei) / 1e18;
      const toTokenInfo = getTokenInfo(tokens[toToken]);
      
      setEstimatedAmountOut(toAmountReadable.toFixed(toTokenInfo.precision));
    }
    
    setIsCalculating(false);
  }, [fromAmount, fromToken, toToken, tokenPrices, pricesLoading, loanManagerAddress, tokens]);

  const switchTokens = () => {
    const newFromToken = toToken;
    const newToToken = fromToken;
    setFromToken(newFromToken);
    setToToken(newToToken);
    setFromAmount(estimatedAmountOut);
    setEstimatedAmountOut('');
  };

  // Handle fromAmount input with precision validation
  const handleFromAmountChange = (value: string) => {
    if (!value) {
      setFromAmount('');
      return;
    }
    
    const fromTokenInfo = getTokenInfo(tokens[fromToken]);
    const precision = fromTokenInfo.precision;
    
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return; // Don't update if there are multiple decimal points
    }
    
    // Prevent leading zeros unless it's a decimal (0.xxx)
    if (cleanValue.length > 1 && cleanValue[0] === '0' && cleanValue[1] !== '.') {
      return;
    }
    
    // Limit decimal places based on token precision
    if (parts.length === 2 && parts[1].length > precision) {
      const truncatedValue = parts[0] + '.' + parts[1].substring(0, precision);
      setFromAmount(truncatedValue);
      return;
    }


    
    setFromAmount(cleanValue);
  };

  const handleSwap = async () => {
    // Check authorization first
    if (!isAuthorized) {
      setConfirmationConfig({
        type: 'intent',
        title: 'Wrong Wallet Connected',
        message: `You must connect with the borrower wallet (${borrowerAddress}) to perform swaps.`,
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 4000
      });
      setShowConfirmation(true);
      return;
    }



    // Better debugging for missing data
    console.log("Swap validation:", {
      fromAmount,
      estimatedAmountOut,
      currentNonce,
      walletAddress,
      nonceLoading,
      nonceError,
      connectedAddress,
      borrowerAddress,
      isAuthorized
    });
    
    if (!estimatedAmountOut) {
      setConfirmationConfig({
        type: 'intent',
        title: 'Calculation Pending',
        message: 'Estimated amount is not calculated yet. Please wait.',
        icon: 'loading',
        autoClose: true,
        autoCloseDelay: 3000
      });
      setShowConfirmation(true);
      return;
    }
    
    if (nonceLoading) {
      setConfirmationConfig({
        type: 'intent',
        title: 'Loading',
        message: 'Loading wallet nonce. Please wait a moment.',
        icon: 'loading',
        autoClose: true,
        autoCloseDelay: 3000
      });
      setShowConfirmation(true);
      return;
    }
    
    if (!currentNonce && currentNonce !== BigInt(0)) {
      setConfirmationConfig({
        type: 'intent',
        title: 'Nonce Error',
        message: 'Unable to fetch wallet nonce. Please try again.',
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 3000
      });
      setShowConfirmation(true);
      return;
    }
    
    if (!walletAddress) {
      setConfirmationConfig({
        type: 'intent',
        title: 'Wallet Missing',
        message: 'Wallet address is missing. Please try again.',
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 3000
      });
      setShowConfirmation(true);
      return;
    }

    setIsSwapping(true);

    try {
      // Calculate minimum amount out with slippage
      const estimatedAmountOutWei = BigInt(Math.floor(parseFloat(estimatedAmountOut) * 1e18));
      const slippageMultiplier = BigInt(Math.floor((100 - parseFloat(slippage)) * 100));
      const amountOutMinimum = (estimatedAmountOutWei * slippageMultiplier) / BigInt(10000);

      // Create swap parameters
      const params: SwapParams = {
        tokenIn: tokens[fromToken] as `0x${string}`,
        tokenOut: tokens[toToken] as `0x${string}`,
        fee: 3000, // 0.3% fee tier (common for most pairs)
        amountIn: BigInt(Math.floor(parseFloat(fromAmount) * 1e18)),
        amountOutMinimum,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1800), // 30 minutes from now
        nonce: currentNonce as bigint,
      };

      console.log("Setting swap params:", params);
      setSwapParams(params);

      // Wait for hash to be generated, then sign
      // This will be handled by the useEffect below
    } catch (error) {
      console.error("Error preparing swap:", error);
      setConfirmationConfig({
        type: 'intent',
        title: 'Swap Preparation Failed',
        message: 'Failed to prepare swap. Please try again.',
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 4000
      });
      setShowConfirmation(true);
      setIsSwapping(false);
    }
  };

  // Sign the hash when it's ready (only after user clicks swap button)
  useEffect(() => {
    // Only sign if user has initiated a swap and all conditions are met
    if (swapHash && !signature && !isSigningPending && swapParams && isSwapping) {
      console.log("Signing swap hash:", swapHash);
      // Convert hex hash to raw bytes for signing
      signMessage({ message: { raw: swapHash } });
    }
  }, [swapHash, signature, isSigningPending, swapParams, isSwapping, signMessage]);

  // Handle signing errors
  useEffect(() => {
    if (signError) {
      console.error("Signing failed:", signError);
      
      // Handle different error types
      const isUserRejection = signError.message.includes('rejected') || signError.message.includes('denied');
      
      setConfirmationConfig({
        type: 'intent',
        title: isUserRejection ? 'Signature Rejected' : 'Signing Failed',
        message: isUserRejection 
          ? 'Signature request was rejected. Please try again and approve the signature in your wallet.'
          : `Failed to sign swap intent: ${signError.message}. Please try again.`,
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 5000
      });
      setShowConfirmation(true);
      
      // Reset swap state on error
      setIsSwapping(false);
      setSwapParams(null);
      resetSignature();
    }
  }, [signError, resetSignature]);

  // Send signed intent to backend when signature is ready
  useEffect(() => {
    if (signature && !isSigningPending && swapParams) {
      sendSwapIntent();
    }
  }, [signature, isSigningPending, swapParams]);

  const sendSwapIntent = async () => {
    if (!signature || !swapParams) return;

    try {
      // Create the payload structure with signature type indicator
      const payload = {
        wallet_address: walletAddress,
        borrower: borrowerAddress,
        signature: signature,
        signature_type: "wagmi_personal_sign", // Indicate this uses wagmi's signMessage (personal_sign)
        swap_params: {
          token_in: swapParams.tokenIn,
          token_out: swapParams.tokenOut,
          fee: swapParams.fee,
          amount_in: swapParams.amountIn.toString(),
          amount_out_minimum: swapParams.amountOutMinimum.toString(),
          deadline: Number(swapParams.deadline),
          nonce: Number(swapParams.nonce),
        },
      };

      console.log("Sending wagmi personal_sign swap request payload:", payload);

      const response = await fetch('DEV_LENDER_URL/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Swap response:", responseData);
        
        // Show success confirmation modal
        setConfirmationConfig({
          type: 'intent',
          title: 'Swap Intent Submitted',
          message: 'Your swap intent has been successfully submitted to the lender for co-signature!',
          icon: 'swap',
          autoClose: true,
          autoCloseDelay: 4000
        });
        setShowConfirmation(true);
        
        // Call the success callback if provided
        if (onSwapSuccess) {
          onSwapSuccess();
        }
        
        // Close the modal after showing confirmation
        setTimeout(() => {
          onClose();
        }, 4000);
        
        // Handle cache invalidation separately - don't let errors here affect the success flow
        try {
          await Promise.all([
            // Invalidate all wagmi read contract queries
            queryClient.invalidateQueries({
              predicate: (query) => {
                const queryKey = query.queryKey;
                if (Array.isArray(queryKey) && queryKey.length > 0) {
                  const firstKey = queryKey[0];
                  // Target wagmi's readContract and readContracts queries
                  return firstKey === 'readContract' || firstKey === 'readContracts';
                }
                return false;
              }
            }),
            // Also invalidate any queries that might contain loan or token data
            queryClient.invalidateQueries({
              predicate: (query) => {
                const queryKey = query.queryKey;
                if (Array.isArray(queryKey)) {
                  const keyString = JSON.stringify(queryKey);
                  return (
                    keyString.includes(walletAddress) ||
                    keyString.includes(borrowerAddress) ||
                    keyString.includes('getBorrowerLoans') ||
                    keyString.includes('getTokenValueUSD') ||
                    keyString.includes('getWalletValueUSD') ||
                    keyString.includes('loanToData')
                  );
                }
                return false;
              }
            })
          ]);
        } catch (cacheError) {
          // Log cache refresh errors but don't show them to user since swap was successful
          console.warn("Cache refresh failed after successful swap (this is non-critical):", cacheError);
        }
      } else {
        const errorData = await response.text();
        console.error("Server response:", errorData);
        throw new Error(`Failed to submit swap intent: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending swap intent:", error);
      setConfirmationConfig({
        type: 'intent',
        title: 'Submission Failed',
        message: 'Failed to submit swap intent. Please try again.',
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 4000
      });
      setShowConfirmation(true);
    } finally {
      setIsSwapping(false);
      setSwapParams(null); // Reset for next swap
      resetSignature(); // Reset signature
    }
  };

  if (!isOpen) return null;

  const fromTokenInfo = getTokenInfo(tokens[fromToken]);
  const toTokenInfo = getTokenInfo(tokens[toToken]);
  const fromTokenBalance = Number(amounts[fromToken]) / 1e18;
  const toTokenBalance = Number(amounts[toToken]) / 1e18;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40" // do not add bg-black
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto animate-in slide-in-from-bottom-80 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Swap Tokens</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Swap Interface */}
          <div className="p-6 space-y-4">
            {/* From Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From</label>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <select 
                    value={fromToken} 
                    onChange={(e) => setFromToken(Number(e.target.value))}
                    className="bg-transparent text-lg font-semibold focus:outline-none"
                  >
                    {tokens.map((token, index) => {
                      const tokenInfo = getTokenInfo(token);
                      return (
                        <option key={index} value={index}>{tokenInfo.symbol}</option>
                      );
                    })}
                  </select>
                  <div className="text-right">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="bg-transparent text-right text-2xl font-bold focus:outline-none w-32"
                      min="0"
                      max={fromTokenBalance}
                      step={`0.${'0'.repeat(Math.max(0, fromTokenInfo.precision - 1))}1`}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={fromTokenInfo.logoUrl} 
                      alt={fromTokenInfo.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                                      <span className="text-sm text-gray-600">
                    Balance: {fromTokenBalance.toFixed(fromTokenInfo.precision)}
                  </span>
                  </div>
                  <button
                    onClick={() => {
                      const precision = fromTokenInfo.precision;
                      const formattedBalance = fromTokenBalance.toFixed(precision);
                      setFromAmount(formattedBalance);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={switchTokens}
                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To (estimated)</label>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <select 
                    value={toToken} 
                    onChange={(e) => setToToken(Number(e.target.value))}
                    className="bg-transparent text-lg font-semibold focus:outline-none"
                  >
                    {tokens.map((token, index) => {
                      const tokenInfo = getTokenInfo(token);
                      return (
                        <option key={index} value={index}>{tokenInfo.symbol}</option>
                      );
                    })}
                  </select>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {isCalculating ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                      ) : (
                        estimatedAmountOut || "0.0"
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img 
                    src={toTokenInfo.logoUrl} 
                    alt={toTokenInfo.symbol}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-600">
                    Balance: {toTokenBalance.toFixed(toTokenInfo.precision)}
                  </span>
                </div>
              </div>
            </div>

            {/* Slippage Settings */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <span className="text-sm font-medium text-gray-700">Slippage Tolerance</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 px-2 py-1 text-sm bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0.1"
                  max="50"
                  step="0.1"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>

            {/* Transaction Details */}
            {estimatedAmountOut && fromAmount && (
              <div className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between">
                  <span>Rate</span>
                  <span>
                    1 {fromTokenInfo.symbol} = {(parseFloat(estimatedAmountOut) / parseFloat(fromAmount)).toFixed(toTokenInfo.precision)} {toTokenInfo.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Minimum received</span>
                  <span>
                    {(parseFloat(estimatedAmountOut) * (100 - parseFloat(slippage)) / 100).toFixed(toTokenInfo.precision)} {toTokenInfo.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Network Fee</span>
                  <span>~$2.50</span>
                </div>
              </div>
            )}

            {/* Authorization Warning */}
            {!isAuthorized && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Wrong Wallet Connected</p>
                    <p className="text-xs text-yellow-700">Connect with the borrower wallet to perform swaps</p>
                  </div>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!isAuthorized || !fromAmount || parseFloat(fromAmount || '0') <= 0 || parseFloat(fromAmount || '0') > fromTokenBalance || !estimatedAmountOut || isSwapping || isSigningPending || isCalculating || nonceLoading || hashLoading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {!isAuthorized ? (
                "Connect Borrower Wallet"
              ) : isSigningPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Waiting for Signature...
                </div>
              ) : isSwapping && !isSigningPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {hashLoading ? "Getting Hash..." : "Processing..."}
                </div>
              ) : nonceLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Loading wallet...
                </div>
              ) : (
                "Sign Swap Intent"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Confirmation Modal */}
      {confirmationConfig && (
        <TransactionConfirmationModal
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            setConfirmationConfig(null);
          }}
          config={confirmationConfig}
        />
      )}
    </>
  );
} 