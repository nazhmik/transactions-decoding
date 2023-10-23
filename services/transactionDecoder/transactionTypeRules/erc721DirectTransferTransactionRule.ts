import { getAddress } from '../utils';
import {
	TransactionDirection,
	TransactionStatus,
	TransactionType
} from '../transactions.types';
import { mapErc721TokenTransferLogToTransactionTransferAction  } from '../events';
import { isErc721TokenTransferEvent } from '../events.types';
import { TransactionTypeRule } from '../transactions.types';

export const erc721DirectTransferTransactionRule: TransactionTypeRule = (tx, transactionContext) => {
	try {
		const { hash } = tx;
		const { walletAddress } = transactionContext;
		const erc721TokenTransferEvents = tx.decodedLogs.filter((log) => isErc721TokenTransferEvent(log));

		if (erc721TokenTransferEvents.length !== 1) return false;

		const erc721TokenTransferEvent = erc721TokenTransferEvents[0];
		if (!erc721TokenTransferEvent) return false;

		const transactionTransferAction = mapErc721TokenTransferLogToTransactionTransferAction (tx, erc721TokenTransferEvent, transactionContext);
		if (!transactionTransferAction) {
			return false;
		}

		const condition = erc721TokenTransferEvent && transactionTransferAction;

		if (!(condition && transactionTransferAction.type === 'TRANSFER')) {
			return false;
		}
		const fromAddress = getAddress(transactionTransferAction.from.address) || '';

		return {
			chainId: transactionContext.chainId,
			hash: hash,
			fromAddress: tx.from,
			toAddress: tx.to || null,
			value: tx.value.toString(),
			type: fromAddress === walletAddress ? TransactionType.SEND_NFT : TransactionType.RECEIVE_NFT,
			direction: tx.from === transactionContext.walletAddress ? TransactionDirection.OUT : TransactionDirection.IN,
			status: !!tx.blockNumber ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
			executed: tx.timestamp?.toString() || '',
			fee: tx.gasPrice ? tx.receipt.gasUsed.mul(tx.gasPrice).toString(): '0',
			transactionActions: [transactionTransferAction].filter(action => !!action),
			walletAddress
		};
	} catch (error) {
		console.log('[erc721DirectTransferTransactionRule]', error);

		return false;
	}
};
