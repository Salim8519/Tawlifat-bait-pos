import { supabase } from '../lib/supabase';
import type { CartItem } from '../types/pos';
import { vendorTransactionService } from './vendorTransactionService';
import { ensureBusinessName } from './businessService';

interface VendorGroup {
  vendorCode: string;
  vendorName: string;
  items: CartItem[];
  totalAmount: number;
}

/**
 * Updates vendor transactions when their products are sold
 * This service is responsible for creating transaction records for vendor products
 * when they are sold through the POS system
 */
export async function updateVendorTransactionsFromSale(
  cartItems: CartItem[],
  businessCode: string,
  businessName: string,
  branchName: string,
  vendorCommissionEnabled: boolean,
  commissionRate: number,
  minCommissionAmount: number
): Promise<void> {
  try {
    console.log('=== Processing Vendor Transactions ===');
    
    // Get only vendor products from cart
    const vendorItems = cartItems.filter(item => item.business_code_if_vendor);
    if (vendorItems.length === 0) {
      console.log('No vendor products in cart, skipping vendor transactions');
      return;
    }

    // Use the ensureBusinessName function to get a valid business name
    let finalBusinessName: string;
    try {
      finalBusinessName = await ensureBusinessName(businessCode, businessName);
      console.log('Using business name for vendor transactions:', finalBusinessName);
    } catch (error) {
      console.error('Error ensuring business name:', error);
      throw new Error('Could not determine business name for vendor transaction');
    }

    console.log(`Found ${vendorItems.length} vendor products to process`);

    // Group items by vendor
    const vendorGroups = new Map<string, VendorGroup>();
    
    for (const item of vendorItems) {
      const vendorCode = item.business_code_if_vendor!;
      const vendorName = item.business_name_if_vendor!;
      
      // Get original price from products table
      const { data: originalProduct } = await supabase
        .from('products')
        .select('price')
        .eq('product_id', item.id)
        .single();

      if (!originalProduct) {
        console.error('Original product not found:', item.id);
        continue;
      }

      const originalPrice = originalProduct.price; // Original price without commission
      const quantity = item.quantity;
      const itemTotal = originalPrice * quantity;

      if (!vendorGroups.has(vendorCode)) {
        vendorGroups.set(vendorCode, {
          vendorCode,
          vendorName,
          items: [],
          totalAmount: 0
        });
      }

      const group = vendorGroups.get(vendorCode)!;
      group.items.push({
        ...item,
        price: originalPrice, // Use original price for vendor transaction
      });
      group.totalAmount += itemTotal;
    }

    console.log(`Grouped into ${vendorGroups.size} vendor transactions`);

    // Create transactions for each vendor group
    for (const group of vendorGroups.values()) {
      const firstItem = group.items[0];
      const isSingleItem = group.items.length === 1;

      // Create detailed notes with all products using original prices
      const productDetails = group.items.map(item => 
        `${item.nameAr} (${item.quantity} × ${item.price})`
      ).join(', ');

      // Get the last transaction for this vendor to get accumulated profit
      const { data: lastTransaction } = await supabase
        .from('vendor_transactions')
        .select(`
          accumulated_profit,
          transaction_id,
          transaction_type,
          business_code,
          business_name,
          branch_name,
          vendor_code,
          vendor_name,
          amount,
          profit,
          transaction_date
        `)
        .eq('business_code', businessCode)
        .eq('branch_name', branchName)
        .eq('vendor_code', group.vendorCode)
        .order('created_at', { ascending: false })
        .limit(1);

      const previousAccumulatedProfit = lastTransaction?.[0]?.accumulated_profit || 0;
      const currentProfit = group.totalAmount; // Current profit is the total amount of sales
      const newAccumulatedProfit = previousAccumulatedProfit + currentProfit;

      // For single item transactions, use the original unit price
      await vendorTransactionService.createTransaction({
        // Required fields
        transaction_type: 'product_sale',
        business_code: businessCode,
        business_name: finalBusinessName,
        branch_name: branchName,
        vendor_code: group.vendorCode,
        vendor_name: group.vendorName,
        amount: group.totalAmount,
        profit: currentProfit, // Current transaction profit
        accumulated_profit: newAccumulatedProfit, // Updated accumulated profit

        // Product sale specific fields
        product_name: group.items.map(item => item.nameAr).join(', '),
        product_quantity: group.items.reduce((sum, item) => sum + item.quantity, 0),
        unit_price: isSingleItem ? firstItem.price : undefined,
        total_price: group.totalAmount,
        
        // Optional fields
        status: 'completed',
        notes: `Bulk sale through POS - Products: ${productDetails}`
      });

      console.log(`✅ Successfully processed vendor transaction for ${group.vendorName}`);
      console.log('Products included:', productDetails);
    }

    console.log('=== Finished Processing Vendor Transactions ===');
    console.log('Summary:', {
      totalVendors: vendorGroups.size,
      totalProducts: vendorItems.length,
      processedAt: new Date().toISOString(),
      businessName: finalBusinessName
    });
  } catch (error) {
    console.error('Error updating vendor transactions:', error);
    throw error;
  }
}
