# Project Structure

```
.
├── .cursor
│   └── rules
│       ├── guidelines.txt
│       ├── project-description.md
│       ├── structure.md
│       └── update-structure.sh
├── .gitignore
├── Makefile
├── README.md
├── app
│   ├── borrow
│   │   └── page.tsx
│   ├── components
│   │   ├── ClientOnly.tsx
│   │   ├── ConnectWalletPrompt.tsx
│   │   ├── Dashboard.tsx
│   │   ├── LenderCard.tsx
│   │   ├── QuoteModal.tsx
│   │   ├── SupplyModal.tsx
│   │   ├── SwapModal.tsx
│   │   ├── TransactionConfirmationModal.tsx
│   │   └── WalletConnect.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── lender
│   │   └── [address]
│   │       └── page.tsx
│   ├── manage
│   │   ├── [address]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   └── page.tsx
├── interfaces
│   ├── IAaveV3Depositor.sol
│   ├── IAaveV3Pool.sol
│   ├── ILoanCloser.sol
│   ├── ILoanCreator.sol
│   ├── ILoanLiquidator.sol
│   ├── ILoanManager.sol
│   ├── IPermissionlessRegistry.sol
│   ├── ISwapRouter.sol
│   ├── IWallet.sol
│   └── Initializable.sol
├── lib
│   ├── abis
│   │   ├── aave.ts
│   │   ├── erc20.ts
│   │   ├── loanManager.ts
│   │   ├── loaner.ts
│   │   ├── registry.ts
│   │   └── wallet.ts
│   ├── config.ts
│   ├── constants.ts
│   ├── hooks
│   │   ├── useAave.ts
│   │   ├── useLenders.ts
│   │   ├── useLoanCreator.ts
│   │   ├── useLoanManager.ts
│   │   ├── useLoaners.ts
│   │   └── useSwap.ts
│   ├── tokenLogos.ts
│   ├── utils
│   │   └── format.ts
│   ├── wagmi-provider.tsx
│   └── wallet-modal.tsx
├── next.config.js
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── aave-logo.png
│   ├── connect.png
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── sol-interfaces
│   ├── IAaveV3Depositor.sol
│   ├── IAaveV3Pool.sol
│   ├── ILoanCloser.sol
│   ├── ILoanCreator.sol
│   ├── ILoanLiquidator.sol
│   ├── ILoanManager.sol
│   ├── IPermissionlessRegistry.sol
│   ├── ISwapRouter.sol
│   ├── IWallet.sol
│   └── Initializable.sol
└── tsconfig.json

17 directories, 75 files
```
