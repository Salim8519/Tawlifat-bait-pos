# QR Code Integration Plan for Barcode Service V2

## Overview

This document outlines the implementation plan for adding QR code support to the existing Barcode Service V2. The enhancement will allow users to include a QR code alongside the traditional barcode, with a split-layout design where the QR code appears on one side (left by default) and all text elements on the other side.

## Business Requirements

1. Add QR code generation capability to the existing barcode service
2. Support a split-layout design with QR code on one side and text on the other
3. Allow customization of QR code content, size, and position
4. Maintain compatibility with existing barcode functionality
5. Support all current printer templates
6. Preserve RTL and dark mode support

## Technical Approach

### 1. Interface Extensions

#### BarcodeSettingsV2 Interface Updates

```typescript
interface BarcodeSettingsV2 {
  // Existing fields...
  
  // New QR code settings
  enableQRCode: boolean;                // Toggle QR code display
  qrCodeContent: 'barcode' | 'custom';  // What data to encode in QR
  qrCodeCustomContent: string;          // Custom data for QR if not using barcode
  qrCodeSize: number;                   // Size of QR code in mm
  qrCodeErrorCorrection: 'L' | 'M' | 'Q' | 'H'; // Error correction level
  qrCodePosition: 'left' | 'right';     // Position of QR code
  splitLayoutRatio: number;             // Ratio of QR to text (e.g., 0.5 for 50/50)
}
```

#### Default Settings Updates

```typescript
const DEFAULT_BARCODE_SETTINGS: BarcodeSettingsV2 = {
  // Existing defaults...
  
  // QR code defaults
  enableQRCode: false,
  qrCodeContent: 'barcode',
  qrCodeCustomContent: '',
  qrCodeSize: 25,
  qrCodeErrorCorrection: 'M',
  qrCodePosition: 'left',
  splitLayoutRatio: 0.5,
};
```

### 2. Core Service Updates

#### Dependencies
- Add QR code generation library: `qrcode`

#### barcodeServiceV2Core.ts
- Create new function `generateQRCodeHTML` for QR code generation
- Modify `generateBarcodeHTML` to support split view layout
- Add QR code validation and error handling
- Update CSS variables for QR code styling and positioning
- Implement responsive layout adjustments for different QR sizes

#### barcodeServiceV2.ts
- Update interfaces to include QR code settings
- Add QR code default settings
- Ensure public API functions pass QR settings to core functions
- Maintain backward compatibility with existing code
- Add helper functions for QR code content formatting

### 3. Implementation Details

#### QR Code Generation
```typescript
// In barcodeServiceV2Core.ts
function generateQRCodeHTML(
  content: string,
  settings: BarcodeSettingsV2
): string {
  const {
    qrCodeSize,
    qrCodeErrorCorrection,
    darkMode
  } = settings;
  
  // Generate QR code SVG
  const qrSvg = generateQRSvg(content, {
    errorCorrectionLevel: qrCodeErrorCorrection,
    color: {
      dark: darkMode ? '#FFFFFF' : '#000000',
      light: darkMode ? '#000000' : '#FFFFFF'
    }
  });
  
  return `
    <div class="qr-code" style="width: ${qrCodeSize}mm; height: ${qrCodeSize}mm;">
      ${qrSvg}
    </div>
  `;
}
```

#### Split Layout Implementation
```typescript
// In barcodeServiceV2Core.ts - Modified HTML structure
return `
  <div class="barcode-container ${settings.enableQRCode ? 'split-layout' : ''}">
    ${settings.enableQRCode && settings.qrCodePosition === 'left' ? qrCodeHtml : ''}
    
    <div class="text-section" style="width: ${settings.enableQRCode ? `${(1 - settings.splitLayoutRatio) * 100}%` : '100%'}">
      ${businessInfoHtml}
      ${productInfoHtml}
      ${barcodeHtml}
      ${priceHtml}
      ${datesHtml}
    </div>
    
    ${settings.enableQRCode && settings.qrCodePosition === 'right' ? qrCodeHtml : ''}
  </div>
`;
```

### 3. UI Updates (BarcodeSettingsV2Page.tsx)

- Add new QR code settings section in the Settings tab
- Implement controls for all QR code options
- Update preview to display the split layout when QR code is enabled
- Add conditional rendering based on QR code settings

### 4. CSS Updates

```css
/* QR code layout styles */
.split-layout {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.qr-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
}

.text-section {
  display: flex;
  flex-direction: column;
  padding: 5px;
}

/* RTL support for split layout */
html[dir="rtl"] .split-layout {
  flex-direction: row-reverse;
}
```

### 5. Translation Updates

Add new translation keys for all QR code related UI elements in both English and Arabic.

## Implementation Phases

### Phase 1: Core Implementation (2 days)
- Add QR code library dependency
- Update interfaces and default settings
- Create QR code generation function
- Modify HTML generation for split layout

### Phase 2: UI Implementation (2 days)
- Add QR code settings section to the UI
- Update CSS for split layout
- Add translations for new UI elements

### Phase 3: Testing and Refinement (1 day)
- Test with different QR content types
- Verify layout in both LTR and RTL modes
- Test printing functionality
- Validate with different printer templates

### Phase 4: Documentation and Release (1 day)
- Update documentation with QR code capabilities
- Add examples of QR code usage
- Document new settings and their effects
- Release the feature

## File Changes

### Files to Modify
1. `src/services/barcodeServiceV2.ts`
   - Update interfaces
   - Add default settings
   - Update public API functions

2. `src/services/barcodeServiceV2Core.ts`
   - Add QR code generation function
   - Update HTML generation for split layout

3. `src/pages/BarcodeSettingsV2Page.tsx`
   - Add QR code settings UI section
   - Update preview handling

4. `src/pages/BarcodeSettingsV2Page.css`
   - Add styles for split layout

5. `src/translations/barcodeSettingsV2.ts`
   - Add translations for QR code settings

### Dependencies to Add
- `qrcode`: For QR code generation

## Technical Considerations

### Performance
- QR code generation should be efficient
- Consider caching QR code output for repeated values

### Printing
- Ensure QR codes print clearly on thermal printers
- Test with all supported printer templates

### Compatibility
- Maintain backward compatibility with existing barcode settings
- Ensure existing code continues to work without QR code enabled

### Accessibility
- Ensure the UI remains accessible with the new settings
- Maintain keyboard navigation support

### Responsiveness
- The split layout should work well on different screen sizes
- Test with mobile and desktop views

## Future Enhancements

Potential future enhancements after initial implementation:

1. Support for custom QR code colors
2. Additional QR code content options (e.g., URL, contact info)
3. Multiple QR codes on a single label
4. QR code with embedded logo
5. Dynamic QR code content based on product data

## Conclusion

This implementation plan provides a comprehensive approach to adding QR code support to the Barcode Service V2 while maintaining the existing architecture and following the Single Responsibility Principle. The feature will enhance the barcode printing capabilities of the Tawliat Bait POS system by allowing businesses to include QR codes alongside traditional barcodes, improving scanning options and information density on product labels.
