// Contract addresses - Update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  PERMISSIONLESS_REGISTRY: process.env.NEXT_PUBLIC_PERMISSIONLESS_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000",
} as const;

// Network configuration
export const SUPPORTED_NETWORKS = {
  ETHEREUM: 1,
  SEPOLIA: 11155111,
} as const; 