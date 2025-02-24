import React, { useState, useEffect, useRef } from 'react';
import { ScanLine } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';
import { playBeep } from '../../utils/sound';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onPartialMatch?: (partialBarcode: string) => void;
}

const MIN_SCANNER_TIMEOUT = 20;  // Fastest scanner timeout (ms)
const MAX_SCANNER_TIMEOUT = 100; // Slowest scanner timeout (ms)
const MANUAL_INPUT_TIMEOUT = 1000; // Manual input timeout (ms)
const SCANNER_SPEED_THRESHOLD = 50; // Time between keypresses to detect scanner (ms)

export function BarcodeScanner({ onScan, onPartialMatch }: BarcodeScannerProps) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [barcode, setBarcode] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyPressTime = useRef<number>(0);
  const focusInterval = useRef<number | null>(null);
  const barcodeBuffer = useRef<string>('');
  const bufferTimeout = useRef<number | null>(null);
  const isManualInput = useRef<boolean>(false);
  const scannerSpeedHistory = useRef<number[]>([]);
  const lastProcessedBarcode = useRef<string>('');
  const lastProcessedTime = useRef<number>(0);

  // Calculate adaptive scanner timeout based on speed history
  const calculateScannerTimeout = () => {
    if (scannerSpeedHistory.current.length === 0) return MAX_SCANNER_TIMEOUT;
    
    // Calculate average speed from last 5 scans
    const recentSpeeds = scannerSpeedHistory.current.slice(-5);
    const avgSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;
    
    // Add 20ms buffer to the average speed, but keep within bounds
    return Math.min(Math.max(avgSpeed + 20, MIN_SCANNER_TIMEOUT), MAX_SCANNER_TIMEOUT);
  };

  // Function to handle barcode submission
  const handleBarcodeSubmit = (code: string, isManual: boolean = false) => {
    const now = Date.now();
    
    // Prevent duplicate submissions within the scanner timeout period
    if (code === lastProcessedBarcode.current && 
        now - lastProcessedTime.current < calculateScannerTimeout()) {
      console.log('Preventing duplicate scan:', code);
      return;
    }

    if (code.length === 7) {
      playBeep();
      lastProcessedBarcode.current = code;
      lastProcessedTime.current = now;
      onScan(code);
      
      // Clear the input and buffer
      setBarcode('');
      barcodeBuffer.current = '';
      isManualInput.current = false;
    }
  };

  // Function to process buffered input
  const processBuffer = (force: boolean = false) => {
    if (bufferTimeout.current) {
      window.clearTimeout(bufferTimeout.current);
      bufferTimeout.current = null;
    }

    const code = barcodeBuffer.current;
    if (code.length === 7) {
      handleBarcodeSubmit(code, isManualInput.current);
    } else if (code.length > 7) {
      // If we somehow got more than 7 digits, take the last 7
      handleBarcodeSubmit(code.slice(-7), isManualInput.current);
    } else if (force && code.length > 0) {
      // Only clear partial input if forced (e.g., on blur or toggle)
      setBarcode('');
      barcodeBuffer.current = '';
    }
  };

  // Maintain focus when scanner is active
  useEffect(() => {
    if (isListening) {
      inputRef.current?.focus();

      focusInterval.current = window.setInterval(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }, 100);

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
      
      // Update scanner speed history for hardware scanners
      if (timeSinceLastPress < SCANNER_SPEED_THRESHOLD) {
        scannerSpeedHistory.current.push(timeSinceLastPress);
        // Keep only last 10 measurements
        if (scannerSpeedHistory.current.length > 10) {
          scannerSpeedHistory.current.shift();
        }
      }
      
      // Detect if this is likely a scanner (very fast input) or manual input
      isManualInput.current = timeSinceLastPress > SCANNER_SPEED_THRESHOLD;
      lastKeyPressTime.current = currentTime;

      // Handle numeric input
      if (/\d/.test(e.key) && e.key.length === 1) {
        e.preventDefault();
        
        barcodeBuffer.current += e.key;
        setBarcode(barcodeBuffer.current);

        if (barcodeBuffer.current.length >= 5) {
          onPartialMatch?.(barcodeBuffer.current);
        }

        // Clear any existing timeout
        if (bufferTimeout.current) {
          window.clearTimeout(bufferTimeout.current);
        }

        // Set timeout based on input type and scanner speed
        const timeoutDuration = isManualInput.current 
          ? MANUAL_INPUT_TIMEOUT 
          : calculateScannerTimeout();
          
        bufferTimeout.current = window.setTimeout(() => processBuffer(), timeoutDuration);
      }

      // Handle Enter key
      if (e.key === 'Enter') {
        e.preventDefault();
        if (barcodeBuffer.current.length > 0) {
          processBuffer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress, true);
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [isListening, onScan, onPartialMatch]);

  // Handle manual input through onChange
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isListening) return; // Ignore onChange when scanner is active

    const newValue = e.target.value.replace(/\D/g, '').slice(0, 7);
    isManualInput.current = true;
    
    barcodeBuffer.current = newValue;
    setBarcode(newValue);
    
    if (newValue.length >= 5) {
      onPartialMatch?.(newValue);
    }
    
    if (newValue.length === 7) {
      // Small delay for manual input to prevent double submission
      setTimeout(() => processBuffer(), 100);
    }
  };

  const toggleScanner = () => {
    // Process any pending input before toggling
    processBuffer(true);
    
    setIsListening(!isListening);
    setBarcode('');
    barcodeBuffer.current = '';
    isManualInput.current = false;
    scannerSpeedHistory.current = []; // Reset scanner speed history
    
    if (!isListening) {
      inputRef.current?.focus();
    }
  };

  // Handle input blur
  const handleBlur = () => {
    if (!isListening) {
      processBuffer(true); // Force process any pending input
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
          onBlur={handleBlur}
          placeholder={isListening ? t.readyToScan : t.enterManually}
          className={`flex-1 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            isListening ? 'bg-green-50' : ''
          }`}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          readOnly={isListening}
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