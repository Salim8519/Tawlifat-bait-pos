import React, { useState, useEffect, useRef } from 'react';
import { ScanLine } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';
import { playBeep } from '../../utils/sound';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onPartialMatch?: (partialBarcode: string) => void;
}

export function BarcodeScanner({ onScan, onPartialMatch }: BarcodeScannerProps) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [barcode, setBarcode] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyPressTime = useRef<number>(0);
  const focusInterval = useRef<number | null>(null);
  const barcodeBuffer = useRef<string>(''); // Buffer for fast input
  const bufferTimeout = useRef<number | null>(null);

  // Function to handle barcode submission
  const handleBarcodeSubmit = (code: string) => {
    if (code.length === 7) {
      playBeep(); // Play beep sound when valid barcode is scanned
      onScan(code);
      setBarcode(''); // Clear immediately
      barcodeBuffer.current = ''; // Clear buffer
    }
  };

  // Function to process buffered input
  const processBuffer = () => {
    if (bufferTimeout.current) {
      window.clearTimeout(bufferTimeout.current);
      bufferTimeout.current = null;
    }

    const code = barcodeBuffer.current;
    if (code.length === 7) {
      handleBarcodeSubmit(code);
    } else if (code.length > 7) {
      // If we somehow got more than 7 digits, take the last 7
      handleBarcodeSubmit(code.slice(-7));
    }
    barcodeBuffer.current = '';
  };

  // Maintain focus when scanner is active
  useEffect(() => {
    if (isListening) {
      // Initial focus
      inputRef.current?.focus();

      // Set up interval to check and restore focus
      focusInterval.current = window.setInterval(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }, 100);

      // Handle clicks anywhere on the document
      const handleClick = (e: MouseEvent) => {
        if (isListening) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      };

      document.addEventListener('click', handleClick, true);

      return () => {
        if (focusInterval.current) {
          window.clearInterval(focusInterval.current);
        }
        document.removeEventListener('click', handleClick, true);
      };
    } else if (focusInterval.current) {
      window.clearInterval(focusInterval.current);
    }
  }, [isListening]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isListening) return;

      const currentTime = Date.now();
      const timeSinceLastPress = currentTime - lastKeyPressTime.current;
      lastKeyPressTime.current = currentTime;

      // Handle numeric input
      if (/\d/.test(e.key) && e.key.length === 1) {
        e.preventDefault(); // Prevent default to avoid double input
        
        // Add to buffer
        barcodeBuffer.current += e.key;
        
        // Update display
        setBarcode(barcodeBuffer.current);

        // After 5 characters, start looking for matches
        if (barcodeBuffer.current.length >= 5) {
          onPartialMatch?.(barcodeBuffer.current);
        }

        // Reset timeout for processing buffer
        if (bufferTimeout.current) {
          window.clearTimeout(bufferTimeout.current);
        }
        // Reduced timeout to 20ms for faster processing
        bufferTimeout.current = window.setTimeout(processBuffer, 20);
      }

      // Handle Enter key
      if (e.key === 'Enter') {
        e.preventDefault();
        if (barcodeBuffer.current.length > 0) {
          processBuffer(); // Process whatever is in the buffer immediately
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress, true);
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [isListening, onScan, onPartialMatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 7); // Only allow digits, max 7
    
    // Update both buffer and display
    barcodeBuffer.current = newValue;
    setBarcode(newValue);
    
    // Start looking for matches after 5 characters
    if (newValue.length >= 5) {
      onPartialMatch?.(newValue);
    }
    
    // Process immediately if we have 7 digits
    if (newValue.length === 7) {
      processBuffer();
    }
  };

  const toggleScanner = () => {
    setIsListening(!isListening);
    setBarcode(''); // Clear barcode when toggling
    barcodeBuffer.current = ''; // Clear buffer when toggling
    if (!isListening) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <div className="flex space-x-2 space-x-reverse">
        <input
          ref={inputRef}
          type="text"
          maxLength={7}
          value={barcode}
          onChange={handleInputChange}
          placeholder={isListening ? t.readyToScan : t.enterManually}
          className={`flex-1 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            isListening ? 'bg-green-50' : ''
          }`}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          readOnly={isListening} // Make input readonly when scanner is active
        />
        <button
          onClick={toggleScanner}
          className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isListening
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500'
          }`}
          title={isListening ? t.stopScanning : t.startScanning}
        >
          <ScanLine className="w-5 h-5" />
        </button>
      </div>
      {isListening && (
        <div className="absolute -bottom-6 right-0 text-sm text-green-600">
          {t.scannerActive}
        </div>
      )}
    </div>
  );
}