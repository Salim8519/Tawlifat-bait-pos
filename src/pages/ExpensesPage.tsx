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
  const { getCurrentBranch, branches, businessCode: businessStoreCode, setBusinessCode } = useBusinessStore();
  
  // Get business code from auth store as fallback
  const authBusinessCode = useAuthStore(state => state.businessCode);
  
  // Use business code from either store, with auth store as fallback
  const businessCode = businessStoreCode || authBusinessCode || user?.businessCode;
  
  // Initialize with the first active branch or the cashier's assigned branch
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  console.log('[ExpensesPage] Initial render', { 
    user: user?.name, 
    role: user?.role, 
    businessStoreCode,
    authBusinessCode,
    userBusinessCode: user?.businessCode,
    effectiveBusinessCode: businessCode,
    branchesCount: branches.length,
    activeBranches: branches.filter(b => b.is_active).length
  });

  // Ensure business code is set in business store if available elsewhere
  useEffect(() => {
    if (!businessStoreCode && businessCode) {
      console.log('[ExpensesPage] Setting business code in store:', businessCode);
      setBusinessCode(businessCode);
    }
  }, [businessStoreCode, businessCode, setBusinessCode]);

  useEffect(() => {
    console.log('[ExpensesPage] useEffect triggered', { 
      userRole: user?.role, 
      branchesCount: branches.length 
    });
    
    if (user?.role === 'cashier') {
      const currentBranch = getCurrentBranch();
      console.log('[ExpensesPage] Cashier branch assignment', { 
        currentBranch: currentBranch?.branch_name 
      });
      setSelectedBranch(currentBranch?.branch_name || null);
    } else {
      // For non-cashiers, select the first active branch
      const activeBranches = branches.filter(branch => branch.is_active);
      console.log('[ExpensesPage] Active branches for non-cashier', { 
        activeBranchesCount: activeBranches.length,
        firstActiveBranch: activeBranches[0]?.branch_name 
      });
      if (activeBranches.length > 0) {
        setSelectedBranch(activeBranches[0].branch_name);
      }
    }
  }, [user?.role, branches]);

  const handleBranchChange = (branch: string) => {
    console.log('[ExpensesPage] Branch changed', { branch });
    setSelectedBranch(branch);
  };

  const handleExpenseSubmit = async (formData: ExpenseFormData) => {
    console.log('[ExpensesPage] Form submitted', { 
      formData, 
      selectedBranch, 
      businessCode,
      userName: user?.name 
    });
    
    if (!selectedBranch || !businessCode || !user?.name) {
      console.error('[ExpensesPage] Missing required data', { 
        selectedBranch, 
        businessCode, 
        userName: user?.name 
      });
      setToast({
        type: 'error',
        message: language === 'ar' ? 'بيانات مفقودة مطلوبة' : 'Missing required data'
      });
      return;
    }

    try {
      // Get the proper business name from the owner's profile
      console.log('[ExpensesPage] Getting business name for', { businessCode });
      const businessName = await getBusinessName(businessCode);
      console.log('[ExpensesPage] Retrieved business name', { businessName });

      // Calculate amount based on transaction type
      const amount = formData.transaction_type === 'withdraw' 
        ? -Math.abs(Number(formData.amount)) // Make withdraw amounts negative
        : Math.abs(Number(formData.amount));
      
      console.log('[ExpensesPage] Calculated amount', { 
        originalAmount: formData.amount,
        calculatedAmount: amount,
        transactionType: formData.transaction_type 
      });

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

      console.log('[ExpensesPage] Creating transaction', transaction);
      // Create the transaction
      await createTransaction(transaction);
      console.log('[ExpensesPage] Transaction created successfully');

      // If payment method is cash, update cash tracking
      if (formData.payment_method === 'cash') {
        console.log('[ExpensesPage] Updating cash tracking for cash payment');
        await updateCashManually(
          businessCode,
          selectedBranch,
          user.name,
          amount,
          formData.transaction_reason || (formData.transaction_type === 'deposit' ? 'Cash Addition' : 'Cash Removal')
        );
        console.log('[ExpensesPage] Cash tracking updated successfully');
      }

      setToast({
        type: 'success',
        message: language === 'ar' ? 'تم حفظ المعاملة بنجاح' : 'Transaction saved successfully'
      });
    } catch (error) {
      console.error('[ExpensesPage] Error creating transaction:', error);
      setToast({
        type: 'error',
        message: language === 'ar' ? 'حدث خطأ أثناء حفظ المعاملة' : 'Error saving transaction'
      });
    }
  };

  console.log('[ExpensesPage] Rendering with selectedBranch:', selectedBranch);

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
