import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { cookieStorage, createStorage } from "wagmi";
import { sepolia } from "wagmi/chains";
 
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
 
if (!projectId) throw new Error("Project ID is not defined");
 
const metadata = {
  name: "Permissionless Lending",
  description: "Decentralized lending platform",
  url: "https://permissionless-lending.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Create storage that properly handles SSR
const storage = createStorage({ 
  storage: typeof window !== 'undefined' ? window.localStorage : cookieStorage 
});
 
export const config = defaultWagmiConfig({
  chains: [sepolia],
  projectId,
  metadata,
  ssr: true, // Enable SSR with proper storage handling
  storage,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});