import { BigNumber } from 'ethers';

import { decodeTransactionLogs } from './events';

import {
	Transaction,
	TransactionDirection,
	TransactionStatus,
	TransactionType,
	TransactionRaw,
	TransactionContext,
	TransactionWithDecodedLogs,
	TransactionTypeRule
} from './transactions.types';

import { erc20DirectTransferTransactionRule } from './transactionTypeRules/erc20DirectTransferTransactionRule';
import { erc721DirectTransferTransactionRule } from './transactionTypeRules/erc721DirectTransferTransactionRule';
import { executionTransactionRule } from './transactionTypeRules/executionTransactionRule';
import { nativeTransferTransactionRule } from './transactionTypeRules/nativeTransferTransactionRule';
import { erc20SwapTransactionRule } from './transactionTypeRules/erc20SwapTransactionRule';

import { getNativeTransactionTransferAction  } from './utils';

const transactionTypeRules: TransactionTypeRule[] = [
	erc20SwapTransactionRule,
	erc20DirectTransferTransactionRule,
	erc721DirectTransferTransactionRule,
	nativeTransferTransactionRule,
	executionTransactionRule
];

export const decodeTransaction = (tx: TransactionRaw, transactionContext: TransactionContext): Transaction => {
	const { chainId, walletAddress } = transactionContext;

	const decodedLogs = decodeTransactionLogs(tx.receipt.logs);

	const transactionWithDecodedLogs: TransactionWithDecodedLogs = {
		...tx,
		decodedLogs: decodedLogs
	};

	try {
		for (const transactionTypeRule of transactionTypeRules) {
			const formattedTransaction = transactionTypeRule(transactionWithDecodedLogs, transactionContext);

			if (formattedTransaction) {
				return formattedTransaction;
			}
		}
	} catch (err) {}

	const fallbackTransaction: Transaction = {
		hash: tx.hash,
		chainId: chainId,
		fromAddress: tx.from,
		toAddress: tx.to || null,
		value: tx.value.toString(),
		type: TransactionType.EXECUTION,
		status: !!tx.blockNumber ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
		executed: tx.timestamp?.toString() || '',
		fee: tx.gasPrice ? tx.receipt.gasUsed.mul(tx.gasPrice).toString(): '0',
		direction: tx.from === walletAddress ? TransactionDirection.OUT : TransactionDirection.IN,
		transactionActions: [],
		walletAddress
	};

	if (BigNumber.from(tx.value).gt(0)) {
		fallbackTransaction.transactionActions = [getNativeTransactionTransferAction (tx, transactionContext)];
	}

	return fallbackTransaction;
};
