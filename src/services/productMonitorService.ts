import { getProducts } from './productService';
import type { Product, ProductFilter } from '../types/product';
import { toast } from 'react-hot-toast';
import { ToastNotification } from '../components/common/ToastNotification';
import { createElement } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { productTranslations } from '../translations/products';

interface MonitorState {
  lastCheckedProducts: Product[];
  isInitialized: boolean;
}

const monitorState: MonitorState = {
  lastCheckedProducts: [],
  isInitialized: false,
};

let monitorInterval: NodeJS.Timeout | null = null;

const DEBUG = true; // Enable debug logging

export const startProductMonitoring = async (
  businessCode: string,
  role: string | undefined,
  branchName?: string,
  language: 'en' | 'ar' = 'en'
) => {
  // Check if user is logged in (has businessCode and role)
  if (!businessCode || !role) {
    if (DEBUG) console.log('Cannot start monitoring: Missing businessCode or role');
    return;
  }

  // Only allow monitoring for authorized roles
  if (!['cashier', 'manager', 'owner'].includes(role)) {
    if (DEBUG) console.log('Cannot start monitoring: Unauthorized role', role);
    return;
  }

  // For cashiers, branchName is required
  if (role === 'cashier' && !branchName) {
    if (DEBUG) console.log('Cannot start monitoring: Cashier requires branchName');
    return;
  }

  if (monitorInterval) {
    if (DEBUG) console.log('Clearing existing monitor interval');
    clearInterval(monitorInterval);
  }

  const t = productTranslations[language];

  const checkForNewProducts = async () => {
    try {
      if (DEBUG) console.log('Checking for new products...', { businessCode, role, branchName });
      
      // For cashiers, ensure we have a branch name
      if (role === 'cashier' && !branchName) {
        console.error('Cashier requires branch name for product monitoring');
        return;
      }

      const filters: ProductFilter = {
        businessCode,
        branchName: role === 'cashier' ? branchName : undefined,
        page: 'upcoming_products',
        searchQuery: undefined,
        accepted: false // Only check for pending products
      };

      if (DEBUG) console.log('Applying filters:', filters);

      const currentProducts = await getProducts(filters);
      if (DEBUG) console.log('Current products:', currentProducts.length);
      
      // For cashiers, show notification for existing pending products on first load
      if (!monitorState.isInitialized && role === 'cashier' && currentProducts.length > 0) {
        if (DEBUG) console.log('First load for cashier, showing notification for existing products');
        showNotification(currentProducts.length, language);
      } else if (monitorState.isInitialized) {
        // Find new products only after initialization
        const newProducts = currentProducts.filter(current => 
          !monitorState.lastCheckedProducts.some(last => 
            last.product_id === current.product_id
          )
        );

        if (DEBUG) console.log('New products found:', newProducts.length);

        // Show toast for new products
        if (newProducts.length > 0) {
          showNotification(newProducts.length, language);
        }
      }

      // Update last checked products
      monitorState.lastCheckedProducts = currentProducts;
      monitorState.isInitialized = true;
      
    } catch (error) {
      console.error('Error checking for new products:', error);
    }
  };

  // Helper function to show notification
  const showNotification = (count: number, language: 'en' | 'ar') => {
    if (DEBUG) console.log('Showing notification for', count, 'products');
    
    const message = language === 'ar' 
      ? `${count} منتجات جديدة في قائمة الانتظار`
      : `${count} new products awaiting review`;
    
    const subMessage = language === 'ar' ? 'اضغط للمراجعة' : 'Click to review';
    const actionText = language === 'ar' ? 'مراجعة' : 'Review';
    
    try {
      toast.custom((t) => 
        createElement(ToastNotification, {
          visible: t.visible,
          message,
          subMessage,
          actionText,
          language,
          onAction: () => {
            window.location.href = '/upcoming-products';
            toast.dismiss(t.id);
          },
          onIgnore: () => {
            toast.dismiss(t.id);
          }
        })
      , {
        duration: 8000,
        position: language === 'ar' ? 'top-left' : 'top-right',
      });
      
      if (DEBUG) console.log('Toast shown successfully');
    } catch (toastError) {
      console.error('Error showing toast:', toastError);
    }
  };

  // Initial check
  if (DEBUG) console.log('Running initial product check');
  await checkForNewProducts();

  // Start monitoring every 30 seconds
  if (DEBUG) console.log('Starting monitor interval');
  monitorInterval = setInterval(checkForNewProducts, 30000);
};

export const stopProductMonitoring = () => {
  if (monitorInterval) {
    if (DEBUG) console.log('Stopping product monitoring');
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  monitorState.isInitialized = false;
  monitorState.lastCheckedProducts = [];
};
