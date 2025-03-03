import { supabase } from '../lib/supabase';
import { BusinessSettings } from '../types/settings';

/**
 * Get business settings
 */
export async function getBusinessSettings(businessCode: string): Promise<BusinessSettings | null> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_code_', businessCode)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching business settings:', error);
    throw error;
  }
}

/**
 * Update business settings
 */
export async function updateBusinessSettings(
  businessCode: string,
  settings: Partial<BusinessSettings>
): Promise<BusinessSettings> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('business_code_', businessCode)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating business settings:', error);
    throw error;
  }
}

/**
 * Create initial business settings
 */
export async function createBusinessSettings(businessCode: string): Promise<BusinessSettings> {
  const defaultSettings = {
    business_code_: businessCode,
    default_commission_rate: 0,
    tax_rate: 0,
    tax_enabled: false,
    receipt_header: '',
    receipt_footer: '',
    url_logo_of_business: null,
    loyalty_system_enabled: false,
    vendor_commission_enabled: false,
    minimum_commission_amount: 0,
    extra_tax_monthly_on_vendors: 0,
  };

  try {
    const { data, error } = await supabase
      .from('business_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating business settings:', error);
    throw error;
  }
}