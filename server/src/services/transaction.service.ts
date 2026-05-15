import { TransactionRepository } from '../repositories/transaction.repository';

export const getTransactions = async () => {
  return await TransactionRepository.findAll();
};
