import { ethers } from 'ethers';
import { LogDescription } from 'ethers/lib/utils';

export type TransactionRaw = ethers.providers.TransactionResponse & {
	receipt: ethers.providers.TransactionReceipt
}
export type TransactionLogRaw = ethers.providers.Log

export type TransactionContext = {
	chainId: number;
	walletAddress: string;
};

export type TransactionLogWithDecodedEvent = TransactionLogRaw & {
	decodedEvent?: LogDescription;
};

export type TransactionWithDecodedLogs = TransactionRaw & {
	decodedLogs: TransactionLogWithDecodedEvent[];
};

export type TransactionTypeRule = (
	tx: TransactionWithDecodedLogs,
	transactionContext: TransactionContext
) => false | Transaction;

export interface Token {
	type: string;
	name: string;
	address: string | null;
	symbol: string;
	chainId: number;
	iconUrl: string | null;
	decimals: number;
}

export interface ERC721Token extends Token {
	type: 'ERC-721';
	name: string;
	address: string;
	chainId: number;
	symbol: string;
	tokenId: number;
	iconUrl: string | null;
	decimals: number;}

export enum TransactionDirection {
	'IN' = 'IN',
	'OUT' = 'OUT',
	'SELF' = 'SELF'
}

export enum TransactionType {
	'SEND_TOKEN' = 'SEND_TOKEN',
	'RECEIVE' = 'RECEIVE',
	'RECEIVE_TOKEN' = 'RECEIVE_TOKEN',
	'EXECUTION' = 'EXECUTION',
	'SEND_NFT' = 'SEND_NFT',
	'RECEIVE_NFT' = 'RECEIVE_NFT',
	'SWAP' = 'SWAP'
}

export enum TransactionStatus {
	'SUCCESS' = 'SUCCESS',
	'FAILED' = 'FAILED'
}

export enum AccountType {
	'UNKNOWN' = 'UNKNOWN',
	'EXTERNAL' = 'EXTERNAL',
	'CONTRACT' = 'CONTRACT'
}

export interface Account {
	type: AccountType;
	address: string | null;
}

export interface TransactionActionBase {
	type: 'TRANSFER' | 'SWAP'
}

export interface TransactionTransferAction extends TransactionActionBase {
	type: 'TRANSFER'
	token: Token;
	value: string;
	from: Account;
	to: Account;
	direction: TransactionDirection;
}

export interface TransactionSwapAction extends TransactionActionBase {
	type: 'SWAP'
	trader: Account;
	application: Account;
	// outToken: Token;
	// outTokenValue: string;
	// inToken: Token;
	// inTokenValue: string;
}

export type TransactionAction = TransactionTransferAction | TransactionSwapAction

export interface Transaction {
	hash: string;
	chainId: number | null;
	type: TransactionType;
	status: TransactionStatus;
	executed: string;
	fee: string;
	fromAddress: string | null;
	toAddress: string | null;
	value: string | null;
	direction: TransactionDirection;
	transactionActions: TransactionAction[] | null;
	walletAddress: string | null;
	walletName?: string | null;
	walletId?: string | null;
}
