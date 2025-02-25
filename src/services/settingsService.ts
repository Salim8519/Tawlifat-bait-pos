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
  const defaultSettings: BusinessSettings = {
    business_code_: businessCode,
    default_commission_rate: 10,
    tax_rate: 0,
    logo_url: null,
    receipt_header: '',
    receipt_footer: '',
    allow_negative_stock: false,
    enable_loyalty_system: false,
    loyalty_points_rate: 1,
    loyalty_redemption_rate: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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