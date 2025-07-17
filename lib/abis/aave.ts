const AAVE_V3_DEPOSITOR_ABI = [
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "asset",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct IAaveV3Depositor.AaveSupplyParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "getAaveSupplyHash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "asset",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct IAaveV3Depositor.AaveWithdrawParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "getAaveWithdrawHash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "wallet",
                "type": "address"
            }
        ],
        "name": "getWalletAaveValueUSD",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "totalValueUSD",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "wallet",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "asset",
                "type": "address"
            }
        ],
        "name": "getWalletAssetValueUSD",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "valueUSD",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "wallet",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "address[]",
                "name": "assets",
                "type": "address[]"
            }
        ],
        "name": "liquidateAaveDeposits",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "asset",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct IAaveV3Depositor.AaveSupplyParams",
                "name": "params",
                "type": "tuple"
            },
            {
                "internalType": "bytes",
                "name": "borrowerSig",
                "type": "bytes"
            }
        ],
        "name": "supplyAaveV3",
        "outputs": [
            {
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "asset",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct IAaveV3Depositor.AaveWithdrawParams",
                "name": "params",
                "type": "tuple"
            },
            {
                "internalType": "bytes",
                "name": "borrowerSig",
                "type": "bytes"
            }
        ],
        "name": "withdrawAaveV3",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "amountWithdrawn",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "chainId",
                "type": "uint256"
            }
        ],
        "name": "networkConfigs",
        "outputs": [
            {
                "internalType": "address",
                "name": "poolAddress",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export default AAVE_V3_DEPOSITOR_ABI; 