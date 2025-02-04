import { supabase } from '../lib/supabase';

export interface BusinessSettings {
  setting_id: string;
  business_code_: string;
  receipt_header: string | null;
  receipt_footer: string | null;
  url_logo_of_business: string | null;
  loyalty_system_enabled: boolean;
  vendor_commission_enabled: boolean;
  default_commission_rate: number;
  minimum_commission_amount: number;
  tax_enabled: boolean;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

export async function getBusinessSettings(businessCode: string): Promise<BusinessSettings | null> {
  try {
    // First try to get existing settings
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_code_', businessCode)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no settings exist, create default settings
    if (!data) {
      return createDefaultSettings(businessCode);
    }

    return data;
  } catch (error) {
    console.error('Error in getBusinessSettings:', error);
    throw error;
  }
}

async function createDefaultSettings(businessCode: string): Promise<BusinessSettings> {
  const defaultSettings = {
    business_code_: businessCode,
    receipt_header: null,
    receipt_footer: null,
    url_logo_of_business: null,
    loyalty_system_enabled: false,
    vendor_commission_enabled: false,
    default_commission_rate: 10,
    minimum_commission_amount: 0,
    tax_enabled: false,
    tax_rate: 0
  };

  const { data, error } = await supabase
    .from('business_settings')
    .insert([defaultSettings])
    .select()
    .single();

  if (error) {
    console.error('Error creating default settings:', error);
    throw error;
  }

  return data;
}

export async function updateBusinessSettings(
  businessCode: string,
  updates: Partial<Omit<BusinessSettings, 'setting_id' | 'business_code_' | 'created_at' | 'updated_at'>>
): Promise<BusinessSettings | null> {
  console.log('Updating settings with:', updates);
  
  // Ensure numeric values are properly formatted
  const formattedUpdates = {
    ...updates,
    default_commission_rate: updates.default_commission_rate !== undefined ? Number(updates.default_commission_rate) : undefined,
    minimum_commission_amount: updates.minimum_commission_amount !== undefined ? Number(updates.minimum_commission_amount) : undefined,
    tax_rate: updates.tax_rate !== undefined ? Number(updates.tax_rate) : undefined,
    updated_at: new Date().toISOString()
  };

  // First check if settings exist
  const { data: existingSettings } = await supabase
    .from('business_settings')
    .select('setting_id')
    .eq('business_code_', businessCode)
    .maybeSingle();

  if (!existingSettings) {
    // Create new settings if they don't exist
    const defaultSettings = await createDefaultSettings(businessCode);
    return updateBusinessSettings(businessCode, updates);
  }

  const { data, error } = await supabase
    .from('business_settings')
    .update(formattedUpdates)
    .eq('business_code_', businessCode)
    .select()
    .single();

  if (error) {
    console.error('Error updating business settings:', error);
    throw error;
  }

  console.log('Settings updated successfully:', data);
  return data;
}