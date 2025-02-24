import { supabase } from '../lib/supabase';
import type { CartItem } from '../types/pos';

/**
 * Updates product quantities after a successful sale
 * Note: Only updates quantities for non-trackable products (trackable = false)
 * For trackable products (trackable = true), quantities remain unchanged
 * 
 * @param cartItems List of items purchased
 * @param businessCode Business code of the owner
 * @param branchName Branch name where the sale occurred
 * @returns Promise<boolean> True if update was successful
 */
export async function updateProductQuantitiesAfterSale(
  cartItems: CartItem[],
  businessCode: string,
  branchName: string
): Promise<boolean> {
  try {
    console.log('Starting quantity update for cart items:', cartItems);

    // Convert string IDs to numbers for database query
    const productIds = cartItems.map(item => parseInt(item.id));
    console.log('Product IDs to update:', productIds);

    // Start a Supabase transaction
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('product_id, quantity, trackable, business_code_if_vendor')
      .in('product_id', productIds)
      .eq('business_code_of_owner', businessCode)
      .eq('branch_name', branchName);

    if (fetchError) throw new Error(`Error fetching products: ${fetchError.message}`);
    if (!products) throw new Error('No products found');

    console.log('Found products:', products);

    // Process each product
    const updates = products
      .filter(product => !product.trackable || product.business_code_if_vendor) // Update non-trackable AND vendor products
      .map(product => {
        const cartItem = cartItems.find(item => parseInt(item.id) === product.product_id);
        if (!cartItem) {
          console.log(`No cart item found for product ${product.product_id}`);
          return null;
        }

        console.log(`Processing product ${product.product_id}:`, {
          currentQuantity: product.quantity,
          cartQuantity: cartItem.quantity,
          isTrackable: product.trackable,
          isVendorProduct: !!product.business_code_if_vendor
        });

        const newQuantity = product.quantity - cartItem.quantity;
        if (newQuantity < 0) {
          throw new Error(`Insufficient quantity for product ID ${product.product_id}`);
        }

        return {
          id: product.product_id,
          newQuantity
        };
      })
      .filter(Boolean); // Remove null entries

    console.log('Updates to be made:', updates);

    // Update each product individually using PATCH
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: update.newQuantity })
        .eq('product_id', update.id);

      if (updateError) {
        throw new Error(`Error updating quantity for product ${update.id}: ${updateError.message}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating product quantities:', error);
    throw error;
  }
}
