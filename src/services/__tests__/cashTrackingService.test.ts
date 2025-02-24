import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCashTracking, updateCashForSale, updateCashForReturn } from '../cashTrackingService';
import { createTransaction } from '../transactionService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              tracking_id: 'TEST123',
              business_code: 'BUS123',
              business_branch_name: 'BRANCH1',
              cashier_name: 'John',
              previous_total_cash: 1000,
              new_total_cash: 1100,
              cash_additions: 100,
              cash_removals: 0,
              total_returns: 0,
              transaction_date: '2025-02-22'
            },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { business_name: 'Test Business' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

vi.mock('../transactionService', () => ({
  createTransaction: vi.fn()
}));

describe('cashTrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCashTracking', () => {
    it('should create cash tracking record and corresponding transaction', async () => {
      const testData = {
        business_code: 'BUS123',
        business_branch_name: 'BRANCH1',
        cashier_name: 'John',
        previous_total_cash: 1000,
        new_total_cash: 1100,
        cash_additions: 100
      };

      const result = await createCashTracking(testData);

      // Verify cash tracking record creation
      expect(result).toEqual(expect.objectContaining({
        tracking_id: expect.any(String),
        business_code: testData.business_code,
        business_branch_name: testData.business_branch_name,
        cash_additions: testData.cash_additions
      }));

      // Verify transaction creation
      expect(createTransaction).toHaveBeenCalledWith(expect.objectContaining({
        business_code: testData.business_code,
        business_name: 'Test Business',
        branch_name: testData.business_branch_name,
        transaction_type: 'cash_addition',
        amount: testData.cash_additions,
        payment_method: 'cash'
      }));
    });
  });

  describe('updateCashForSale', () => {
    it('should update cash tracking for a sale', async () => {
      const result = await updateCashForSale('BUS123', 'BRANCH1', 'John', 100);

      expect(result).toBeDefined();
      expect(createTransaction).toHaveBeenCalledWith(expect.objectContaining({
        transaction_type: 'cash_addition',
        amount: 100
      }));
    });
  });

  describe('updateCashForReturn', () => {
    it('should update cash tracking for a return', async () => {
      const result = await updateCashForReturn('BUS123', 'BRANCH1', 'John', 50);

      expect(result).toBeDefined();
      expect(createTransaction).toHaveBeenCalledWith(expect.objectContaining({
        transaction_type: 'cash_return',
        amount: -50
      }));
    });
  });
});
