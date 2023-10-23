import { ethers } from 'ethers';

import {
	AccountType,
	ERC721Token,
	TransactionDirection,
	TransactionAction,
	TransactionContext,
	TransactionRaw,
	Token
} from './transactions.types';

export const getNativeTransactionTransferAction  = (
	tx: TransactionRaw,
	transactionContext: TransactionContext
): TransactionAction => {
	const { walletAddress } = transactionContext;
	const { from, to } = tx;
	const token = findTokenBySymbol({ symbol: 'ETH' });
	const formattedWalletAddress = getAddress(walletAddress);
	const formattedFromAddress = getAddress(from);
	const formattedToAddress = getAddress(to);
	return {
		type: 'TRANSFER',
		token: token!,
		value: tx.value.toString(),
		from: {
			type: AccountType.UNKNOWN,
			address: formattedFromAddress
		},
		to: {
			type: AccountType.UNKNOWN,
			address: formattedToAddress
		},
		direction:
			formattedFromAddress === formattedWalletAddress ? TransactionDirection.OUT : TransactionDirection.IN
	};
};

export const getAddress = (address: string | any) => {
	try {
		return ethers.utils.getAddress(address);
	} catch (error) {
		return null;
	}
};

const tokens: Token[] = [
	{
		chainId: 1,
		type: 'NATIVE',
		name: 'Ether',
		address: getAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'),
		symbol: 'ETH',
		decimals: 18,
		iconUrl:
			'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
	},
	{
		chainId: 1,
		type: 'ERC-20',
		name: 'USDC',
		iconUrl: '',
		address: getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
		symbol: 'USDC',
		decimals: 6
	},
	{
		chainId: 1,
		type: 'ERC-20',
		name: 'USDT',
		iconUrl: '',
		address: getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
		symbol: 'USDT',
		decimals: 6
	},
	{
		chainId: 1,
		type: 'ERC-20',
		name: 'FRENBOT',
		iconUrl: '',
		address: getAddress('0xCA5001bC5134302Dbe0F798a2d0b95Ef3cF0803F'),
		symbol: 'MEF',
		decimals: 18
	}
]

export const getERC721Token = (address: string, tokenId: number, chainId: number, name?: string): ERC721Token => ({
	tokenId,
	address,
	chainId,
	type: 'ERC-721',
	name: `${name || ''} #${tokenId}`,
	symbol: '',
	iconUrl: null,
	decimals: 0
});


export const findTokenByAddress = (params: { address: string }): Token | undefined =>
	tokens.find(token => token.address === getAddress(params.address))

export const findTokenBySymbol = (params: { symbol: string }): Token | undefined =>
	tokens.find(token => token.symbol === params.symbol.toUpperCase())