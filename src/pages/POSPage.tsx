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
import { incrementCouponUses } from '../services/couponService';
import { updateVendorTransactionsFromSale } from '../services/updateVendorTransactionsService';
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
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
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
        setLoading(true);
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
          setLoading(false);
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
      category: product.category || '',
      expiryDate: product.expiry_date || undefined,
      // Ensure maxQuantity is set correctly for all products
      maxQuantity: product.trackable ? undefined : product.quantity,
      trackable: product.trackable,
      vendorId: product.business_code_if_vendor || '',
      vendorName: product.business_name_of_product || '',
      vendorPrice: product.vendorPrice || 0,
      business_code_if_vendor: product.business_code_if_vendor,
      business_name_if_vendor: product.business_name_of_product,
      imageUrl: product.image_url,
      description: product.description,
      // Add current quantity for validation
      _currentStock: product.quantity
    });
  };

  const handlePartialBarcodeMatch = (partialBarcode: string) => {
    // Filter products that match the partial barcode
    const matches = products.filter(p => 
      p.barcode && p.barcode.startsWith(partialBarcode)
    );
    
    // If only one match and it's exact, do NOT trigger handleScan as it will be triggered by the scanner component
    if (matches.length === 1 && matches[0].barcode === partialBarcode) {
      return; // Don't trigger handleScan here, let the scanner component handle it
    }
  };

  const addToCart = (product: CartItemType) => {
    console.log('=== Adding Product to Cart ===');
    console.log('Product Details:', {
      id: product.id,
      name: product.nameAr,
      isVendorProduct: !!product.business_code_if_vendor,
      trackable: product.trackable,
      maxQuantity: product.maxQuantity,
      currentStock: product._currentStock
    });

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      
      console.log('Cart State:', {
        existingInCart: !!existingItem,
        currentQuantity,
        maxAllowed: product.maxQuantity,
        wouldExceedLimit: (!product.trackable || product.business_code_if_vendor) && currentQuantity >= (product.maxQuantity || 0)
      });

      // Check quantity for both non-trackable and vendor products
      if (!product.trackable || product.business_code_if_vendor) {
        if (currentQuantity >= (product.maxQuantity || 0)) {
          console.log('❌ Quantity validation failed:', {
            currentQuantity,
            maxQuantity: product.maxQuantity,
            reason: 'Would exceed available stock'
          });
          setError(t.outOfStock.replace('{product}', product.nameAr));
          return prevCart;
        }
      }
      
      console.log('✅ Quantity validation passed:', {
        currentQuantity,
        maxQuantity: product.maxQuantity,
        newQuantity: currentQuantity + 1
      });

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Add metadata for future reference
      const enrichedProduct = {
        ...product,
        quantity: 1,
        _metadata: {
          vendor: {
            code: product.vendorId || '',
            name: product.vendorName || '',
            business_code: product.business_code_if_vendor || '',
            business_name: product.business_name_if_vendor || ''
          },
          sale: {
            business_code: user?.businessCode || '',
            business_name: user?.businessName || '',
            branch_name: selectedBranchId || '',
            sale_date: new Date().toISOString()
          },
          product: {
            original_price: product.price,
            vendor_price: product.vendorPrice || 0,
            is_vendor_supplied: !!product.business_code_if_vendor
          }
        }
      };

      // Log vendor product metadata if it's a vendor product
      if (enrichedProduct._metadata.product.is_vendor_supplied) {
        console.log('=== Vendor Product Added to Cart ===');
        console.log('Product Name:', product.nameAr);
        console.log('Vendor Details:', {
          code: enrichedProduct._metadata.vendor.code,
          name: enrichedProduct._metadata.vendor.name,
          business: enrichedProduct._metadata.vendor.business_name,
          business_code: enrichedProduct._metadata.vendor.business_code
        });
        console.log('Price Details:', {
          selling_price: product.price,
          original_price: enrichedProduct._metadata.product.original_price,
          vendor_price: enrichedProduct._metadata.product.vendor_price
        });
        console.log('Sale Context:', {
          business: enrichedProduct._metadata.sale.business_name,
          branch: enrichedProduct._metadata.sale.branch_name,
          date: enrichedProduct._metadata.sale.sale_date
        });
        console.log('===============================');
      }
      
      return [...prevCart, enrichedProduct];
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
    if (!user?.businessCode) return;

    try {
      const subtotal = calculateSubtotal();
      const { coupon, error } = await validateCoupon(code, user.businessCode, subtotal);
      
      if (error) {
        setDiscountError(error);
        setAppliedCoupon(null);
        return;
      }

      if (coupon) {
        setAppliedCoupon(coupon);
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setDiscountError(t.invalidCoupon);
      setAppliedCoupon(null);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    let totalDiscount = 0;

    // Calculate manual discount
    if (appliedDiscount) {
      const manualDiscount = appliedDiscount.type === 'percentage'
        ? (subtotal * (appliedDiscount.value / 100))
        : appliedDiscount.value;
      totalDiscount += manualDiscount;
    }

    // Calculate coupon discount
    if (appliedCoupon) {
      const couponDiscount = appliedCoupon.discount_type === 'percentage'
        ? (subtotal * (appliedCoupon.discount_value / 100))
        : appliedCoupon.discount_value;
      totalDiscount += couponDiscount;
    }

    // Ensure total discount doesn't exceed subtotal
    return Math.min(totalDiscount, subtotal);
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
    return Number((subtotal - discount + tax).toFixed(3));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      // Process receipt first before showing confirmation
      const receipt = await processReceipt(
        cart,
        selectedCustomer,
        paymentMethod,
        calculateDiscount(),
        appliedCoupon,
        cartNotes
      );

      if (receipt && appliedCoupon && user?.businessCode) {
        // Increment coupon uses after successful checkout
        await incrementCouponUses(appliedCoupon.coupon_code, user.businessCode);
      }

      setCurrentReceipt(receipt);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error processing receipt:', error);
      setError(t.errorProcessingReceipt);
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
      
      // For cash payments, ensure cash tracking is updated first
      if (paymentMethod === 'cash') {
        console.log('Updating cash tracking...');
        try {
          await updateCashForSale(
            user!.businessCode,
            selectedBranch.branch_name,
            user!.name,
            calculateTotal()
          );
        } catch (error) {
          console.error('Failed to update cash tracking:', error);
          setError(t.errorUpdatingCash);
          return; // Stop the process if cash tracking fails
        }
      }

      // After cash is confirmed, proceed with other updates
      console.log('Updating quantities for cart:', cart);
      
      // Update product quantities for non-trackable products
      try {
        await updateProductQuantitiesAfterSale(
          cart,
          user!.businessCode,
          selectedBranch.branch_name
        );
      } catch (error) {
        console.error('Failed to update quantities:', error);
        setError(t.errorUpdatingQuantities);
        return;
      }

      // Update vendor transactions for vendor products
      try {
        // Use the ensureBusinessName function to get a valid business name
        const { ensureBusinessName } = await import('../services/businessService');
        const businessName = await ensureBusinessName(user!.businessCode, user!.businessName);
        
        await updateVendorTransactionsFromSale(
          cart,
          user!.businessCode,
          businessName,
          selectedBranch.branch_name,
          settings.vendor_commission_enabled,
          settings.default_commission_rate,
          settings.minimum_commission_amount
        );
      } catch (error) {
        console.error('Failed to update vendor transactions:', error);
        // Log error but continue as this is not critical for the sale
      }

      // Update customer order information if a customer is selected
      if (selectedCustomer) {
        console.log('Updating customer order information...');
        try {
          await updateCustomerOrderInfo(
            selectedCustomer.id,
            user!.businessCode
          );
        } catch (error) {
          console.error('Failed to update customer info:', error);
          // Log error but continue as this is not critical for the sale
        }
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

        <div className="flex-1 p-2 overflow-y-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
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
                product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.barcode && product.barcode.includes(searchQuery))
              )
              .map((product) => {
                // Check if product can be added to cart
                const cartItem = cart.find(item => item.id === product.product_id.toString());
                const currentQuantity = cartItem ? cartItem.quantity : 0;
                
                console.log('Rendering Product:', {
                  id: product.product_id,
                  name: product.product_name,
                  isVendorProduct: !!product.business_code_if_vendor,
                  trackable: product.trackable,
                  quantity: product.quantity,
                  currentInCart: currentQuantity
                });

                // Apply quantity validation for both owner and vendor products
                const isDisabled = (!product.trackable || product.business_code_if_vendor) && (
                  currentQuantity >= product.quantity || 
                  product.quantity <= 0
                );

                console.log('Product State:', {
                  isDisabled,
                  reason: isDisabled ? 'Out of stock or max quantity reached' : 'Available',
                  availableQuantity: product.quantity,
                  currentInCart: currentQuantity
                });
                
                return (
                  <div
                    key={product.product_id}
                    onClick={() => {
                      if (!isDisabled) {
                        console.log('Attempting to add product:', {
                          id: product.product_id,
                          name: product.product_name,
                          currentQuantity,
                          availableQuantity: product.quantity
                        });

                        // Validate quantity before adding to cart
                        if ((!product.trackable || product.business_code_if_vendor) && currentQuantity >= product.quantity) {
                          console.log('❌ Click validation failed:', {
                            currentQuantity,
                            availableQuantity: product.quantity,
                            reason: 'Would exceed available stock'
                          });
                          setError(t.outOfStock.replace('{product}', product.product_name));
                          return;
                        }
                        
                        console.log('✅ Click validation passed, proceeding to add to cart');
                        addToCart({
                          id: product.product_id.toString(),
                          barcode: product.barcode || '',
                          nameAr: product.product_name,
                          type: product.type,
                          price: calculatePriceWithCommission(product),
                          quantity: 1,
                          category: product.category || '',
                          expiryDate: product.expiry_date || undefined,
                          // Set maxQuantity for all vendor products and non-trackable products
                          maxQuantity: (!product.trackable || product.business_code_if_vendor) ? product.quantity : undefined,
                          trackable: product.trackable,
                          vendorId: product.business_code_if_vendor || '',
                          vendorName: product.business_name_of_product || '',
                          vendorPrice: product.vendorPrice || 0,
                          business_code_if_vendor: product.business_code_if_vendor,
                          business_name_if_vendor: product.business_name_of_product,
                          imageUrl: product.image_url,
                          description: product.description,
                          // Add current quantity for validation
                          _currentStock: product.quantity
                        });
                      }
                    }}
                    className={`bg-white rounded-lg shadow p-2 transition-shadow flex flex-col ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-square w-full bg-gray-100 rounded-md mb-2 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-h-0">
                      <h3 className="font-medium text-sm leading-tight line-clamp-2">{product.product_name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1 text-xs">
                        <span className="text-gray-500">
                          {product.type === 'food' ? t.food : t.product}
                        </span>
                        {product.business_name_of_product && (
                          <span className="text-indigo-600">
                            {product.business_name_of_product}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-indigo-600">
                        {calculatePriceWithCommission(product).toFixed(2)} {t.currency}
                      </div>
                      {product.type === 'food' && product.expiry_date && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t.expiryDate}: {new Date(product.expiry_date).toLocaleDateString()}
                        </p>
                      )}
                      <div className="mt-0.5 flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          {t.inStock}: {product.quantity}
                        </span>
                        {isDisabled && (!product.trackable || product.business_code_if_vendor) && (
                          <span className="text-red-500">
                            {language === 'ar' ? 'نفذت' : 'Out'}
                          </span>
                        )}
                      </div>
                    </div>
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

        {/* Hide Discount Section */}
        {/* <DiscountSection
          subtotal={calculateSubtotal()}
          onApplyDiscount={handleApplyDiscount}
          onApplyCoupon={handleApplyCoupon}
          appliedDiscount={appliedDiscount}
          appliedCoupon={appliedCoupon}
          error={discountError}
        /> */}

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