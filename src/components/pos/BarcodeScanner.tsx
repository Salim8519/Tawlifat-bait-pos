import React, { useState, useEffect, useRef } from 'react';
import { ScanLine } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [barcode, setBarcode] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isListening) return;

      // Only accept numbers and letters
      if (/[\w\d]/.test(e.key) && e.key.length === 1) {
        setBarcode(prev => prev + e.key);
      }

      // Enter key submits the barcode
      if (e.key === 'Enter' && barcode) {
        onScan(barcode);
        setBarcode('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isListening, barcode, onScan]);

  const toggleScanner = () => {
    setIsListening(!isListening);
    if (!isListening && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div className="flex space-x-2 space-x-reverse">
        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder={isListening ? t.readyToScan : t.enterManually}
          className="flex-1 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
        <button
          onClick={toggleScanner}
          className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isListening
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500'
          }`}
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