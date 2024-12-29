import { useState } from 'react';
import { generateBarcode, printBarcode, type BarcodeData } from '../services/barcodeService';

export function useBarcodeService() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateProductBarcode = async (data: BarcodeData) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const barcode = generateBarcode(data);
      return barcode;
    } catch (err) {
      setError('Failed to generate barcode');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const printProductBarcode = async (data: BarcodeData) => {
    setIsPrinting(true);
    setError(null);
    
    try {
      const success = await printBarcode(data);
      if (!success) {
        throw new Error('Print failed');
      }
    } catch (err) {
      setError('Failed to print barcode');
      throw err;
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    generateProductBarcode,
    printProductBarcode,
    isGenerating,
    isPrinting,
    error
  };
}