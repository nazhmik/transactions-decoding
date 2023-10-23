import { getAddress } from '../utils';
import {
	TransactionDirection,
	TransactionStatus,
	TransactionType
} from '../transactions.types';
import { mapErc20TokenTransferLogToTransactionTransferAction  } from '../events';
import { isErc20TokenTransferEvent } from '../events.types';
import { TransactionTypeRule } from '../transactions.types';

export const erc20DirectTransferTransactionRule: TransactionTypeRule = (tx, transactionContext) => {
	try {
		const { hash, to } = tx;
		const { walletAddress } = transactionContext;

		const erc20TokenTransferEvents = tx.decodedLogs.filter((log) => isErc20TokenTransferEvent(log));

		if (erc20TokenTransferEvents.length !== 1) return false;

		const erc20TokenTransferEvent = erc20TokenTransferEvents[0];
		if (!erc20TokenTransferEvent) return false;

		const transactionTransferAction = mapErc20TokenTransferLogToTransactionTransferAction (erc20TokenTransferEvent, transactionContext);

		if (!transactionTransferAction) {
			return false;
		}

		const condition = erc20TokenTransferEvent && transactionTransferAction;

		if (!condition) {
			return false;
		}

		const fromAddress = getAddress(transactionTransferAction.from.address) || '';

		return {
			chainId: transactionContext.chainId,
			hash: hash,
			fromAddress: tx.from,
			toAddress: tx.to || null,
			value: tx.value.toString(),
			type: fromAddress === walletAddress ? TransactionType.SEND_TOKEN : TransactionType.RECEIVE_TOKEN,
			status: !!tx.blockNumber ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
			executed: tx.timestamp?.toString() || '',
			fee: tx.gasPrice ? tx.receipt.gasUsed.mul(tx.gasPrice).toString(): '0',
			direction: tx.from === transactionContext.walletAddress ? TransactionDirection.OUT : TransactionDirection.IN,
			transactionActions: [transactionTransferAction].filter(action => !!action),
			walletAddress
		};
	} catch (error) {
		console.error('[erc20DirectTransferTransactionRule]', error);
		return false;
	}
};
