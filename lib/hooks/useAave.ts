"use client";

import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { CONTRACT_ADDRESSES } from "../constants";
import REGISTRY_ABI from "../abis/registry";
import AAVE_V3_DEPOSITOR_ABI from "../abis/aave";
import AAVE_V3_POOL_ABI from "../abis/aavePool";
import ERC20_ABI from "../abis/erc20";

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

export function useAaveTokens(walletAddress: string, tokens: string[]) {
    const { chain } = useAccount();
    const { aaveV3DepositorAddress } = useAave();

    const { data: poolAddressResult, isLoading: isPoolAddressLoading } = useReadContract({
        address: aaveV3DepositorAddress,
        abi: AAVE_V3_DEPOSITOR_ABI,
        functionName: "networkConfigs",
        args: [BigInt(chain?.id || 1)],
        query: {
            enabled: !!aaveV3DepositorAddress && !!chain,
        },
    });

    const poolAddress = poolAddressResult ? (poolAddressResult as any)[0] : undefined;

    const reserveDataContracts = tokens.map(token => ({
        address: poolAddress,
        abi: AAVE_V3_POOL_ABI,
        functionName: "getReserveData",
        args: [token],
    }));

    const { data: reserveDataResults, isLoading: isReserveDataLoading } = useReadContracts({
        contracts: reserveDataContracts as any,
        query: {
            enabled: !!poolAddress && tokens.length > 0,
        },
    });

    const aTokenAddresses = reserveDataResults?.map(result => (result.result as any)?.aTokenAddress).filter(Boolean) || [];

    const aTokenBalanceContracts = aTokenAddresses.map(aTokenAddress => ({
        address: aTokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress],
    }));

    const { data: aTokenBalances, isLoading: isATokenBalancesLoading } = useReadContracts({
        contracts: aTokenBalanceContracts as any,
        query: {
            enabled: aTokenAddresses.length > 0,
        },
    });

    const aaveTokens = aTokenBalances?.map((balanceResult, index) => {
        const balance = balanceResult.result as bigint;
        if (balance > BigInt(0)) {
            const aTokenAddress = aTokenAddresses[index];
            const originalToken = tokens.find((token, tokenIndex) => {
                const reserveData: any = reserveDataResults?.[tokenIndex]?.result;
                return reserveData?.aTokenAddress === aTokenAddress;
            });

            return {
                aTokenAddress,
                underlyingAsset: originalToken,
                balance,
            };
        }
        return null;
    }).filter(Boolean);


    return {
        aaveTokens,
        isLoading: isPoolAddressLoading || isReserveDataLoading || isATokenBalancesLoading,
    };
} 