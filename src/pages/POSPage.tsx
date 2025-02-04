import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { CustomerSearch } from '../components/pos/CustomerSearch';
import { BarcodeScanner } from '../components/pos/BarcodeScanner';
import { CartItem } from '../components/pos/CartItem';
import { ConfirmationPage } from '../components/pos/ConfirmationPage';
import { CartNotes } from '../components/pos/CartNotes';
import { DiscountSection } from '../components/pos/DiscountSection';
import { PaymentMethods, type PaymentMethod } from '../components/pos/PaymentMethods';
import { BranchPOSSelector } from '../components/pos/BranchPOSSelector';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useReceipt } from '../hooks/useReceipt';
import { updateCashForSale } from '../services/cashTrackingService';
import { getBranchesByBusinessCode } from '../services/businessService';
import { posTranslations } from '../translations/pos';
import { getAvailableProducts } from '../services/posService';
import { validateCoupon } from '../services/couponService';
import { updateProductQuantitiesAfterSale } from '../services/inventoryService';
import { processReceipt } from '../services/receiptService';
import { updateCustomerOrderInfo } from '../services/customerService';
import type { CartItem as CartItemType, Customer, Discount } from '../types/pos';
import type { Product } from '../types/product';

export function POSPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { branches } = useBusinessStore();
  const { settings } = useSettingsStore();
  const t = posTranslations[language];
  
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartNotes, setCartNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { processReceipt, isProcessing, error: receiptError, receiptText } = useReceipt();
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [changeDue, setChangeDue] = useState<number>(0);
  const [cashError, setCashError] = useState<string | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const selectedBranch = branches.find(b => b.branch_id === selectedBranchId);

  // Function to load products
  const loadProducts = useCallback(async () => {
    if (!user?.businessCode || !selectedBranch) return;
    
    try {
      const products = await getAvailableProducts(user.businessCode, selectedBranch.branch_name);
      setProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(t.errorLoadingProducts);
    } finally {
      setLoading(false);
    }
  }, [user?.businessCode, selectedBranch, t.errorLoadingProducts]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const loadBranches = async () => {
      if (user?.businessCode) {
        setIsLoading(true);
        try {
          const branchData = await getBranchesByBusinessCode(user.businessCode);
          useBusinessStore.setState(state => ({
            ...state,
            branches: branchData
          }));
          setIsInitialLoad(false);
        } catch (error) {
          console.error('Error loading branches:', error);
          setError(t.errorLoadingBranches);
          setIsInitialLoad(false);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadBranches();
  }, [user?.businessCode]);

  useEffect(() => {
    // Only load products after initial branch load and when we have a selected branch
    if (!isInitialLoad && user?.businessCode && selectedBranchId) {
      loadProducts();
    }
  }, [user?.businessCode, selectedBranchId, isInitialLoad]);

  const calculatePriceWithCommission = (product: Product): number => {
    // Only apply commission to vendor products if enabled in settings
    if (!settings || !settings.vendor_commission_enabled || !product.business_code_if_vendor) {
      return product.price;
    }

    // Check if the price meets minimum commission amount
    if (product.price < (settings.minimum_commission_amount || 0)) {
      return product.price;
    }

    // Calculate commission
    const commission = (product.price * settings.default_commission_rate) / 100;
    return product.price + commission;
  };

  const handleScan = (barcode: string) => {
    // Prevent duplicate scans within 500ms (reduced from 1s for better responsiveness)
    const now = Date.now();
    if (now - lastScanTime < 500) {
      console.log('Ignoring duplicate scan');
      return;
    }
    setLastScanTime(now);

    const product = products.find(p => p.barcode === barcode);
    if (!product) {
      console.log('Product not found');
      return;
    }

    // Check if product is already in cart
    const cartItem = cart.find(item => item.id === product.product_id.toString());
    
    // For non-trackable products, check quantity
    if (!product.trackable) {
      const currentQuantity = cartItem ? cartItem.quantity : 0;
      if (currentQuantity >= product.quantity) {
        setError(t.outOfStock.replace('{product}', product.product_name));
        return;
      }
    }

    addToCart({
      id: product.product_id.toString(),
      barcode: product.barcode || '',
      nameAr: product.product_name,
      type: product.type,
      price: calculatePriceWithCommission(product),
      quantity: 1,
      category: '',
      expiryDate: product.expiry_date || undefined,
      maxQuantity: product.trackable ? undefined : product.quantity,
      trackable: product.trackable
    });
  };

  const handlePartialBarcodeMatch = (partialBarcode: string) => {
    // Filter products that match the partial barcode
    const matches = products.filter(p => 
      p.barcode && p.barcode.startsWith(partialBarcode)
    );
    
    // If only one match and it's exact, treat it as a full scan
    if (matches.length === 1 && matches[0].barcode === partialBarcode) {
      handleScan(partialBarcode);
    }
  };

  const addToCart = (product: CartItemType) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      // If item exists, check quantity limits
      if (existingItem) {
        // For non-trackable products, check quantity
        if (!product.trackable && existingItem.quantity >= (product.maxQuantity || 0)) {
          setError(t.outOfStock.replace('{product}', product.nameAr));
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateCartItemQuantity = (id: string, quantity: number) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === id);
      if (!item) return prevCart;

      // For non-trackable items, check quantity limits
      if (!item.trackable && quantity > (item.maxQuantity || 0)) {
        setError(t.outOfStock.replace('{product}', item.nameAr));
        return prevCart;
      }

      return quantity === 0
        ? prevCart.filter(item => item.id !== id)
        : prevCart.map(item =>
            item.id === id ? { ...item, quantity } : item
          );
    });
  };

  const updateCartItemNotes = (id: string, notes: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, notes } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleApplyDiscount = (discount: Discount) => {
    setDiscountError(null);
    const subtotal = calculateSubtotal();
    
    // Validate discount
    if (discount.type === 'fixed' && discount.value > subtotal) {
      setDiscountError(t.discountExceedsTotal);
      return;
    }
    
    if (discount.type === 'percentage' && discount.value > 100) {
      setDiscountError(t.invalidPercentage);
      return;
    }
    
    setAppliedDiscount(discount);
  };

  const handleApplyCoupon = async (code: string) => {
    setDiscountError(null);
    try {
      const coupon = await validateCoupon(code, user!.businessCode);
      if (coupon) {
        setAppliedCoupon(code);
        // Apply coupon discount
        setAppliedDiscount({
          type: coupon.discount_type,
          value: coupon.discount_value
        });
      }
    } catch (error) {
      setDiscountError(error instanceof Error ? error.message : t.invalidCoupon);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!appliedDiscount) return 0;
    const subtotal = calculateSubtotal();
    return appliedDiscount.type === 'fixed'
      ? appliedDiscount.value
      : (subtotal * appliedDiscount.value) / 100;
  };

  const calculateTax = () => {
    if (!settings?.tax_enabled) return 0;
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return ((subtotal - discount) * settings.tax_rate) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Process receipt first before showing confirmation
    const receipt = await processReceipt(
      cart,
      selectedCustomer,
      paymentMethod,
      calculateDiscount(),
      appliedCoupon,
      cartNotes
    );

    if (receipt) {
      setCurrentReceipt(receipt);
      setShowConfirmation(true);
    }
  };

  const handleConfirmCheckout = async () => {
    console.log('Starting checkout confirmation...');
    if (!currentReceipt) {
      console.log('No current receipt, aborting');
      return;
    }

    if (!selectedBranch) {
      console.log('No branch selected');
      setError(t.noBranchSelected);
      return;
    }

    try {
      console.log('Processing payment:', paymentMethod);
      
      // Update cash tracking for cash payments
      if (paymentMethod === 'cash') {
        console.log('Updating cash tracking...');
        await updateCashForSale(
          user!.businessCode,
          selectedBranch.branch_name,
          user!.name,
          calculateTotal()
        );
      }

      console.log('Updating quantities for cart:', cart);
      
      // Update product quantities for non-trackable products
      await updateProductQuantitiesAfterSale(
        cart,
        user!.businessCode,
        selectedBranch.branch_name
      ).catch(error => {
        console.error('Failed to update quantities:', error);
        throw error;
      });

      // Update customer order information if a customer is selected
      if (selectedCustomer) {
        console.log('Updating customer order information...');
        await updateCustomerOrderInfo(
          selectedCustomer.id,
          user!.businessCode
        ).catch(error => {
          console.error('Failed to update customer info:', error);
          // Don't throw here as this is not critical for the sale
        });
      }

      // Refresh products list to show updated quantities
      await loadProducts();

      console.log('Sale completed successfully, resetting state...');
      
      // Clear cart and reset state
      setCart([]);
      setSelectedCustomer(null);
      setCartNotes('');
      setPaymentMethod('cash');
      setShowConfirmation(false);
      setAppliedDiscount(null);
      setAppliedCoupon(null);
      setCashReceived('');
      setChangeDue(0);
      setCashError(null);
      setCurrentReceipt(null);
    } catch (error) {
      console.error('Error processing sale:', error);
      setError(typeof error === 'string' ? error : 
        error instanceof Error ? error.message : t.saleError);
    }
  };

  const handleCashAmountChange = (amount: string) => {
    setCashReceived(amount);
    setCashError(null);
    
    const receivedAmount = parseFloat(amount);
    const totalAmount = calculateTotal();
    
    if (!isNaN(receivedAmount) && receivedAmount >= totalAmount) {
      setChangeDue(receivedAmount - totalAmount);
    } else {
      setChangeDue(0);
    }
  };

  return (
    <div className="h-full flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-full">
              <BarcodeScanner 
                onScan={handleScan} 
                onPartialMatch={handlePartialBarcodeMatch}
              />
              <div className="mt-4">
                <BranchPOSSelector onBranchChange={setSelectedBranchId} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchProduct}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              <p className="col-span-full text-center py-8 text-gray-500">
                {t.loading}
              </p>
            ) : error ? (
              <div className="col-span-full text-center py-8">
                <p className="text-red-500 mb-2">{error}</p>
                <span
                  onClick={loadProducts}
                  className="mt-2 text-indigo-600 hover:text-indigo-800"
                >
                  {t.retry}
                </span>
              </div>
            ) : products
              .filter(product => 
                product.product_name.includes(searchQuery) ||
                (product.barcode && product.barcode.includes(searchQuery))
              )
              .map((product) => {
                // Check if product can be added to cart
                const cartItem = cart.find(item => item.id === product.product_id.toString());
                const currentQuantity = cartItem ? cartItem.quantity : 0;
                const isDisabled = !product.trackable && currentQuantity >= product.quantity;
                
                return (
                  <div
                    key={product.product_id}
                    onClick={() => {
                      if (!isDisabled) {
                        addToCart({
                          id: product.product_id.toString(),
                          barcode: product.barcode || '',
                          nameAr: product.product_name,
                          type: product.type,
                          price: calculatePriceWithCommission(product),
                          quantity: 1,
                          category: '',
                          expiryDate: product.expiry_date || undefined,
                          maxQuantity: product.trackable ? undefined : product.quantity,
                          trackable: product.trackable
                        });
                      }
                    }}
                    className={`bg-white rounded-lg shadow p-4 transition-shadow ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-square bg-gray-100 rounded-md mb-3">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.product_name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      )}
                    </div>
                    <h3 className="font-medium">{product.product_name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.type === 'food' ? t.food : t.product}
                      {product.business_name_of_product && (
                        <span className="mr-1 text-xs text-indigo-600">
                          ({product.business_name_of_product})
                        </span>
                      )}
                    </p>
                    {product.type === 'food' && product.expiry_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t.expiryDate}: {new Date(product.expiry_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {t.inStock}: {product.quantity}
                      {isDisabled && !product.trackable && (
                        <span className="text-red-500 text-xs mr-1">
                          {language === 'ar' ? ' - نفذت الكمية' : ' - Out of stock'}
                        </span>
                      )}
                    </p>
                    <p className="text-indigo-600 font-bold mt-1">
                      {calculatePriceWithCommission(product).toFixed(3)} {t.currency}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold mr-2">{t.cart}</h2>
            </div>
            {selectedCustomer && (
              <div className="flex items-center">
                <div className="text-sm">
                  <span className="font-bold text-gray-900">{selectedCustomer.name}</span>
                  <div className="text-xs text-gray-500">
                    {selectedCustomer.phone}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <CustomerSearch
          onCustomerSelect={(customer) => {
            setSelectedCustomer(customer);
            if (!customer) {
              // Clear any customer-specific data if needed
              // For example, if you have customer-specific discounts or notes
              setAppliedDiscount(null);
              setAppliedCoupon(null);
            }
          }}
        />

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t.noItems}</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const product = products.find(p => p.product_id.toString() === item.id);
                return (
                  <CartItem
                    key={item.id}
                    item={item}
                    availableQuantity={product?.quantity || 0}
                    isTrackable={product?.trackable || false}
                    onUpdateQuantity={updateCartItemQuantity}
                    onRemove={removeFromCart}
                  />
                );
              })}
            </div>
          )}
        </div>

        <DiscountSection
          subtotal={calculateSubtotal()}
          onApplyDiscount={handleApplyDiscount}
          onApplyCoupon={handleApplyCoupon}
          appliedDiscount={appliedDiscount || undefined}
          appliedCoupon={appliedCoupon || undefined}
          error={discountError}
        />
        
        <PaymentMethods
          selectedMethod={paymentMethod}
          onMethodChange={setPaymentMethod}
        />
        
        <CartNotes
          notes={cartNotes}
          onNotesChange={setCartNotes}
        />

        <div className="border-t p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t.subtotal}:</span>
              <span>{calculateSubtotal().toFixed(3)} {t.currency}</span>
            </div>
            
            {appliedDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.discount}:</span>
                <span className="text-red-600">
                  -{calculateDiscount().toFixed(3)} {t.currency}
                </span>
              </div>
            )}
            
            {settings?.tax_enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.tax} ({settings.tax_rate}%):</span>
                <span>{calculateTax().toFixed(3)} {t.currency}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>{t.total}:</span>
              <span>{calculateTotal().toFixed(3)} {t.currency}</span>
            </div>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? t.processing : t.checkout}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && currentReceipt && (
        <ConfirmationPage
          total={calculateTotal()}
          subtotal={calculateSubtotal()}
          discount={calculateDiscount()}
          taxAmount={calculateTax()}
          paymentMethod={paymentMethod}
          customer={selectedCustomer}
          settings={settings}
          cart={cart}
          receiptId={currentReceipt.receiptId}
          branchName={selectedBranch?.branch_name || ''}
          cashierName={user?.name || ''}
          couponCode={appliedCoupon?.code}
          notes={cartNotes}
          onConfirm={handleConfirmCheckout}
          onCancel={() => setShowConfirmation(false)}
          receipt={currentReceipt}
        />
      )}
    </div>
  );
}

// Mock data - replace with actual API calls
const mockProducts: CartItemType[] = [
  {
    id: '1',
    barcode: '123456789',
    nameAr: 'تفاح أحمر',
    type: 'food',
    price: 2.99,
    quantity: 100,
    category: 'فواكه',
    expiryDate: '2024-03-20',
    preparationDate: '2024-03-01'
  },
  {
    id: '2',
    barcode: '987654321',
    nameAr: 'عصير برتقال',
    type: 'food',
    price: 1.99,
    quantity: 50,
    category: 'مشروبات',
    expiryDate: '2024-03-15',
    preparationDate: '2024-03-01'
  },
  {
    id: '3',
    barcode: '456789123',
    nameAr: 'منظف متعدد الأغراض',
    type: 'non-food',
    price: 4.99,
    quantity: 30,
    category: 'منظفات'
  }
];