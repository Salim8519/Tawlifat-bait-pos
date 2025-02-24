import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { ExpenseBranchSelector } from '../components/expenses/ExpenseBranchSelector';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { ExpenseToast } from '../components/expenses/ExpenseToast';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { createTransaction } from '../services/transactionService';
import { getBusinessName } from '../services/businessService';
import { updateCashManually, getLatestCashTracking } from '../services/cashTrackingService';
import type { ExpenseFormData } from '../components/expenses/types';
import type { Transaction } from '../types/transaction';

export default function ExpensesPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { getCurrentBranch, branches, businessCode } = useBusinessStore();
  
  // Initialize with the first active branch or the cashier's assigned branch
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user?.role === 'cashier') {
      const currentBranch = getCurrentBranch();
      setSelectedBranch(currentBranch?.branch_name || null);
    } else {
      // For non-cashiers, select the first active branch
      const activeBranches = branches.filter(branch => branch.is_active);
      if (activeBranches.length > 0) {
        setSelectedBranch(activeBranches[0].branch_name);
      }
    }
  }, [user?.role, branches]);

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
  };

  const handleExpenseSubmit = async (formData: ExpenseFormData) => {
    if (!selectedBranch || !businessCode || !user?.name) return;

    try {
      // Get the proper business name from the owner's profile
      const businessName = await getBusinessName(businessCode);

      // Calculate amount based on transaction type
      const amount = formData.transaction_type === 'withdraw' 
        ? -Math.abs(Number(formData.amount)) // Make withdraw amounts negative
        : Math.abs(Number(formData.amount));

      const transaction: Omit<Transaction, 'transaction_id'> = {
        business_code: businessCode,
        business_name: businessName,
        branch_name: selectedBranch,
        payment_method: formData.payment_method as 'cash' | 'card' | 'online',
        transaction_type: formData.transaction_type,
        transaction_reason: formData.transaction_reason || '',
        amount,
        owner_profit_from_this_transcation: amount,
        currency: 'OMR',
        transaction_date: new Date().toISOString(),
        details: {
          notes: formData.transaction_reason || ''
        }
      };

      // Create the transaction
      await createTransaction(transaction);

      // If payment method is cash, update cash tracking
      if (formData.payment_method === 'cash') {
        await updateCashManually(
          businessCode,
          selectedBranch,
          user.name,
          amount,
          formData.transaction_reason || (formData.transaction_type === 'deposit' ? 'Cash Addition' : 'Cash Removal')
        );
      }

      setToast({
        type: 'success',
        message: language === 'ar' ? 'تم حفظ المعاملة بنجاح' : 'Transaction saved successfully'
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      setToast({
        type: 'error',
        message: language === 'ar' ? 'حدث خطأ أثناء حفظ المعاملة' : 'Error saving transaction'
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        {language === 'ar' ? 'المصروفات العامة' : 'General Expenses'}
      </h1>
      
      {/* Branch Selector */}
      {user?.role !== 'cashier' && (
        <ExpenseBranchSelector
          selectedBranch={selectedBranch}
          onBranchChange={handleBranchChange}
        />
      )}
      
      {/* Expense Form */}
      <div className="mt-6">
        <ExpenseForm
          selectedBranch={selectedBranch}
          onSubmit={handleExpenseSubmit}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <ExpenseToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
