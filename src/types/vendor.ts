export interface VendorAssignment {
  assignment_id: number;
  vendor_business_code: string;
  owner_business_code: string;
  owner_business_name: string;
  branch_name: string;
  date_of_assignment: string;
  vendor_email_identifier: string;
}

export interface VendorProfile {
  business_code: string;
  full_name: string;
  vendor_business_name: string;
  his_email: string;
}