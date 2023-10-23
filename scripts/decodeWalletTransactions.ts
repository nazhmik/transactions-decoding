import { ethers } from "ethers";

import { decodeTransaction } from '../services/transactionDecoder';
import { TransactionContext, TransactionRaw } from "../services/transactionDecoder/transactions.types";
import { getAddress } from "../services/transactionDecoder/utils";

const ALCHEMY_KEY = ''; // TODO ad your KEY here
const ETHEREUM_CHAIN_ID = 1;

const testWalletAddress = '0x4a7c6899cdcb379e284fbfd045462e751da4c7ce'; // https://etherscan.io/address/0x4a7c6899cdcb379e284fbfd045462e751da4c7ce

const testTransactions = [
  '0xa81b0b764ea32179b29c1098378992bed1b9a53b04f180393f0438d02da1687e', // send ERC-20 token https://etherscan.io/tx/0xa81b0b764ea32179b29c1098378992bed1b9a53b04f180393f0438d02da1687e
  '0x33158c1777581c7984dd3ebc920f2ed0fe64795538281cbdfe1f12a2c791b69e', // recieve ERC-20 token https://etherscan.io/tx/0x33158c1777581c7984dd3ebc920f2ed0fe64795538281cbdfe1f12a2c791b69e
  '0x49dc2be71db900f5699656f536fbcd606353015bcb4420985aa55985fa18e0d5', // trade/swap ERC-20 token https://etherscan.io/tx/0x49dc2be71db900f5699656f536fbcd606353015bcb4420985aa55985fa18e0d5
  '0x4aa5660257cdb033d36b55f04b002c493f714b40c891bb95b001287521e8938a', // send ERC-721 token https://etherscan.io/tx/0x4aa5660257cdb033d36b55f04b002c493f714b40c891bb95b001287521e8938a
  '0xf17614e09c89aadda4a9e00422e4575b8938b14e18ea07b3526bcd4945fb5394', // send ETH/Native token https://etherscan.io/tx/0xf17614e09c89aadda4a9e00422e4575b8938b14e18ea07b3526bcd4945fb5394
  '0x05d57392f2609c38d29129cde459b737fd414750033156875fe35c6d2ab9cf04', // approve ERC-20 token https://etherscan.io/tx/0x05d57392f2609c38d29129cde459b737fd414750033156875fe35c6d2ab9cf04
]

async function decodeWalletTransactions() {
  const provider = new ethers.providers.AlchemyProvider(ETHEREUM_CHAIN_ID, ALCHEMY_KEY)

  const transactionsRawRequests = testTransactions.map(async (txHash) => {
    const transaction = await provider.getTransaction(txHash)
    const transactionReceipt = await provider.getTransactionReceipt(txHash)

    return {
      transaction,
      transactionReceipt
    }
  });

  const transactionsResponse = await Promise.all(transactionsRawRequests)

  transactionsResponse.forEach(transactionResponse => {
    const transactionContext: TransactionContext = {
      chainId: ETHEREUM_CHAIN_ID,
      walletAddress: getAddress(testWalletAddress) || '0x' 
    };

    const rawTransaction = {
      ...transactionResponse.transaction,
      receipt: transactionResponse.transactionReceipt
    };

    const decodedTransaction = decodeTransaction(rawTransaction, transactionContext)

    console.log(`Raw transaction ${rawTransaction.hash}`, JSON.stringify(rawTransaction, undefined, 1));
    console.log(`Decoded transaction ${rawTransaction.hash}`, JSON.stringify(decodedTransaction, undefined, 1));
    console.log(' ');
  })
}

decodeWalletTransactions().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})
