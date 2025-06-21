// Loan Manager ABI for price queries and loan operations
export default [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "getTokenValueUSD",
    outputs: [{ name: "usdValue", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
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
  },
  {
    inputs: [{ name: "_borrower", type: "address" }],
    name: "getBorrowerLoans",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_loan", type: "address" }],
    name: "loanToData",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "borrower", type: "address" },
          { name: "loaner", type: "address" },
          { name: "collateralValue", type: "uint256" },
          { name: "collateralEthAmount", type: "uint256" },
          { name: "initialLoanValue", type: "uint256" },
          { name: "tokens", type: "address[]" },
          { name: "amounts", type: "uint256[]" },
          { name: "isActive", type: "bool" },
          { name: "wallet", type: "address" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "wallet", type: "address" },
      { name: "tokens", type: "address[]" }
    ],
    name: "getWalletValueUSD",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "loanerGasFees",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "loan", type: "address" }],
    name: "closeLoan",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const; 