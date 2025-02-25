# Retrieving Vendor Business Names

## Database Structure
- In the `profiles` table, vendor business names are stored in `vendor_business _name` (note the space)
- Vendor's personal name is stored in `full_name`
- Vendors are identified by their `business_code`

## Retrieving Vendor Business Name
```typescript
// Get vendor business name by business code
async function getVendorBusinessName(businessCode: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, "vendor_business _name"')
    .eq('business_code', businessCode)
    .single();
    
  // Always use vendor_business_name as primary display name
  // Fall back to full_name only if business name is not available
  return data?.["vendor_business _name"] || data?.full_name || 'Unknown Vendor';
}
```

**Note:** Always use double quotes around `"vendor_business _name"` in queries due to the space in the column name.
