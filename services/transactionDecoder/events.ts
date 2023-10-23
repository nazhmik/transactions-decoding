import { utils } from 'ethers';
import defaultTo from 'lodash/defaultTo';

import {
	AccountType,
	Token,
	TransactionDirection,
	TransactionAction,
	TransactionContext,
	TransactionLogWithDecodedEvent,
	TransactionWithDecodedLogs,
	TransactionLogRaw,
	TransactionSwapAction,
	TransactionTransferAction
} from './transactions.types';

import {
	isErc20TokenTransferEvent,
	isErc721TokenTransferEvent,
	TransactionLogsToTransactionTransferActionMapper,
	TransactionLogsToTransactionSwapActionMapper,
	isErc20TokenSwapEvent
} from './events.types';

import ERC20TokenABI from './ABI/ERC20TokenABI.json';
import ERC721TokenABI from './ABI/ERC721TokenABI.json';
import UniswapABI from './ABI/UniswapABI.json';


import { getAddress, findTokenByAddress, getERC721Token } from './utils';

const ERC20TokenEventsABIInterface = new utils.Interface(ERC20TokenABI);
const ERC721TokenEventsABIInterface = new utils.Interface(ERC721TokenABI);
const UniswapABIInterface = new utils.Interface(UniswapABI);


export const mapErc20TokenTransferLogToTransactionTransferAction : TransactionLogsToTransactionTransferActionMapper = (
	decodedLog,
	transactionContext
) => {
	const { chainId, walletAddress } = transactionContext;
	const { decodedEvent, address: contractAddress } = decodedLog;

	if (!decodedEvent) return false;
	if (!isErc20TokenTransferEvent(decodedLog)) return false;

	const fromAddress = getAddress(decodedEvent.args.from) || '';
	const toAddress = getAddress(decodedEvent.args.to) || '';
	const value = defaultTo<string>(decodedEvent.args.value.toString(), '0');
	const whiteListToken = findTokenByAddress({ address: getAddress(contractAddress) || '' });

	const token: Token = whiteListToken || {
		address: contractAddress,
		chainId: 1,
		decimals: 18,
		iconUrl: 'unknown',
		name: 'unknown token',
		symbol: 'UNKNOWN',
		type: 'ERC-20'
	}

	const formattedAddress = getAddress(walletAddress);
	const isLogWalletTransfer = fromAddress === formattedAddress || toAddress === formattedAddress;

	if (token && isLogWalletTransfer && decodedEvent.args.value.gt(0)) {
		return {
			type: 'TRANSFER',
			token,
			value,
			from: {
				type: AccountType.UNKNOWN,
				address: fromAddress
			},
			to: {
				type: AccountType.UNKNOWN,
				address: toAddress
			},
			direction: fromAddress === walletAddress ? TransactionDirection.OUT : TransactionDirection.IN
		};
	}

	return false;
};

export const mapErc20TokenSwapLogsToTransactionSwapAction : TransactionLogsToTransactionSwapActionMapper = (
	decodedLog,
	transactionContext
) => {
	const { walletAddress } = transactionContext;

	const traderAddressNormallized = getAddress(walletAddress) || '';
	const applicationAddressNormallized = getAddress(decodedLog.address) || '';

	return {
		type: 'SWAP',
		trader: {
			type: AccountType.EXTERNAL,
			address: traderAddressNormallized
		},
		application: {
			type: AccountType.CONTRACT,
			address: applicationAddressNormallized
		},
		// outToken: transactionTokenOutTransferAction.token,
		// outTokenValue: transactionTokenOutTransferAction.value,
		// inToken: transactionTokenInTransferAction.token,
		// inTokenValue: transactionTokenInTransferAction.value,
	}
};

export const mapErc721TokenTransferLogToTransactionTransferAction  = (
	tx: TransactionWithDecodedLogs,
	decodedLog: TransactionLogWithDecodedEvent,
	transactionContext: TransactionContext,
): false | TransactionTransferAction => {
	const { chainId, walletAddress } = transactionContext;
	const { decodedEvent, address: contractAddress } = decodedLog;

	if (!decodedEvent) return false;
	if (!isErc721TokenTransferEvent(decodedLog)) return false;

	const fromAddress = getAddress(tx.from) || '';
	const toAddress = getAddress(decodedEvent.args.to) || '';
	const formattedAddress = getAddress(walletAddress);
	const isLogWalletTransfer = fromAddress === formattedAddress || toAddress === formattedAddress;
	if (!isLogWalletTransfer) {
		return false;
	}

	const tokenId = defaultTo<number>(decodedEvent.args.tokenId.toString(), 0);

	const token = getERC721Token(
		contractAddress,
		tokenId,
		chainId
	);

	if (token) {
		return {
			type: 'TRANSFER',
			token,
			value: '',
			from: {
				type: AccountType.UNKNOWN,
				address: fromAddress
			},
			to: {
				type: AccountType.UNKNOWN,
				address: toAddress
			},
			direction: fromAddress === walletAddress ? TransactionDirection.OUT : TransactionDirection.IN
		};
	}

	return false;
};

const contractInterfaces = [
	ERC20TokenEventsABIInterface,
	ERC721TokenEventsABIInterface,
	UniswapABIInterface
]

const decodeLogWithInterface = (log: TransactionLogRaw): utils.LogDescription | undefined => {
    for (const contractInterface of contractInterfaces) {
        try {
            const decodedEvent = contractInterface.parseLog(log);
            if (decodedEvent) {
                return decodedEvent;
            }
        } catch (err) {
			
        }
    }
    return undefined;
};

export const decodeTransactionLogs = (logs: TransactionLogRaw[]): TransactionLogWithDecodedEvent[] => {
    try {
        return logs
            .map(log => {
                const decodedEvent = decodeLogWithInterface(log);
                return {
                    ...log,
                    decodedEvent
                };
            })
            .filter((log) => !!log.decodedEvent);
    } catch (error) {
        return [];
    }
};
