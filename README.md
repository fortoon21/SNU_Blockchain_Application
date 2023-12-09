# LEVER-EZ: Empowering Degens in Multichain DeFi

## Overview

In the dynamic realm of decentralized finance (DeFi), the quest for alpha yields across multiple blockchains has never been more challenging and rewarding. Enter LEVER-EZ, a pioneering project tailored for decentralized enthusiasts, affectionately known as "degens." In the ever-expanding DeFi landscape, degens navigate diverse chains, seeking opportunities in Decentralized Exchanges (DEXs), Lending Protocols, and Blockchains. LEVER-EZ is designed to empower these degens by providing an automated solution for flashloan looping, optimizing gas consumption and unlocking the potential for alpha yields within limited budgets.

## Target Audience

LEVER-EZ is crafted for degens who actively pursue airdrop opportunities and yield farming strategies. In the midst of bullish market conditions, these degens are strategically positioned to leverage their assets effectively, identifying hidden opportunities and maximizing returns.

## Prerequisites

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Current LTS Node.js version](https://nodejs.org/en/about/releases/)

## Getting Started

1. Install packages

```
npm install
```

2. Compile contracts

```
npx hardhat compile
```

## Key Features

LEVER-EZ offers a comprehensive suite of features, including:

- **Flashloan Looping:** Automated and optimized for gas consumption, allowing degens to navigate the DeFi landscape efficiently.
- **Collateral Status Insights:** Provides a real-time view of collateral statuses across various DeFi lending protocols.
- **On-Chain Valuations:** Utilizes Chainlink Data to present on-chain valuations of assets within each blockchain.
- **Black Swan Event Management:** Enables users to swiftly close all positions across multiple chains in unforeseen events, mitigating risks effectively.

## Functionality

The LEVER-EZ project serves as a practical guide, showcasing how users can interact with leading lending protocols such as Compound V2, Aave V2, and Aave V3. Users can seamlessly leverage, deleverage, supply, withdraw, and manage their assets, ensuring a strategic approach to decentralized finance.

## Chainlink CCIP Integration

At the heart of LEVER-EZ is the **Chainlink Cross-Chain Interoperability Protocol (CCIP)**, a powerful tool facilitating seamless communication across diverse blockchains.

![Basic Architecture](./img/basic-architecture.png)

In critical scenarios, mirroring the urgency seen in traditional markets, users can leverage functionalities similar to "close all positions" buttons found in centralized exchange derivatives/margin markets.

![LEVER-EZ Close All](./img/lever_ez_close_all.png)

The Leverager contract within LEVER-EZ inherits both CCIP and CCIP receiver contracts. With Chainlink CCIP integration, users gain unparalleled capabilities:

- **Supply and Borrow:** Swiftly supply and borrow tokens within lending protocols.
- **Leveraged Yielding Positions:** Open positions combining supply and borrow operations for optimized yields.
- **Token Management:** Seamlessly withdraw or borrow tokens as per strategic requirements.
- **Position Closure:** Close leveraged yielding positions partially or entirely, managing risk dynamically.
- **Multichain Position Closure:** Execute a single transaction to close all positions across multichain lending protocols in the same address.

## Usage

We modified the example repository from Chainlink [`ccip-cross-chain-nft`](https://github.com/smartcontractkit/ccip-cross-chain-nft/tree/main) and remained the basic usage docs.

We are going to use the [`@chainlink/env-enc`](https://www.npmjs.com/package/@chainlink/env-enc) package for extra security. It encrypts sensitive data instead of storing them as plain text in the `.env` file, by creating a new, `.env.enc` file. Although it's not recommended to push this file online, if that accidentally happens your secrets will still be encrypted.

1. Set a password for encrypting and decrypting the environment variable file. You can change it later by typing the same command.

```shell
npx env-enc set-pw
```

2. Now set the following environment variables: `PRIVATE_KEY`, Source Blockchain RPC URL, Destination Blockchain RPC URL. You can see available options in the `.env.example` file:

```shell
ETHEREUM_SEPOLIA_RPC_URL=
OPTIMISM_GOERLI_RPC_URL=
ARBITRUM_TESTNET_RPC_URL=
AVALANCHE_FUJI_RPC_URL=
POLYGON_MUMBAI_RPC_URL=
```

To set these variables, type the following command and follow the instructions in the terminal:

```shell
npx env-enc set
```

After you are done, the `.env.enc` file will be automatically generated.

If you want to validate your inputs you can always run the next command:

```shell
npx env-enc view
```

### Faucet

Quicknode provides **0.1 ETHSepolia / 1 Mumbai Matic / 0.2 Fuji Avalanche per day** if you have the accounts or make the accounts.

Infura provides **0.5 ETHSepolia per day** if you have the accounts.

Alchemy provides **0.5 ETHSepolia 0.5 Mumbai Matic per day**.

[Sepolia](https://www.infura.io/faucet/sepolia)

[Mumbai](https://mumbaifaucet.com/)

[Fuji](https://faucet.quicknode.com/avalanche/fuji)

![Aave](./img/aave-faucet.png)
[Aave](https://app.aave.com/faucet/) provides the mintable ERC20 tokens for testnet environments.

### Approval

Due to transferring the tokens, depositing as a collaterals and borrowing on behalf of the someone, we need many steps to follow to make enable to do all of functions.

To minimize the complexity of contracts for the hackathons, we assumed the users like this

- Who has already supplied to the aaveV2/V3 lending pools before and hasn't disabled the assets as collaterals.
- Who supplies and borrows(leverages) int the same assets.

### Get Info

```shell
npx hardhat lending-status  --blockchain ethereumSepolia
```

### Deployment

1. Deploy the [`Leverager.sol`](./contracts/Leverager.sol) smart contracts to the **all target blockchains**, by running the `deploy-leverager` task:

```shell
npx hardhat deploy-leverager
--router <routerAddress> # Optional
```

For example, if you want to mint Leverager on avalancheFuji, run:

```shell
npx hardhat deploy-leverager --network avalancheFuji
```

2. Deploy the [`LeverageViewer.sol`](./contracts/cross-chain-nft-minter/DestinationMinter.sol) smart contract to the **source blockchain**, by running the `deploy-source-minter` task:

```shell
npx hardhat deploy-source-minter
--router <routerAddress> # Optional
--link <linkTokenAddress> # Optional
```

For example, if you want to mint NFTs on avalancheFuji by sending requests from ethereumSepolia, run:

```shell
npx hardhat deploy-source-minter --network ethereumSepolia
```

### Fee Management

3. Fund the [`Leverager.sol`](./contracts/cross-chain-nft-minter/SourceMinter.sol) smart contract with tokens for CCIP fees.

- If you want to pay for CCIP fees in Native tokens:

  Open Metamask and fund your contract with Native tokens. For example, if you want to mint from Ethereum Sepolia to Avalanche Fuji, you can send 0.01 Sepolia ETH to the [`SourceMinter.sol`](./contracts/cross-chain-nft-minter/SourceMinter.sol) smart contract.

  Or, you can execute the `fill-sender` task, by running:

```shell
npx hardhat fill-sender
--sender-address <sourceMinterAddress>
--blockchain <blockchain>
--amount <amountToSend>
--pay-fees-in <Native>
```

For example, if you want to fund it with 0.01 Sepolia ETH, run:

```shell
npx hardhat fill-sender --sender-address <SOURCE_MINTER_ADDRESS> --blockchain ethereumSepolia --amount 10000000000000000 --pay-fees-in Native
```

- If you want to pay for CCIP fees in LINK tokens:

  Open Metamask and fund your contract with LINK tokens. For example, if you want to mint from Ethereum Sepolia to Avalanche Fuji, you can send 0.001 Sepolia LINK to the [`SourceMinter.sol`](./contracts/cross-chain-nft-minter/SourceMinter.sol) smart contract.

  Or, you can execute the `fill-sender` task, by running:

```shell
npx hardhat fill-sender
--sender-address <sourceMinterAddress>
--blockchain <blockchain>
--amount <amountToSend>
--pay-fees-in <LINK>
```

For example, if you want to fund it with 0.001 Sepolia LINK, run:

```shell
npx hardhat fill-sender --sender-address <SOURCE_MINTER_ADDRESS> --blockchain ethereumSepolia --amount 1000000000000000 --pay-fees-in LINK
```

### Minting

4. Mint NFTs by calling the `mint()` function of the [`SourceMinter.sol`](./contracts/cross-chain-nft-minter/SourceMinter.sol) smart contract on the **source blockchain**. It will send the CCIP Cross-Chain Message with the ABI-encoded mint function signature from the [`MyNFT.sol`](./contracts/cross-chain-nft-minter/MyNFT.sol) smart contract. The [`DestinationMinter.sol`](./contracts/cross-chain-nft-minter/DestinationMinter.sol) smart contracts will receive the CCIP Cross-Chain Message with the ABI-encoded mint function signature as a payload and call the [`MyNFT.sol`](./contracts/cross-chain-nft-minter/MyNFT.sol) smart contract using it. The [`MyNFT.sol`](./contracts/cross-chain-nft-minter/MyNFT.sol) smart contract will then mint the new NFT to the `msg.sender` account from the `mint()` function of the [`SourceMinter.sol`](./contracts/cross-chain-nft-minter/SourceMinter.sol) smart contract, a.k.a to the account from which you will call the following command:

```shell
npx hardhat cross-chain-mint
--source-minter <sourceMinterAddress>
--source-blockchain <sourceBlockchain>
--destination-blockchain <destinationBlockchain>
--destination-minter <destinationMinterAddress>
--pay-fees-in <Native | LINK>
```

For example, if you want to mint NFTs on Avalanche Fuji by sending requests from Ethereum Sepolia, run:

```shell
npx hardhat cross-chain-mint --source-minter <SOURCE_MINTER_ADDRESS> --source-blockchain ethereumSepolia --destination-blockchain avalancheFuji --destination-minter <DESTNATION_MINTER_ADDRESS> --pay-fees-in Native
```

5. Once the CCIP message is finalized on the destination blockchain, you can query the MyNFTs balance of your account, using the `balance-of` task:

![ccip-explorer](./img/ccip-explorer.png)

```shell
npx hardhat balance-of
--my-nft <myNftContractAddress>
--blockchain <destinationBlockchain>
--owner <theAccountToCheckBalanceOf>
```

For example, to verify that the new MyNFT was minted, type:

```shell
npx hardhat balance-of --my-nft <MY_NFT_CONTRACT_ADDRESS> --blockchain avalancheFuji --owner <PUT_YOUR_EOA_ADDRESS_HERE>
```

Of course, you can see your newly minted NFT on popular NFT Marketplaces, like OpenSea for instance:

![opensea](./img/opensea.png)

6. You can always withdraw tokens for Chainlink CCIP fees from the [`SourceMinter.sol`](./contracts/cross-chain-nft-minter/SourceMinter.sol) smart contract using the `withdraw` task. Note that the `--token-address` flag is optional. If not provided, native coins will be withdrawn.

```shell
npx hardhat withdraw
--beneficiary <withdrawTo>
--blockchain <sourceMinterBlockchain>
--from <sourceMinterAddress>
--token-address <tokensToWithdraw> # Optional, if left empty native coins will be withdrawn
```

For example, to withdraw tokens previously sent for Chainlink CCIP fees, run:

```shell
npx hardhat withdraw --beneficiary <BENEFICIARY_ADDRESS> --blockchain ethereumSepolia --from <SOURCE_MINTER_ADDRESS>
```

or

```shell
npx hardhat withdraw --beneficiary <BENEFICIARY_ADDRESS> --blockchain ethereumSepolia --from <SOURCE_MINTER_ADDRESS> --token-address 0x779877A7B0D9E8603169DdbD7836e478b4624789
```

depending on whether you filled the [`SourceMinter.sol`](./contracts/cross-chain-nft-minter/SourceMinter.sol) contract with `Native` or `LINK` in step number 3.
