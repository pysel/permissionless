# **Undercollateralized Loans | Research Scholar 1st Project**

Ruslan Akhtariev

**Introduction**

Undercollateralized loans is a holy grail of DeFi lending. Unfortunately, it is hard to implement them fully on-chain due to lack of solvency enforcement mechanisms. Current solutions usually boil down to reputation-based lending (Maple Finance), KYC (Coinbase), on-chain credit scores (Cred Protocol), or a combination of all (3jane). As a result, DeFi hasn’t yet seen the emergence of a truly permissionless system that enables on-chain undercollateralized loans.

**High Level Idea**

To solve the central problem of solvency, when a borrower requests a loan, the funds do not go immediately into the borrower's account, but rather in a multisig wallet that is controlled by a borrower and a lender that supplies the loan. To perform any transaction through this wallet, it must be co-signed by both a borrower and a lender. If, at any point in time, the value of the portfolio (wallet) falls below a certain threshold, it could be liquidated.

As a result, there is a higher barrier to becoming a lender in this system, compared to platforms like Aave or Kamino, due to the requirement to run a dedicated node software that will perform co-signing. In addition to the co-signing software, there is a need to run a liquidation monitoring node to ensure that borrowers are solvent. It is expected that there will be multiple lenders in the system, which will be ranked by an off-chain reputation system (by number of loans processed, uptime, lowest interest rates, etc). The purpose of this system is to enforce healthy competition among lenders, which would make sure that the network of lenders does not converge to monopoly or oligopoly.

[](https://lh7-rt.googleusercontent.com/docsz/AD_4nXfhYWpuOE5GkHJ8fVDjJS5zXi0vD1ubdqByQDDJwMda7VY71poiwYxRkoTtLJvTUV21ELl1uBfxaN0P_-HEozipIQ0jtPoS6uDqaMiM5mNLkPVIANeSCB4EQes1n1163dAY4pYy?key=Grgl1oUWyE5Wm2PHcyafLQ)

                                                         *Example Lenders Dashboard*

From the UX perspective, there will be limitations to what a borrower can do with the wallet. To prevent insolvency, only the actions that keep the wallet’s value within the threshold are to be permitted. Nevertheless, a wide range of DeFi activities would still be available for the borrower to allocate their funds towards, which includes allocating funds to liquidity pools (Uniswap, Curve, Aave, etc), gaining exposure to RWAs (Ondo Finance), liquid staking (Lido), etc. Essentially, undercollateralized loans like this unlock *leveraged DeFi* – any on-chain action that can be verified by a lender could be allowed by the protocol.

**Market Size and Growth Potential**

TODO

**System Design (MVP): Leveraged Portfolio**

The Minimum Viable Product of this project is the implementation of the system where borrowers can take out undercollateralized loans for the purposes of increasing their exposure towards certain assets. For example, if a lender is able to loan WETH and LINK, a borrower can make a loan worth $100 with $10 worth of collateral. The multisig wallet can thus be thought of as a 10x leveraged portfolio that a user can control.

To broader demonstrate the initial idea in the MVP, the wallet will support swaps between the tokens within the portfolio. Because a swap could be simulated against the state of the chain, it is trivial to verify the result of the swap, and thus trivial to write the co-signing logic for the lender.

MVP will also introduce basic wallet management functionality: liquidation, closure, and addition of collateral.

[](https://lh7-rt.googleusercontent.com/docsz/AD_4nXfqv4cXRR3gDCdbE9dvWm8V2whYOhWmG4bJMHLgUYuKHtoS8smKqiInVM1KBCVGxKqhmd2cZnTJvwNEkKHy4zvfk-FpP6XlRxLQO2KY9PkA8xFKiVTwGmCP4BAtqRuBQ-JcCFVD?key=Grgl1oUWyE5Wm2PHcyafLQ)

                             *Loan Managing Dashboard with Swap Functionality Enabled (V1)*

**System Design (V1): DeFi Expansion**

Next upgrades will bring more DeFi into the capabilities of the multisig wallet: LPing tokens from the wallet to Uniswap/Curve/Balancer pools, farming leveraged yield on Aave, and possibly liquid staking on Lido. This adds complexity to the liquidation logic, because now the lenders have to track not just a single multisig wallet value, but a value controlled by this wallet across supported DeFi protocols.

**System Design (V2): Delegated Lending**

To make lending more accessible to liquidity providers, individual lenders could accept delegations from the public for a small premium from the generated yield. This will lower the barrier for new liquidity to enter the protocol, simultaneously benefitting both liquidity providers and borrowers.

A good analogy is staking on Cosmos-based blockchains. Becoming a validator requires an investment into dedicated hardware, which makes it challenging to the general public to become exposed to staking rewards. However, people can delegate their tokens to existing validators for a small fee, which exposes them to staking rewards and increases the voting power of the validator.