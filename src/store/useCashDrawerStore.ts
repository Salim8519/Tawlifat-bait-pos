import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  reason: string;
  date: string;
  balanceAfter: number;
}

interface CashDrawerState {
  balance: number;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'balanceAfter'>) => void;
}

export const useCashDrawerStore = create<CashDrawerState>()(
  persist(
    (set) => ({
      balance: 0,
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => {
          const newBalance =
            state.balance +
            (transaction.type === 'deposit' ? transaction.amount : -transaction.amount);

          const newTransaction: Transaction = {
            ...transaction,
            id: Date.now().toString(),
            balanceAfter: newBalance,
          };

          return {
            balance: newBalance,
            transactions: [newTransaction, ...state.transactions],
          };
        }),
    }),
    {
      name: 'cash-drawer-storage',
    }
  )
);