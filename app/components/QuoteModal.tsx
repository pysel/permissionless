"use client";

import { useTokenPrice } from "@/lib/hooks/useLoanManager";
import { getTokenInfo, TOKEN_ADDRESSES } from "@/lib/tokenLogos";
import { formatUnits } from "viem";
import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { useLoanManager } from "@/lib/hooks/useLoanManager";
import ERC20_ABI from "@/lib/abis/erc20";
import { useLoanCreator } from "@/lib/hooks/useLoanCreator";
import TransactionConfirmationModal, { TransactionConfirmationConfig } from "./TransactionConfirmationModal";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  collateralUsdAmount: number;
  selectedTokens: { [key: string]: string };
  onConfirm: () => void;
  lenderAddress: string;
}

// Loading spinner component
function LoadingSpinner({ size = "w-4 h-4" }: { size?: string }) {
  return (
    <div className={`${size} animate-spin`}>
      <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export default function QuoteModal({
  isOpen,
  onClose,
  collateralUsdAmount,
  selectedTokens,
  onConfirm,
  lenderAddress,
}: QuoteModalProps) {
  const [refetchKey, setRefetchKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalStep, setApprovalStep] = useState<'idle' | 'approving' | 'approved' | 'creating'>('idle');
  
  // Transaction confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<TransactionConfirmationConfig | null>(null);
  
  const { loanManagerAddress } = useLoanManager();
  const { loanCreatorAddress } = useLoanCreator();
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash,
    });

  // Check current WETH allowance for the loan creator
  const { data: currentAllowance, isLoading: allowanceLoading, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESSES.WETH as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [userAddress as `0x${string}`, loanCreatorAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && !!loanCreatorAddress && isOpen,
    },
  });

  // Get active tokens with their USD amounts - calculate this early
  const activeTokens = Object.entries(selectedTokens).filter(([_, amount]) => amount && parseFloat(amount) > 0);

  // Always call useTokenPrice for ETH (collateral) - unconditional
  const ethTokenInfo = useTokenPrice(TOKEN_ADDRESSES.WETH, collateralUsdAmount || 0, refetchKey);

  // Always call useTokenPrice for up to 10 tokens (reasonable maximum) to maintain consistent hook calls
  // Use active tokens for the first N slots, dummy values for the rest
  const token1Info = useTokenPrice(
    activeTokens[0]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[0] ? parseFloat(activeTokens[0][1]) : 0, 
    refetchKey
  );
  const token2Info = useTokenPrice(
    activeTokens[1]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[1] ? parseFloat(activeTokens[1][1]) : 0, 
    refetchKey
  );
  const token3Info = useTokenPrice(
    activeTokens[2]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[2] ? parseFloat(activeTokens[2][1]) : 0, 
    refetchKey
  );
  const token4Info = useTokenPrice(
    activeTokens[3]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[3] ? parseFloat(activeTokens[3][1]) : 0, 
    refetchKey
  );
  const token5Info = useTokenPrice(
    activeTokens[4]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[4] ? parseFloat(activeTokens[4][1]) : 0, 
    refetchKey
  );
  const token6Info = useTokenPrice(
    activeTokens[5]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[5] ? parseFloat(activeTokens[5][1]) : 0, 
    refetchKey
  );
  const token7Info = useTokenPrice(
    activeTokens[6]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[6] ? parseFloat(activeTokens[6][1]) : 0, 
    refetchKey
  );
  const token8Info = useTokenPrice(
    activeTokens[7]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[7] ? parseFloat(activeTokens[7][1]) : 0, 
    refetchKey
  );
  const token9Info = useTokenPrice(
    activeTokens[8]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[8] ? parseFloat(activeTokens[8][1]) : 0, 
    refetchKey
  );
  const token10Info = useTokenPrice(
    activeTokens[9]?.[0] || TOKEN_ADDRESSES.WETH, 
    activeTokens[9] ? parseFloat(activeTokens[9][1]) : 0, 
    refetchKey
  );

  // Calculate required WETH amount for collateral
  const requiredWethAmount = ethTokenInfo.tokenAmount || BigInt(0);

  // Check if approval is needed
  const needsApproval = !allowanceLoading && currentAllowance !== undefined && 
                       requiredWethAmount > 0 && 
                       (currentAllowance as bigint) < requiredWethAmount;

  // Force refetch when modal opens
  useEffect(() => {
    if (isOpen) {
      setRefetchKey(prev => prev + 1);
      // Also refetch allowance
      refetchAllowance();
    }
  }, [isOpen, refetchAllowance]);

  // Set initial approval step based on allowance
  useEffect(() => {
    if (!allowanceLoading && currentAllowance !== undefined && requiredWethAmount > 0) {
      if ((currentAllowance as bigint) >= requiredWethAmount) {
        // Already approved, skip to ready state
        setApprovalStep('approved');
      } else {
        // Need approval
        setApprovalStep('idle');
      }
    }
  }, [allowanceLoading, currentAllowance, requiredWethAmount]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && hash) {
      if (approvalStep === 'approving') {
        // Approval confirmed, show confirmation modal
        setConfirmationConfig({
          type: 'ethereum',
          title: 'Approval Confirmed',
          message: 'Your WETH approval has been confirmed. You can now proceed with borrowing.',
          txHash: hash,
          explorerUrl: 'https://etherscan.io',
          icon: 'approve',
          autoClose: true,
          autoCloseDelay: 3000
        });
        setShowConfirmation(true);
        
        // Update state
        refetchAllowance();
        setApprovalStep('approved');
        setIsSubmitting(false);
      } else if (approvalStep === 'creating') {
        // Loan creation confirmed, show confirmation modal
        setConfirmationConfig({
          type: 'ethereum',
          title: 'Loan Created Successfully',
          message: 'Your loan has been successfully created! You can now manage it from the dashboard.',
          txHash: hash,
          explorerUrl: 'https://etherscan.io',
          icon: 'borrow',
          autoClose: false
        });
        setShowConfirmation(true);
        
        // Update state and close after showing confirmation
        setIsSubmitting(false);
        setApprovalStep('idle');
        
        // Close original modal after short delay to let user see confirmation
        setTimeout(() => {
          onConfirm();
          onClose();
        }, 4000);
      }
    }
  }, [isConfirmed, hash, approvalStep, onConfirm, onClose, refetchAllowance]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      
      // Show error confirmation modal
      setConfirmationConfig({
        type: 'ethereum',
        title: 'Transaction Failed',
        message: `Transaction failed: ${error.message}`,
        icon: 'error',
        autoClose: false
      });
      setShowConfirmation(true);
      
      setIsSubmitting(false);
      setApprovalStep('idle');
    }
  }, [error]);

  if (!isOpen) return null;

  const formatTokenAmount = (amount: bigint, decimals: number = 18) => {
    const formatted = formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    if (num < 0.001) return num.toExponential(3);
    if (num < 1) return num.toFixed(6);
    if (num < 100) return num.toFixed(4);
    return num.toFixed(2);
  };

  const handleConfirm = async () => {
    if (!loanManagerAddress) {
      setConfirmationConfig({
        type: 'ethereum',
        title: 'Service Unavailable',
        message: 'Loan manager is not available. Please try again later.',
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 3000
      });
      setShowConfirmation(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (activeTokens.length === 0) {
        setConfirmationConfig({
          type: 'ethereum',
          title: 'No Tokens Selected',
          message: 'Please select at least one token to borrow.',
          icon: 'error',
          autoClose: true,
          autoCloseDelay: 3000
        });
        setShowConfirmation(true);
        setIsSubmitting(false);
        return;
      }

      if (approvalStep === 'idle' && needsApproval) {
        // Step 1: Approve WETH spending (only if needed)
        setApprovalStep('approving');
        
        writeContract({
          address: TOKEN_ADDRESSES.WETH as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [loanCreatorAddress as `0x${string}`, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")], // Max uint256
        });
        
      } else if (approvalStep === 'approved' || (approvalStep === 'idle' && !needsApproval)) {
        // Step 2: Create the loan
        setApprovalStep('creating');
        
        // Collect token addresses and amounts using the precomputed hook data
        const tokenAddresses: string[] = [];
        const tokenAmounts: bigint[] = [];
        
        const tokenInfos = [token1Info, token2Info, token3Info, token4Info, token5Info, token6Info, token7Info, token8Info, token9Info, token10Info];
        
        for (let i = 0; i < activeTokens.length; i++) {
          const [tokenAddress] = activeTokens[i];
          const tokenPriceInfo = tokenInfos[i];
          
          if (tokenPriceInfo.tokenAmount && tokenPriceInfo.tokenAmount > 0) {
            tokenAddresses.push(tokenAddress);
            tokenAmounts.push(tokenPriceInfo.tokenAmount);
          } else {
            setConfirmationConfig({
              type: 'ethereum',
              title: 'Calculation Error',
              message: `Failed to calculate amount for token ${tokenAddress}. Please try again.`,
              icon: 'error',
              autoClose: true,
              autoCloseDelay: 4000
            });
            setShowConfirmation(true);
            setIsSubmitting(false);
            setApprovalStep('idle');
            return;
          }
        }

        // Create the loan request
        const loanRequest = {
          loaner: lenderAddress as `0x${string}`,
          tokens: tokenAddresses as `0x${string}`[],
          amounts: tokenAmounts,
          collateralValue: BigInt(Math.floor(collateralUsdAmount * 100000000)), // Convert to 8 decimals
        };

        // Call createLoan
        writeContract({
          address: loanManagerAddress as `0x${string}`,
          abi: [{
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
          }],
          functionName: "createLoan",
          args: [loanRequest],
        });
      }

    } catch (error) {
      console.error("Error in transaction:", error);
      setConfirmationConfig({
        type: 'ethereum',
        title: 'Transaction Error',
        message: 'Transaction failed. Please try again.',
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 4000
      });
      setShowConfirmation(true);
      setIsSubmitting(false);
      setApprovalStep('idle');
    }
  };

  // Get token info for active tokens
  const getTokenInfoForActiveToken = (index: number) => {
    const tokenInfos = [token1Info, token2Info, token3Info, token4Info, token5Info, token6Info, token7Info, token8Info, token9Info, token10Info];
    return tokenInfos[index];
  };

  return (
    <>
      {/* Backdrop with subtle dimming */}
      <div 
        className="fixed inset-0 bg-opacity-60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm pointer-events-auto max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-80 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-black">Quote</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Collateral Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-black">Pay</h3>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={getTokenInfo(TOKEN_ADDRESSES.WETH).logoUrl}
                      alt="WETH"
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-black font-semibold">
                        {ethTokenInfo.isLoading ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <LoadingSpinner size="w-4 h-4" />
                            <span>WETH</span>
                          </div>
                        ) : (
                          "~" + formatTokenAmount(ethTokenInfo.tokenAmount) + " WETH"
                        )}
                      </div>
                      <div className="text-gray-500 text-sm">${collateralUsdAmount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center py-0">
                <div className="bg-gray-100 rounded-full p-1">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Borrow Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-black">Receive</h3>
                <div className="space-y-2">
                  {activeTokens.map(([tokenAddress, usdAmountStr], index) => {
                    const usdAmount = parseFloat(usdAmountStr);
                    const tokenPriceInfo = getTokenInfoForActiveToken(index);
                    const tokenInfo = getTokenInfo(tokenAddress);
                    
                    return (
                      <div key={tokenAddress} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <img
                            src={tokenInfo.logoUrl}
                            alt={tokenInfo.symbol}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-black font-semibold">
                              {tokenPriceInfo.isLoading ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <LoadingSpinner size="w-4 h-4" />
                                  <span>{tokenInfo.symbol}</span>
                                </div>
                              ) : (
                                "~" + formatTokenAmount(tokenPriceInfo.tokenAmount) + " " + tokenInfo.symbol
                              )}
                            </div>
                            <div className="text-gray-500 text-sm">${usdAmount.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fee Information */}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    Network fee
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span className="text-black font-medium">~$TODO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with button */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || isPending || isConfirming}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              {isSubmitting || isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                  {approvalStep === 'approving' ? "Approving WETH..." : 
                   approvalStep === 'creating' ? "Creating Loan..." : "Processing..."}
                </div>
              ) : isConfirming ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                  {approvalStep === 'approving' ? "Confirming Approval..." : "Confirming Loan..."}
                </div>
              ) : approvalStep === 'approved' ? (
                "Submit"
              ) : needsApproval ? (
                "Approve WETH"
              ) : allowanceLoading ? (
                ""
              ) : (
                "Submit"
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