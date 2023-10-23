import { BigNumber } from 'ethers';
import { curry } from 'lodash';

import {
	TransactionDirection,
	TransactionAction,
	TransactionStatus,
	TransactionType,
	TransactionTypeRule
} from '../transactions.types';

import {
	mapErc20TokenSwapLogsToTransactionSwapAction,
	mapErc20TokenTransferLogToTransactionTransferAction ,
	mapErc721TokenTransferLogToTransactionTransferAction 
} from '../events';

export const executionTransactionRule: TransactionTypeRule = (tx, transactionContext) => {
	try {
		const logToTransactionTransferActionMappers = [
			mapErc20TokenTransferLogToTransactionTransferAction,
			curry(mapErc721TokenTransferLogToTransactionTransferAction)
		];
		const transactionActions = tx.decodedLogs.reduce(
			(acc, log) => {
				if (!log.decodedEvent) return acc;

				for (const logToTransactionTransferActionMapper of logToTransactionTransferActionMappers) {
					const part = logToTransactionTransferActionMapper(log, transactionContext);

					if (part) {
						acc.unshift(part);

						return acc;
					}
				}

				return acc;
			},
			[] as TransactionAction[]
		);

		return {
			chainId: transactionContext.chainId,
			hash: tx.hash,
			fromAddress: tx.from,
			toAddress: tx.to || null,
			value: tx.value.toString(),
			direction: tx.from === transactionContext.walletAddress ? TransactionDirection.OUT : TransactionDirection.IN,
			type: TransactionType.EXECUTION,
			status: !!tx.blockNumber ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
			executed: tx.timestamp?.toString() || '',
			fee: tx.gasPrice ? tx.receipt.gasUsed.mul(tx.gasPrice).toString(): '0',
			transactionActions: transactionActions,
			walletAddress: transactionContext.walletAddress
		};
	} catch (error) {
		console.error('[executionTransactionRule]', { error });

		return false;
	}
};
