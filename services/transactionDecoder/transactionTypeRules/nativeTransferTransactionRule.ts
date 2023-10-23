import { BigNumber } from 'ethers';
import { getAddress } from '../utils';
import {
	TransactionDirection,
	TransactionStatus,
	TransactionType
} from '../transactions.types';
import { TransactionTypeRule } from '../transactions.types';
import { getNativeTransactionTransferAction  } from '../utils';

export const nativeTransferTransactionRule: TransactionTypeRule = (tx, transactionContext) => {
	try {
		if (tx.decodedLogs.length !== 0 || BigNumber.from(tx.value).eq(0)) return false;

		const { chainId, walletAddress } = transactionContext;
		const { from, to, value, hash } = tx;
		const formattedWalletAddress = getAddress(walletAddress);
		const formattedFromAddress = getAddress(from);
		const formattedToAddress = getAddress(to);
		const transactionActions = [getNativeTransactionTransferAction (tx, transactionContext)];

		return {
			chainId: chainId,
			hash: hash,
			fromAddress: formattedFromAddress,
			toAddress: formattedToAddress,
			value: value.toString(),
			type: formattedWalletAddress === formattedFromAddress ? TransactionType.SEND_TOKEN : TransactionType.RECEIVE_TOKEN,
			status: !!tx.blockNumber ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
			executed: tx.timestamp?.toString() || '',
			fee: tx.gasPrice ? tx.receipt.gasUsed.mul(tx.gasPrice).toString(): '0',
			direction:
				formattedFromAddress === formattedWalletAddress
					? TransactionDirection.OUT
					: TransactionDirection.IN,
			transactionActions,
			walletAddress: formattedWalletAddress
		};
	} catch (e) {
		console.error('[nativeTransferTransactionRule]', { e });
		return false;
	}
};
