# Receipt Printing Service

## Overview

The receipt printing service provides functionality to generate and print receipts for POS transactions. The system now includes an enhanced version (V2) with automatic printer size detection and flexible width options.

## Features

### Print Receipt Service V2

The new `printReceiptServiceV2.ts` includes the following improvements:

1. **Automatic Printer Size Detection**
   - Automatically detects the optimal printer size
   - Adapts to different POS printer sizes without manual configuration
   - Remembers detected sizes for future use

2. **Flexible Width Options**
   - Supports custom numeric width values (e.g., 75mm)
   - Provides an 'Auto' option for automatic detection
   - No longer limited to fixed sizes

3. **Customizable Layout Settings**
   - Zero padding (0mm) by default
   - 1mm margin on both sides
   - Fully responsive layout that adapts to any width

4. **Enhanced Error Handling**
   - Improved error logging and handling
   - Better user feedback for printing issues

5. **Backward Compatibility**
   - Maintains the same function signature as the original service
   - Seamless transition from the original implementation

## Usage

```typescript
import { printReceiptV2 } from '../services/printReceiptServiceV2';

// Auto-detect printer size (recommended)
const success = await printReceiptV2(receipt, cartItems);

// Specify a custom width
const success = await printReceiptV2(receipt, cartItems, '75');

// Specify width with custom padding and margin
const success = await printReceiptV2(receipt, cartItems, '80', {
  padding: '0mm',
  margin: '1mm'
});
```

## Implementation Details

The service is implemented with a focus on:

1. **Modularity**: Separate functions for specific tasks
2. **Flexibility**: Support for any printer width
3. **Error Handling**: Comprehensive error catching and reporting
4. **Performance**: Optimized HTML generation and printing
5. **User Experience**: Seamless printing experience with minimal configuration

## Storage Compatibility

The receipt printing service uses both cookies and localStorage for maximum compatibility:

1. **Dual Storage Strategy**
   - Settings are saved to both cookies and localStorage
   - The system checks both storage mechanisms when retrieving settings
   - This ensures compatibility across different browsers and environments

2. **Format Compatibility**
   - Handles both simple string values (old format) and JSON objects (new format)
   - Automatically converts between formats as needed
   - Maintains backward compatibility with existing stored preferences

3. **Error Handling**
   - Gracefully handles cases where storage access is restricted
   - Falls back to auto-detection when stored preferences cannot be accessed
   - Logs storage errors without disrupting the user experience

## Migration Guide

To migrate from the original print receipt service:

1. Update imports to use the new service:
   ```typescript
   // Before
   import { printReceipt } from '../services/printReceiptService';
   
   // After
   import { printReceiptV2 } from '../services/printReceiptServiceV2';
   ```

2. Update function calls:
   ```typescript
   // Before
   await printReceipt(receipt, cartItems, '80mm');
   
   // After (with auto-detection)
   await printReceiptV2(receipt, cartItems);
   
   // After (with custom width)
   await printReceiptV2(receipt, cartItems, '80');
   ```

## Future Improvements

- Enhanced receipt templates
- Print queue management
- Receipt archiving and retrieval
- Additional customization options
