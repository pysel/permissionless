"use client";

import { useState, useEffect } from "react";
import { useReadContract, useAccount, useSignMessage } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { getTokenInfo } from "@/lib/tokenLogos";
import WALLET_ABI from "@/lib/abis/wallet";
import AAVE_V3_DEPOSITOR_ABI from "@/lib/abis/aave";
import TransactionConfirmationModal, { TransactionConfirmationConfig } from "./TransactionConfirmationModal";
import { useAave } from "@/lib/hooks/useAave";
import { DEV_LENDER_URL } from "@/lib/constants";

interface SupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAddress: string;
  tokenBalance: bigint;
  walletAddress: string;
  borrowerAddress: string;
  onSupplySuccess?: () => void;
}

interface AaveSupplyParams {
  asset: `0x${string}`;
  amount: bigint;
  deadline: bigint;
  nonce: bigint;
}

export default function SupplyModal({
  isOpen,
  onClose,
  tokenAddress,
  tokenBalance,
  walletAddress,
  borrowerAddress,
  onSupplySuccess,
}: SupplyModalProps) {
  const [amount, setAmount] = useState('');
  const [isSupplying, setIsSupplying] = useState(false);
  const [supplyParams, setSupplyParams] = useState<AaveSupplyParams | null>(null);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<TransactionConfirmationConfig | null>(null);

  const { aaveV3DepositorAddress } = useAave();
  const { address: connectedAddress } = useAccount();
  const queryClient = useQueryClient();

  const {
    data: signature,
    error: signError,
    isPending: isSigningPending,
    signMessage,
    reset: resetSignature,
  } = useSignMessage();

  useEffect(() => {
    if (isOpen) {
      resetSignature();
      setSupplyParams(null);
      setIsSupplying(false);
    }
  }, [isOpen, resetSignature]);

  useEffect(() => {
    if (!isOpen) {
      resetSignature();
      setSupplyParams(null);
      setIsSupplying(false);
      setAmount('');
    }
  }, [isOpen, resetSignature]);

  const isAuthorized = connectedAddress?.toLowerCase() === borrowerAddress.toLowerCase();

  const { data: currentNonce, isLoading: nonceLoading } = useReadContract({
    address: walletAddress as `0x${string}`,
    abi: WALLET_ABI,
    functionName: "nonce",
    query: {
      enabled: !!walletAddress && isOpen,
    },
  });

  const { data: supplyHash, isLoading: hashLoading } = useReadContract({
    address: aaveV3DepositorAddress,
    abi: AAVE_V3_DEPOSITOR_ABI,
    functionName: "getAaveSupplyHash",
    args: supplyParams ? [supplyParams] : undefined,
    query: {
      enabled: !!aaveV3DepositorAddress && !!supplyParams,
    },
  });

  const handleAmountChange = (value: string) => {
    if (!value) {
      setAmount('');
      return;
    }
    const tokenInfo = getTokenInfo(tokenAddress);
    const precision = tokenInfo.precision;
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;
    if (parts.length === 2 && parts[1].length > precision) {
      const truncatedValue = parts[0] + '.' + parts[1].substring(0, precision);
      setAmount(truncatedValue);
      return;
    }
    setAmount(cleanValue);
  };

  const handleSupply = async () => {
    if (!isAuthorized) {
      setConfirmationConfig({
        type: 'intent',
        title: 'Wrong Wallet Connected',
        message: `You must connect with the borrower wallet (${borrowerAddress}) to perform this action.`,
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 4000,
      });
      setShowConfirmation(true);
      return;
    }

    if (nonceLoading) return;
    if (!currentNonce && currentNonce !== BigInt(0)) return;

    setIsSupplying(true);

    try {
      const params: AaveSupplyParams = {
        asset: tokenAddress as `0x${string}`,
        amount: BigInt(Math.floor(parseFloat(amount) * 1e18)),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1800), // 30 minutes
        nonce: currentNonce as bigint,
      };
      setSupplyParams(params);
    } catch (error) {
      console.error("Error preparing supply:", error);
      setIsSupplying(false);
    }
  };

  useEffect(() => {
    if (supplyHash && !signature && !isSigningPending && supplyParams && isSupplying) {
      signMessage({ message: { raw: supplyHash } });
    }
  }, [supplyHash, signature, isSigningPending, supplyParams, isSupplying, signMessage]);

  useEffect(() => {
    if (signError) {
      console.error("Signing failed:", signError);
      const isUserRejection = signError.message.includes('rejected') || signError.message.includes('denied');
      setConfirmationConfig({
        type: 'intent',
        title: isUserRejection ? 'Signature Rejected' : 'Signing Failed',
        message: isUserRejection
          ? 'Signature request was rejected. Please try again and approve the signature in your wallet.'
          : `Failed to sign supply intent: ${signError.message}. Please try again.`,
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 5000,
      });
      setShowConfirmation(true);
      setIsSupplying(false);
      setSupplyParams(null);
      resetSignature();
    }
  }, [signError, resetSignature]);

  useEffect(() => {
    if (signature && !isSigningPending && supplyParams) {
      sendSupplyIntent();
    }
  }, [signature, isSigningPending, supplyParams]);

  const sendSupplyIntent = async () => {
    if (!signature || !supplyParams) return;

    try {
      const payload = {
        wallet_address: walletAddress,
        borrower: borrowerAddress,
        signature: signature,
        supply_params: {
          asset: supplyParams.asset,
          amount: supplyParams.amount.toString(),
          deadline: Number(supplyParams.deadline),
          nonce: Number(supplyParams.nonce),
        },
      };

      const response = await fetch(`${DEV_LENDER_URL}/aave/supply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setConfirmationConfig({
          type: 'intent',
          title: 'Supply Intent Submitted',
          message: 'Your supply intent has been successfully submitted to the lender for co-signature!',
          icon: 'success',
          autoClose: true,
          autoCloseDelay: 4000,
        });
        setShowConfirmation(true);

        if (onSupplySuccess) {
          onSupplySuccess();
        }

        setTimeout(() => {
          onClose();
        }, 4000);

        queryClient.invalidateQueries();

      } else {
        const errorData = await response.text();
        throw new Error(`Failed to submit supply intent: ${errorData}`);
      }
    } catch (error) {
      console.error("Error sending supply intent:", error);
      setConfirmationConfig({
        type: 'intent',
        title: 'Submission Failed',
        message: `Failed to submit supply intent. Please try again. ${error}`,
        icon: 'error',
        autoClose: true,
        autoCloseDelay: 4000,
      });
      setShowConfirmation(true);
    } finally {
      setIsSupplying(false);
      setSupplyParams(null);
      resetSignature();
    }
  };

  if (!isOpen) return null;

  const tokenInfo = getTokenInfo(tokenAddress);
  const balance = Number(tokenBalance) / 1e18;

  return (
    <>
      <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto animate-in slide-in-from-bottom-80 fade-in duration-300">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Supply to Aave</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Token</label>
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                <img src={tokenInfo.logoUrl} alt={tokenInfo.symbol} className="w-10 h-10 rounded-full" />
                <div>
                  <h4 className="font-bold text-lg">{tokenInfo.symbol}</h4>
                  <p className="text-xs text-gray-500 font-mono">{tokenAddress}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-left text-2xl font-bold focus:outline-none w-full"
                    min="0"
                    max={balance}
                  />
                  <div className="flex items-center gap-2">
                     <span className="text-sm text-gray-600">
                        Balance: {balance.toFixed(tokenInfo.precision)}
                     </span>
                     <button
                        onClick={() => {
                          const formattedBalance = balance.toFixed(tokenInfo.precision);
                          setAmount(formattedBalance);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        MAX
                      </button>
                  </div>
                </div>
              </div>
            </div>
            {!isAuthorized && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm font-medium text-yellow-800">Wrong Wallet Connected</p>
              </div>
            )}
            <button
              onClick={handleSupply}
              disabled={!isAuthorized || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || isSupplying || isSigningPending || hashLoading || nonceLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition-opacity disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSupplying ? 'Supplying...' : 'Supply'}
            </button>
          </div>
        </div>
      </div>
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