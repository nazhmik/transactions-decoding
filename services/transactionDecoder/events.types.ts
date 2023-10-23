import { BigNumber } from 'ethers';
import { LogDescription, Result } from 'ethers/lib/utils';

import {
	TransactionContext,
	TransactionLogWithDecodedEvent,
	TransactionSwapAction,
	TransactionTransferAction,
	TransactionWithDecodedLogs
} from './transactions.types';

import { TransactionAction } from './transactions.types';

export interface IErc20TransferEvent extends LogDescription {
	name: 'Transfer';
	signature: 'Transfer(address,address,uint256)';
	args: Result & [string, string, BigNumber] & { from: string; to: string; value: BigNumber };
}

export interface IErc721TransferEvent extends LogDescription {
	name: 'Transfer';
	signature: 'Transfer(address,address,uint256)';
	args: Result & [string, string, BigNumber] & { from: string; to: string; tokenId: BigNumber };
}

export interface IErc20SwapEvent extends LogDescription {
	name: 'Swap';
	signature: 'Swap(address,uint256,uint256,uint256,uint256,address)';
	args: Result & [string, BigNumber, BigNumber, BigNumber, BigNumber, string] & {
		sender: string,
		amount0In: BigNumber,
		amount1In: BigNumber,
		amount0Out: BigNumber,
		amount1Out: BigNumber,
		to: string,
	};
}

export interface IErc721TransferDescription extends IErc20TransferEvent {}

export function isErc20TokenTransferEvent(
	log: TransactionLogWithDecodedEvent
): log is TransactionLogWithDecodedEvent & {
	decodedEvent: IErc20TransferEvent;
} {
	return (
		!!log.decodedEvent &&
		log.decodedEvent.signature === 'Transfer(address,address,uint256)' &&
		!!log.data && log.topics.length === 3
	);
}

export function isErc20TokenSwapEvent(
	log: TransactionLogWithDecodedEvent
): log is TransactionLogWithDecodedEvent & {
	decodedEvent: IErc20SwapEvent;
} {
	return (
		!!log.decodedEvent &&
		log.decodedEvent.signature === 'Swap(address,uint256,uint256,uint256,uint256,address)' &&
		!!log.data && log.topics.length === 3
	);
}


export function isErc721TokenTransferEvent(
	log: TransactionLogWithDecodedEvent
): log is TransactionLogWithDecodedEvent & {
	decodedEvent: IErc721TransferEvent;
} {
	return (
		!!log.decodedEvent &&
		log.decodedEvent.signature === 'Transfer(address,address,uint256)' &&
		log.topics.length === 4
	);
}

export type TransactionLogsToTransactionTransferActionMapper = (
	decodedLog: TransactionLogWithDecodedEvent,
	transactionContext: TransactionContext
) => false | TransactionTransferAction;


export type TransactionLogsToTransactionSwapActionMapper = (
	decodedLog: TransactionLogWithDecodedEvent,
	// transactionTokenOutTransferEvent: TransactionTransferAction,
	// transactionTokenInTransferEvent: TransactionTransferAction,
	transactionContext: TransactionContext
) => false | TransactionSwapAction;

