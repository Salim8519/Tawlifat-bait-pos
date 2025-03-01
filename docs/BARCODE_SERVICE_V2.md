# Barcode Service V2 Documentation

## Overview

The Barcode Service V2 is an enhanced version of the original barcode printing system in the Tawliat Bait POS application. This new version provides more customization options, better UI controls, and improved printing capabilities.

## Comparison with Original Version

| Feature | Original Version | V2 Version |
|---------|-----------------|------------|
| UI Interface | Basic controls | Enhanced UI with tabs and preview |
| Barcode Formats | Limited options | Multiple formats (CODE128, EAN13, UPC, CODE39) |
| Customization | Basic settings | Comprehensive settings for fonts, spacing, sizes |
| Preview | Limited | Real-time interactive preview |
| Templates | Not available | Predefined templates for common printers |
| Alignment | Basic | Full control (left, center, right) |
| Spacing | Limited | Global spacing control + section/line spacing |
| Text Display | Fixed | Configurable display options for all elements |
| Styling | Basic | Dark mode, RTL support, font family selection |

## Connected Files and Components

### Core Files

1. **`src/services/barcodeServiceV2.ts`**
   - Core service implementation
   - Contains interfaces, default settings, and printing logic
   - Handles HTML/CSS template generation
   - Manages barcode rendering with JsBarcode

2. **`src/hooks/useBarcodeServiceV2.ts`**
   - React hook for component integration
   - Provides state management
   - Handles settings persistence
   - Exposes simplified API for components

3. **`src/pages/BarcodeSettingsV2Page.tsx`**
   - Main UI page for barcode settings
   - Provides controls for all customization options
   - Includes live preview functionality
   - Organizes settings into logical groups

4. **`src/translations/barcodeSettingsV2.ts`**
   - Internationalization support
   - Contains translations for all UI elements

### Integration Points

1. **`src/App.tsx`**
   - Route registration for the BarcodeSettingsV2Page
   - Path: `/barcode-settings-v2`

2. **`src/components/layout/Sidebar.tsx`**
   - Navigation menu item for Barcode Settings V2
   - Provides access to the settings page

## Key Interfaces

### BarcodeDataV2
```typescript
interface BarcodeDataV2 {
  // Required fields
  barcode: string;         // Barcode number
  productName: string;     // Product name
  price: number;           // Price
  
  // Optional fields
  businessName?: string;   // Business name
  vendorName?: string;     // Vendor name
  expiryDate?: string;     // Expiry date
  productionDate?: string; // Production date
  currency?: string;       // Currency symbol
}
```

### BarcodeSettingsV2
```typescript
interface BarcodeSettingsV2 {
  // Printer settings
  printerType: 'zebra' | 'dymo' | 'brother' | 'generic';
  labelWidth: number;      // Width in mm
  labelHeight: number;     // Height in mm
  
  // Content settings
  showBusinessName: boolean;
  showVendorName: boolean;
  showProductName: boolean;
  showPrice: boolean;
  showExpiryDate: boolean;
  showProductionDate: boolean;
  
  // Font settings
  fontFamily: string;
  businessNameFontSize: number;
  vendorNameFontSize: number;
  productNameFontSize: number;
  barcodeFontSize: number;
  priceFontSize: number;
  dateFontSize: number;
  
  // Spacing settings
  lineSpacing: number;     // Space between lines
  sectionSpacing: number;  // Space between sections
  globalSpacing: number;   // Global spacing factor
  
  // Barcode settings
  barcodeFormat: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  barcodeWidth: number;    // Width in mm
  barcodeHeight: number;   // Height in mm
  barcodeLineWidth: number;// Line width
  displayBarcodeText: boolean; // Show barcode text
  
  // Style settings
  rtl: boolean;            // Right-to-left text
  darkMode: boolean;       // Dark mode (inverted colors)
  textAlignment: 'left' | 'center' | 'right'; // Text alignment
}
```

## How to Use

### Basic Usage

```typescript
import { useBarcodeServiceV2 } from '../hooks/useBarcodeServiceV2';

const MyComponent = () => {
  const { printBarcode } = useBarcodeServiceV2();
  
  const handlePrint = () => {
    printBarcode({
      barcode: '123456789',
      productName: 'Sample Product',
      price: 9.99,
      businessName: 'Tawliat Bait'
    });
  };
  
  return (
    <button onClick={handlePrint}>Print Barcode</button>
  );
};
```

### Advanced Usage with Settings

```typescript
import { useBarcodeServiceV2 } from '../hooks/useBarcodeServiceV2';

const MyComponent = () => {
  const { 
    printBarcode, 
    updateSettings, 
    settings 
  } = useBarcodeServiceV2();
  
  const handleUpdateSettings = () => {
    updateSettings({
      barcodeFormat: 'EAN13',
      textAlignment: 'center',
      globalSpacing: 1.5
    });
  };
  
  return (
    <div>
      <button onClick={handleUpdateSettings}>Update Settings</button>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  );
};
```

## Predefined Templates

The service includes predefined templates for common printer types:

- `zebra2x1`: Zebra printer, 2" × 1" labels
- `zebra4x2`: Zebra printer, 4" × 2" labels
- `dymoSmall`: Dymo printer, standard labels
- `brotherSmall`: Brother printer, standard labels
- `genericSmall`: Generic printer, small labels

## Future Enhancements

Potential future enhancements for the barcode service:

1. QR code support
2. Custom templates saving/loading
3. Batch printing capabilities
4. Additional barcode formats
5. Image embedding in labels
6. Bluetooth printer support
7. Mobile-optimized printing

## Migration Guide

To migrate from the original barcode service to V2:

1. Update imports to use the V2 versions:
   ```typescript
   // Old version
   import { useBarcodeService } from '../hooks/useBarcodeService';
   
   // New version
   import { useBarcodeServiceV2 } from '../hooks/useBarcodeServiceV2';
   ```

2. Update data structure:
   ```typescript
   // Old version
   const data = {
     code: '123456789',
     name: 'Product Name',
     // ...
   };
   
   // New version
   const data = {
     barcode: '123456789',
     productName: 'Product Name',
     // ...
   };
   ```

3. Use the new settings page at `/barcode-settings-v2` to configure your preferences
