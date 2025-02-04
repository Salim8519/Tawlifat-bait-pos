import { supabase } from '../lib/supabase';

interface ReturnInfo {
  returnReason: string;
  businessCode: string;
  branchName: string;
  cashierId: string;
}

interface ReturnProduct {
  soldProductId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export const returnProductsService = {
  async searchReceipt(receiptId: string, businessCode: string, branchName: string) {
    try {
      // Fetch receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .select('*')
        .eq('receipt_id', receiptId)
        .eq('business_code', businessCode)
        .eq('branch_name', branchName)
        .single();

      if (receiptError) throw receiptError;

      // Fetch sold products
      const { data: products, error: productsError } = await supabase
        .from('sold_products')
        .select('*')
        .eq('receipt_id', receiptId);

      if (productsError) throw productsError;

      // Check for existing returns
      const { data: existingReturns, error: returnsError } = await supabase
        .from('returned_products')
        .select('sold_product_id, quantity')
        .eq('original_receipt_id', receiptId);

      if (returnsError) throw returnsError;

      // Update quantities to reflect already returned items
      const updatedProducts = products.map((product: any) => {
        const returned = existingReturns?.find(r => r.sold_product_id === product.sold_product_id);
        return {
          ...product,
          returned_quantity: returned?.quantity || 0
        };
      });

      return {
        receipt,
        products: updatedProducts,
        existingReturns
      };
    } catch (error) {
      console.error('Error searching receipt:', error);
      throw error;
    }
  },

  async processReturn(
    originalReceipt: any,
    selectedProducts: ReturnProduct[],
    returnInfo: ReturnInfo
  ) {
    try {
      const returnReceiptId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create return receipt
      const { error: receiptError } = await supabase
        .from('return_receipts')
        .insert({
          return_receipt_id: returnReceiptId,
          original_receipt_id: originalReceipt.receipt_id,
          business_code: returnInfo.businessCode,
          branch_name: returnInfo.branchName,
          cashier_id: returnInfo.cashierId,
          return_reason: returnInfo.returnReason,
          return_date: new Date().toISOString(),
          total_amount: selectedProducts.reduce((sum, p) => sum + p.unitPrice, 0)
        });

      if (receiptError) throw receiptError;

      // Insert returned products
      for (const product of selectedProducts) {
        const { error: productError } = await supabase
          .from('returned_products')
          .insert({
            return_receipt_id: returnReceiptId,
            original_receipt_id: originalReceipt.receipt_id,
            sold_product_id: product.soldProductId,
            product_name: product.productName,
            quantity: product.quantity,
            unit_price: product.unitPrice,
            business_code: returnInfo.businessCode,
            branch_name: returnInfo.branchName
          });

        if (productError) throw productError;
      }

      return returnReceiptId;
    } catch (error) {
      console.error('Error processing return:', error);
      throw error;
    }
  }
};
