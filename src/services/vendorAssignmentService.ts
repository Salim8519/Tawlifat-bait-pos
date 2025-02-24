import { supabase } from '../lib/supabase';

export interface VendorProfile {
  full_name: string;
  phone_number: string;
  vendor_business_name: string;
}

export interface VendorAssignment {
  owner_business_code: string;
  vendor_business_code: string;
  vendor_email_identifier: string;
  date_of_assignment: string;
  assignment_id: number;
  branch_name: string;
  owner_business_name: string;
  profile?: VendorProfile;
}

export async function getVendorAssignments(businessCode: string): Promise<VendorAssignment[]> {
  try {
    // First get all assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('vendor_assignments')
      .select('*')
      .eq('owner_business_code', businessCode);

    if (assignmentError) throw assignmentError;
    if (!assignments) return [];

    // Then get profiles for each vendor
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('his_email', assignments.map(a => a.vendor_email_identifier));

    if (profileError) throw profileError;

    // Combine the data
    const enrichedAssignments = assignments.map(assignment => {
      const profile = profiles?.find(p => p.his_email === assignment.vendor_email_identifier);
      return {
        ...assignment,
        profile: profile ? {
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          vendor_business_name: profile["vendor_business _name"] // Note: there's a space in the column name
        } : undefined
      };
    });

    return enrichedAssignments;
  } catch (error) {
    console.error('Error fetching vendor assignments:', error);
    throw error;
  }
}

export async function getVendorAssignmentsByBranch(businessCode: string, branchName: string): Promise<VendorAssignment[]> {
  try {
    // First get branch assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('vendor_assignments')
      .select('*')
      .eq('owner_business_code', businessCode)
      .eq('branch_name', branchName);

    if (assignmentError) throw assignmentError;
    if (!assignments) return [];

    // Then get profiles for each vendor
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('his_email', assignments.map(a => a.vendor_email_identifier));

    if (profileError) throw profileError;

    // Combine the data
    const enrichedAssignments = assignments.map(assignment => {
      const profile = profiles?.find(p => p.his_email === assignment.vendor_email_identifier);
      return {
        ...assignment,
        profile: profile ? {
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          vendor_business_name: profile["vendor_business _name"] // Note: there's a space in the column name
        } : undefined
      };
    });

    return enrichedAssignments;
  } catch (error) {
    console.error('Error fetching vendor assignments for branch:', error);
    throw error;
  }
}
