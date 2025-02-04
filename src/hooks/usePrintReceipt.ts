import { useState, useEffect } from 'react';
import { printReceipt } from '../services/printReceiptService';
import type { Receipt } from '../services/receiptService';
import type { CartItem } from '../types/pos';
import { getCookie, setCookie } from '../utils/cookies';

const PRINTER_SIZE_COOKIE = 'preferred_printer_size';

export type PrinterWidth = '57mm' | '80mm' | '85mm';

export function usePrintReceipt() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPrinterWidth, setSelectedPrinterWidth] = useState<PrinterWidth>(() => {
    // Get saved printer size from cookie or default to 80mm
    return (getCookie(PRINTER_SIZE_COOKIE) as PrinterWidth) || '80mm';
  });

  // Update cookie when printer size changes
  const updatePrinterWidth = (width: PrinterWidth) => {
    setSelectedPrinterWidth(width);
    setCookie(PRINTER_SIZE_COOKIE, width);
  };

  const print = async (receipt: Receipt, cartItems: CartItem[]) => {
    try {
      setIsPrinting(true);
      setError(null);
      
      const success = await printReceipt(receipt, cartItems, selectedPrinterWidth);
      
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
