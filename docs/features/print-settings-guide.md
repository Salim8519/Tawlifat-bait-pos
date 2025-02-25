# Print Settings System Documentation

## Overview
The Print Settings system allows users to customize the appearance of barcodes and receipts in the POS system. The system is designed to be extensible, with barcode settings implemented first and receipt settings planned for future implementation.

## Barcode Settings

### Features
- Real-time preview of barcode appearance
- Customizable font sizes for all elements
- Adjustable barcode dimensions
- Bilingual support (Arabic/English)
- Settings persistence across sessions

### Customizable Parameters
1. **Business Information**
   - Business Name Font Size
   - Vendor Name Font Size
   - Product Name Font Size

2. **Barcode Properties**
   - Barcode Width (mm)
   - Barcode Height (mm)
   - Barcode Number Font Size

3. **Additional Information**
   - Price Font Size
   - Date Information Font Size

### Settings Persistence
The system uses a multi-layer caching approach:

1. **Local Storage**
   ```typescript
   // Save settings
   localStorage.setItem('barcodeSettings', JSON.stringify(settings));
   
   // Load settings
   const cached = localStorage.getItem('barcodeSettings');
   const settings = cached ? JSON.parse(cached) : defaultSettings;
   ```

2. **Default Fallback**
   ```typescript
   const defaultBarcodeSettings = {
     businessNameFontSize: 7,
     vendorNameFontSize: 7,
     productNameFontSize: 8,
     barcodeFontSize: 6,
     barcodeWidth: 45,
     barcodeHeight: 12,
     priceFontSize: 9,
     dateFontSize: 6
   };
   ```

### Print Service Integration
The barcode service (`barcodeService.ts`) has been enhanced to support both preview and print modes:

1. **Preview Mode**
   - Renders in-page preview
   - Updates in real-time
   - Uses sample data for demonstration

2. **Print Mode**
   - Opens in new window
   - Optimized for thermal printers
   - Standard size: 58mm × 40mm

## Planned Receipt Settings

### Future Implementation
The next phase will include receipt customization with the following planned features:

1. **Header Settings**
   - Business Logo Size
   - Header Text Font Sizes
   - Custom Header Messages

2. **Item List Settings**
   - Product Name Font Size
   - Price and Quantity Font Sizes
   - Column Widths

3. **Footer Settings**
   - Footer Text Font Size
   - Custom Footer Messages
   - Terms and Conditions Format

4. **Additional Features**
   - Custom Paper Sizes
   - Multiple Language Support
   - Tax Information Display
   - Payment Method Details

### Technical Implementation Plan
1. Create `ReceiptSettings` interface
2. Implement receipt preview component
3. Add receipt-specific caching
4. Integrate with existing print service
5. Add custom templates support

## Best Practices

### Using the Print Settings
1. Always test preview before printing
2. Consider thermal printer limitations
3. Ensure text remains readable
4. Test with different data lengths

### Development Guidelines
1. Keep preview and print logic separate
2. Use TypeScript interfaces for type safety
3. Implement proper error handling
4. Cache settings appropriately
5. Support bilingual content

## Error Handling
The system includes robust error handling:

```typescript
try {
  const cached = localStorage.getItem('barcodeSettings');
  if (cached) {
    const parsedSettings = JSON.parse(cached);
    setSettings(parsedSettings);
  }
} catch (error) {
  console.error('Error loading settings:', error);
  // Fallback to defaults
  setSettings(defaultBarcodeSettings);
}
```

## Future Enhancements
1. **Receipt Settings Implementation**
   - Custom templates
   - Multiple formats
   - Advanced styling options

2. **Additional Features**
   - Cloud sync of settings
   - Multiple profiles support
   - Template management
   - Batch printing options

3. **Performance Optimizations**
   - Caching improvements
   - Print queue management
   - Preview optimization
