import { supabase } from '../lib/supabase';
import type { VendorProfile, VendorAssignment } from '../types/vendor';

interface CreateVendorData {
  email: string;
  password: string;
  full_name: string;
  vendor_business_name: string;
  phone_number: string;
}

interface VendorProfit {
  vendorProfit: number;
  ownerProfit: number;
}

// Create admin client for auth operations
// const supabaseAdmin = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
// );

export async function getVendorAssignments(ownerBusinessCode: string): Promise<VendorAssignment[]> {
  try {
    // First get all assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('vendor_assignments')
      .select('*')
      .eq('owner_business_code', ownerBusinessCode);

    if (assignmentError) throw assignmentError;
    if (!assignments) return [];

    // Get all unique vendor business codes
    const vendorBusinessCodes = [...new Set(assignments.map(a => a.vendor_business_code))];

    // Get profiles for all vendors using text-based matching
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('business_code, "vendor_business _name", full_name, phone_number, his_email')
      .in('business_code', vendorBusinessCodes)
      .eq('is_vendor', true);

    if (profileError) throw profileError;
    if (!profiles) return assignments;

    // Map assignments with profile data using text-based matching
    return assignments.map(assignment => {
      const vendorProfile = profiles.find(p => p.business_code === assignment.vendor_business_code);
      
      return {
        ...assignment,
        profile: vendorProfile ? {
          vendor_business_name: vendorProfile["vendor_business _name"] || vendorProfile.full_name || 'Unknown',
          full_name: vendorProfile.full_name,
          phone_number: vendorProfile.phone_number,
          his_email: vendorProfile.his_email
        } : undefined
      };
    });

  } catch (error) {
    console.error('Error fetching vendor assignments:', error);
    throw error;
  }
}

/**
 * Create a new vendor with auth and profile
 */
export async function createVendor(data: CreateVendorData): Promise<VendorProfile> {
  try {
    // Generate a unique business code for the new vendor
    const vendorBusinessCode = `VND${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('his_email', data.email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('A vendor with this email already exists');
    }

    // Create new auth user using public API
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'vendor',
          business_code: vendorBusinessCode
        }
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('Failed to create vendor account');
    }

    // Create new profile using RLS policies
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: data.full_name,
        his_email: data.email,
        phone_number: data.phone_number,
        role: 'vendor',
        is_vendor: true,
        business_code: vendorBusinessCode,
        working_status: 'working',
        "vendor_business _name": data.vendor_business_name
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    if (!newProfile) {
      throw new Error('Failed to create vendor profile');
    }

    return {
      business_code: newProfile.business_code,
      full_name: newProfile.full_name || '',
      vendor_business_name: newProfile["vendor_business _name"] || '',
      his_email: newProfile.his_email || ''
    };
  } catch (error) {
    console.error('Error in createVendor:', error);
    throw error;
  }
}

export async function getVendorAssignmentsByVendor(vendorBusinessCode: string): Promise<VendorAssignment[]> {
  try {
    console.log('Fetching assignments for vendor:', vendorBusinessCode); // Debug log

    const { data, error } = await supabase
      .from('vendor_assignments')
      .select(`
        assignment_id,
        vendor_business_code,
        owner_business_code,
        owner_business_name,
        branch_name,
        date_of_assignment,
        vendor_email_identifier
      `)
      .eq('vendor_business_code', vendorBusinessCode);

    if (error) {
      console.error('Error fetching vendor assignments:', error);
      throw error;
    }

    console.log('Fetched assignments:', data); // Debug log

    if (!data || data.length === 0) {
      console.log('No assignments found for vendor:', vendorBusinessCode);
      return [];
    }

    // Map the data to ensure all required fields are present
    const assignments = data.map(assignment => ({
      assignment_id: assignment.assignment_id,
      vendor_business_code: assignment.vendor_business_code,
      owner_business_code: assignment.owner_business_code,
      owner_business_name: assignment.owner_business_name || 'Unnamed Business',
      branch_name: assignment.branch_name || '',
      date_of_assignment: assignment.date_of_assignment,
      vendor_email_identifier: assignment.vendor_email_identifier
    }));

    console.log('Processed assignments:', assignments); // Debug log
    return assignments;
  } catch (error) {
    console.error('Error in getVendorAssignmentsByVendor:', error);
    throw error;
  }
}

export async function checkVendorEmail(email: string): Promise<VendorProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('business_code, full_name, "vendor_business _name", his_email')
    .eq('his_email', email)
    .eq('is_vendor', true)
    .maybeSingle();

  if (error) {
    console.error('Error checking vendor email:', error);
    return null;
  }

  if (!data?.business_code) {
    console.error('Vendor profile incomplete:', data);
    return null;
  }

  return {
    business_code: data.business_code,
    full_name: data.full_name || '',
    vendor_business_name: data['vendor_business _name'] || '',
    his_email: email
  };
}

export async function assignVendor(assignment: Omit<VendorAssignment, 'assignment_id' | 'date_of_assignment'>) {
  try {
    // Check if vendor exists
    const { data: vendorProfile, error: vendorError } = await supabase
      .from('profiles')
      .select('business_code, "vendor_business _name"')
      .eq('his_email', assignment.vendor_email_identifier)
      .eq('is_vendor', true)
      .single();

    if (vendorError || !vendorProfile) {
      throw new Error('Vendor not found');
    }

    // Get the owner's business name
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .select('business_name, role')
      .eq('business_code', assignment.owner_business_code)
      .eq('role', 'owner')
      .single();

    if (ownerError || !ownerProfile?.business_name) {
      throw new Error('Could not find owner profile. Make sure the business code belongs to a store owner.');
    }

    // Verify no existing assignment for this vendor in this branch
    const { data: existingAssignments, error: checkError } = await supabase
      .from('vendor_assignments')
      .select('assignment_id')
      .eq('vendor_business_code', vendorProfile.business_code)
      .eq('branch_name', assignment.branch_name);

    if (checkError) {
      console.error('Error checking existing assignments:', checkError);
      throw checkError;
    }

    if (existingAssignments && existingAssignments.length > 0) {
      throw new Error('Vendor already assigned to this branch');
    }

    // Create vendor assignment
    const { data, error } = await supabase
      .from('vendor_assignments')
      .insert([{
        vendor_business_code: vendorProfile.business_code,
        owner_business_code: assignment.owner_business_code,
        branch_name: assignment.branch_name,
        vendor_email_identifier: assignment.vendor_email_identifier,
        owner_business_name: ownerProfile.business_name
      }])
      .select()
      .single();

    if (error) {
      console.error('Error assigning vendor:', error);
      throw error;
    }

    return data;
  } catch (error) {
     console.error('Error in assignVendor:', error);
     throw error;
   }
}

export async function removeVendorAssignment(assignmentId: number) {
  const { error } = await supabase
    .from('vendor_assignments')
    .delete()
    .eq('assignment_id', assignmentId);

  if (error) {
    console.error('Error removing vendor assignment:', error);
    throw error;
  }

  return true;
}

export async function getVendorProfile(businessCode: string): Promise<VendorProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('business_code, full_name, "vendor_business _name", his_email')
    .eq('business_code', businessCode)
    .eq('is_vendor', true)
    .single();

  if (error) {
    console.error('Error fetching vendor profile:', error);
    throw error;
  }

  if (!data) return null;

  return {
    business_code: data.business_code,
    full_name: data.full_name || '',
    vendor_business_name: data['vendor_business _name'] || '',
    his_email: data.his_email || ''
  };
}

export async function updateVendorProfile(
  businessCode: string,
  updates: Partial<VendorProfile>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.full_name,
      'vendor_business _name': updates.vendor_business_name,
      his_email: updates.his_email
    })
    .eq('business_code', businessCode)
    .eq('is_vendor', true);

  if (error) {
    console.error('Error updating vendor profile:', error);
    throw error;
  }
}

export async function getVendorProfits(
  businessCode: string,
  vendorCode: string,
  branchName: string,
  month: number,
  year: number
): Promise<VendorProfit> {
  try {
    // Get vendor's profit from vendor_transactions
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: vendorTransactions, error: vendorError } = await supabase
      .from('vendor_transactions')
      .select('amount')
      .eq('business_code', businessCode)
      .eq('vendor_code', vendorCode)
      .eq('branch_name', branchName)
      .eq('status', 'completed')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (vendorError) throw vendorError;

    // Get owner's profit from transactions_overall
    const { data: ownerTransactions, error: ownerError } = await supabase
      .from('transactions_overall')
      .select('owner_profit_from_this_transcation')
      .eq('business_code', businessCode)
      .eq('vendor_code', vendorCode)
      .eq('branch_name', branchName)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (ownerError) throw ownerError;

    // Calculate total profits
    const vendorProfit = vendorTransactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
    const ownerProfit = ownerTransactions?.reduce((sum, t) => 
      sum + (Number(t.owner_profit_from_this_transcation) || 0), 0) || 0;

    return { vendorProfit, ownerProfit };
  } catch (error) {
    console.error('Error fetching vendor profits:', error);
    throw error;
  }
}

export async function getVendorTransactions(
  businessCode: string,
  vendorCode: string,
  branchName: string
) {
  try {
    const { data, error } = await supabase
      .from('vendor_transactions')
      .select('*')
      .eq('business_code', businessCode)
      .eq('vendor_code', vendorCode)
      .eq('branch_name', branchName)
      .eq('status', 'completed')
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vendor transactions:', error);
    throw error;
  }
}

/**
 * Get all available vendors
 */
export async function getAllVendors(): Promise<VendorProfile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor')
      .eq('is_vendor', true)
      .order('vendor_business _name', { ascending: true });

    if (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllVendors:', error);
    throw error;
  }
}