import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "../constants";
import REGISTRY_ABI from "../abis/registry";

export function useLoanCreator() {
    // Get loan manager address from registry
    const { data: loanCreatorAddress } = useReadContract({
      address: CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: "loanCreator",
      query: {
        enabled: !!CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY,
      },
    });
  
    return {
      loanCreatorAddress: loanCreatorAddress as string,
    };
  }