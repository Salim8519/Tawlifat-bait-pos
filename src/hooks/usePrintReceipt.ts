import { useState, useEffect } from 'react';
import { printReceiptV2 } from '../services/printReceiptServiceV2';
import type { Receipt } from '../services/receiptService';
import type { CartItem } from '../types/pos';
import { getCookie, setCookie } from '../utils/cookies';

const PRINTER_SIZE_COOKIE = 'preferred_printer_size';
const AUTO_DETECT_SIZE = 'auto';

// Allow 'auto' or any numeric width as a string
export type PrinterWidth = 'auto' | string;

/**
 * Helper function to get printer width from both cookie and localStorage
 * for backward compatibility
 */
function getSavedPrinterWidth(): PrinterWidth {
  // First try to get from cookie
  const cookieValue = getCookie(PRINTER_SIZE_COOKIE);
  if (cookieValue) {
    return cookieValue;
  }
  
  // Then try localStorage
  try {
    const localStorageValue = localStorage.getItem(PRINTER_SIZE_COOKIE);
    if (localStorageValue) {
      // Check if it's a JSON object (new format)
      try {
        const parsed = JSON.parse(localStorageValue);
        // Extract just the width value without 'mm'
        if (parsed.width) {
          return parsed.width.replace('mm', '');
        }
      } catch (e) {
        // If not JSON, it's probably just a string value
        return localStorageValue;
      }
    }
  } catch (e) {
    console.log('Error reading from localStorage', e);
  }
  
  // Default to auto if nothing found
  return AUTO_DETECT_SIZE;
}

/**
 * Helper function to save printer width to both cookie and localStorage
 * for maximum compatibility
 */
function savePrinterWidth(width: PrinterWidth): void {
  // Save to cookie
  setCookie(PRINTER_SIZE_COOKIE, width);
  
  // Save to localStorage as string
  try {
    localStorage.setItem(PRINTER_SIZE_COOKIE, width);
  } catch (e) {
    console.log('Error saving to localStorage', e);
  }
}

export function usePrintReceipt() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPrinterWidth, setSelectedPrinterWidth] = useState<PrinterWidth>(() => {
    // Get saved printer size from cookie/localStorage or default to auto
    return getSavedPrinterWidth();
  });

  // Update cookie and localStorage when printer size changes
  const updatePrinterWidth = (width: PrinterWidth) => {
    setSelectedPrinterWidth(width);
    savePrinterWidth(width);
  };

  const print = async (receipt: Receipt, cartItems: CartItem[]) => {
    try {
      setIsPrinting(true);
      setError(null);
      
      // If auto is selected, pass undefined to let the service auto-detect
      // Otherwise pass the selected width
      const printerWidth = selectedPrinterWidth === AUTO_DETECT_SIZE 
        ? undefined 
        : selectedPrinterWidth;
      
      const success = await printReceiptV2(receipt, cartItems, printerWidth, {
        padding: '0mm',
        margin: '1mm'
      });
      
      if (!success) {
        throw new Error('Failed to print receipt');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error printing receipt:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    print,
    isPrinting,
    error,
    selectedPrinterWidth,
    setSelectedPrinterWidth: updatePrinterWidth,
  };
}
