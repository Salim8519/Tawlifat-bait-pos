import { supabase } from '../lib/supabase';
import type { BusinessSettings } from '../types/settings';

/**
 * Get business settings
 */
export async function getBusinessSettings(businessCode: string): Promise<BusinessSettings | null> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_code_', businessCode)
      .single();

    if (error) {
      console.error('Error fetching business settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getBusinessSettings:', error);
    return null;
  }
}

/**
 * Update business settings
 */
export async function updateBusinessSettings(
  businessCode: string,
  settings: Partial<BusinessSettings>
): Promise<BusinessSettings | null> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .update(settings)
      .eq('business_code_', businessCode)
      .select()
      .single();

    if (error) {
      console.error('Error updating business settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateBusinessSettings:', error);
    return null;
  }
}

/**
 * Create initial business settings
 */
export async function createBusinessSettings(
  businessCode: string,
  settings: Partial<BusinessSettings> = {}
): Promise<BusinessSettings | null> {
  try {
    const defaultSettings = {
      business_code_: businessCode,
      loyalty_system_enabled: false,
      vendor_commission_enabled: false,
      default_commission_rate: 10,
      tax_enabled: false,
      minimum_commission_amount: 0,
      tax_rate: 0,
      ...settings
    };

    const { data, error } = await supabase
      .from('business_settings')
      .insert([defaultSettings])
      .select()
      .single();

    if (error) {
      console.error('Error creating business settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createBusinessSettings:', error);
    return null;
  }
}