import { useState } from 'react';
import { generateBarcode, printBarcodeWithSettings, getCachedBarcodeSettings, type BarcodeData } from '../services/barcodeService';

export const useBarcodeService = () => {
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
      console.log('Printing barcode with data:', data);
      
      // Use the new function that explicitly uses cached settings
      const success = await printBarcodeWithSettings(data);
      
      setIsPrinting(false);
      return success;
    } catch (err) {
      console.error('Error printing barcode:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsPrinting(false);
      return false;
    }
  };

  return {
    generateProductBarcode,
    printProductBarcode,
    isGenerating,
    isPrinting,
    error
  };
};