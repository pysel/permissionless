"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "../constants";
import REGISTRY_ABI from "../abis/registry";

export function useAave() {
    const { data: aaveV3DepositorAddress, isLoading: isAaveV3DepositorAddressLoading } = useReadContract({
        address: CONTRACT_ADDRESSES.PERMISSIONLESS_REGISTRY as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: "aaveV3Depositor",
    });

    return {
        aaveV3DepositorAddress: aaveV3DepositorAddress as `0x${string}` | undefined,
        isAaveV3DepositorAddressLoading,
    };
} 