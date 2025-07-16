"use client";

import { useEffect, useState } from "react";

export interface TransactionConfirmationConfig {
  type: 'ethereum' | 'intent'; // For Ethereum transactions vs off-chain intents
  title: string;
  message: string;
  txHash?: string; // For Ethereum transactions
  explorerUrl?: string; // For viewing transaction on explorer
  icon?: 'success' | 'loading' | 'error' | 'swap' | 'borrow' | 'approve';
  autoClose?: boolean; // Whether to auto-close after delay
  autoCloseDelay?: number; // Delay in milliseconds before auto-close
}

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TransactionConfirmationConfig;
}

// Icon components for different transaction types
const TransactionIcon = ({ type }: { type: TransactionConfirmationConfig['icon'] }) => {
  const iconClasses = "w-16 h-16 mx-auto mb-4";
  
  switch (type) {
    case 'success':
      return (
        <div className={`${iconClasses} text-green-500`}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" className="opacity-25" strokeWidth={2} />
            <path 
              className="opacity-75" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4" 
            />
          </svg>
        </div>
      );
    case 'loading':
      return (
        <div className={`${iconClasses} text-blue-500`}>
          <div className="w-full h-full animate-spin">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="2"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      );
    case 'error':
      return (
        <div className={`${iconClasses} text-red-500`}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" className="opacity-25" strokeWidth={2} />
            <path 
              className="opacity-75" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </div>
      );
    case 'swap':
      return (
        <div className={`${iconClasses} text-purple-500`}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" className="opacity-25" strokeWidth={2} />
            <path 
              className="opacity-75" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" 
            />
          </svg>
        </div>
      );
    case 'borrow':
      return (
        <div className={`${iconClasses} text-blue-500`}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" className="opacity-25" strokeWidth={2} />
            <path 
              className="opacity-75" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" 
            />
          </svg>
        </div>
      );
    case 'approve':
      return (
        <div className={`${iconClasses} text-orange-500`}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" className="opacity-25" strokeWidth={2} />
            <path 
              className="opacity-75" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4" 
            />
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${iconClasses} text-gray-500`}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
        </div>
      );
  }
};

export default function TransactionConfirmationModal({ 
  isOpen, 
  onClose, 
  config 
}: TransactionConfirmationModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Handle auto-close functionality
  useEffect(() => {
    if (isOpen && config.autoClose && config.autoCloseDelay) {
      const timer = setTimeout(() => {
        onClose();
      }, config.autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, config.autoClose, config.autoCloseDelay, onClose]);

  // Handle modal visibility for animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleExplorerClick = () => {
    if (config.txHash && config.explorerUrl) {
      window.open(`${config.explorerUrl}/tx/${config.txHash}`, '_blank');
    }
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <div 
        className={`fixed inset-0 bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300 ${ // do not touch bg-black here
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div 
          className={`bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all duration-300 ${
            isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">{config.title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Icon */}
            <TransactionIcon type={config.icon} />

            {/* Message */}
            <div className="mb-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                {config.message}
              </p>
            </div>

            {/* Transaction Hash (for Ethereum transactions) */}
            {config.type === 'ethereum' && config.txHash && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Transaction Hash</p>
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {config.txHash.slice(0, 10)}...{config.txHash.slice(-8)}
                  </code>
                  <button
                    onClick={handleExplorerClick}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    View on Explorer
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                {config.autoClose ? 'Dismiss' : 'Close'}
              </button>
              {config.type === 'ethereum' && config.txHash && config.explorerUrl && (
                <button
                  onClick={handleExplorerClick}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  View Transaction
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 