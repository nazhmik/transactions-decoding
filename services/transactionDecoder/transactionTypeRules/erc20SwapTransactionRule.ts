import { getAddress } from '../utils';
import {
	TransactionDirection,
	TransactionStatus,
	TransactionTransferAction,
	TransactionType
} from '../transactions.types';
import { mapErc20TokenSwapLogsToTransactionSwapAction, mapErc20TokenTransferLogToTransactionTransferAction  } from '../events';
import { IErc20SwapEvent, isErc20TokenSwapEvent, isErc20TokenTransferEvent } from '../events.types';
import { TransactionTypeRule } from '../transactions.types';


export const erc20SwapTransactionRule: TransactionTypeRule = (tx, transactionContext) => {
	try {
		const { walletAddress } = transactionContext;

		const erc20TokenTransferEvents = tx.decodedLogs.filter((log) => 
			isErc20TokenTransferEvent(log) && (log.decodedEvent.args.from === walletAddress || log.decodedEvent.args.to === walletAddress)
		);

		const transactionTokenOutTransferActions = erc20TokenTransferEvents
			.map(erc20TokenOutTransferEvent => mapErc20TokenTransferLogToTransactionTransferAction(erc20TokenOutTransferEvent, transactionContext))
			.filter((transactionTokenOutTransferAction): transactionTokenOutTransferAction is TransactionTransferAction => !!transactionTokenOutTransferAction)

		const erc20TokenSwapEvent = tx.decodedLogs.find((log) => isErc20TokenSwapEvent(log) && log.decodedEvent.args.to === transactionContext.walletAddress);
		
		if (!(erc20TokenSwapEvent && erc20TokenSwapEvent.decodedEvent)) return false;

		const transactionSwapAction = mapErc20TokenSwapLogsToTransactionSwapAction(
			erc20TokenSwapEvent,
			transactionContext
		);

		const condition = !!transactionSwapAction && transactionTokenOutTransferActions.length > 0

		if (!condition) {
			return false;
		}

		return {
			chainId: transactionContext.chainId,
			hash: tx.hash,
			fromAddress: tx.from,
			toAddress: tx.to || null,
			value: tx.value.toString(),
			type: TransactionType.SWAP,
			status: !!tx.blockNumber ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
			executed: tx.timestamp?.toString() || '',
			fee: tx.gasPrice ? tx.receipt.gasUsed.mul(tx.gasPrice).toString(): '0',
			direction: tx.from === transactionContext.walletAddress ? TransactionDirection.OUT : TransactionDirection.IN,
			transactionActions: [transactionSwapAction, ...transactionTokenOutTransferActions].filter(action => !!action),
			walletAddress
		};
	} catch (error) {
		console.error('[erc20SwapTransactionRule]', error);
		return false;
	}
};
