// Registry ABI to get loan manager address and registered loaners
export default [
    {
      inputs: [],
      name: "loanManager",
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
        inputs: [],
        name: "loanCreator",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
      inputs: [],
      name: "i_loanManager",
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getAllRegisteredLoaners",
      outputs: [{ name: "", type: "address[]" }],
      stateMutability: "view",
      type: "function",
    },
    {
        "inputs": [],
        "name": "weth",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "aaveV3Depositor",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;