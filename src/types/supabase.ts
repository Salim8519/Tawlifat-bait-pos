export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          phone_number: number | null
          user_id: string
          working_status: string | null
          role: string | null
          full_name: string | null
          salary: number | null
          business_name: string | null
          created_at: string | null
          is_vendor: boolean | null
          main_branch: string | null
          id: string
          "vendor_business _name": string | null
          his_email: string | null
          business_code: string | null
        }
        Insert: {
          phone_number?: number | null
          user_id: string
          working_status?: string | null
          role?: string | null
          full_name?: string | null
          salary?: number | null
          business_name?: string | null
          created_at?: string | null
          is_vendor?: boolean | null
          main_branch?: string | null
          id?: string
          "vendor_business _name"?: string | null
          his_email?: string | null
          business_code?: string | null
        }
        Update: {
          phone_number?: number | null
          user_id?: string
          working_status?: string | null
          role?: string | null
          full_name?: string | null
          salary?: number | null
          business_name?: string | null
          created_at?: string | null
          is_vendor?: boolean | null
          main_branch?: string | null
          id?: string
          "vendor_business _name"?: string | null
          his_email?: string | null
          business_code?: string | null
        }
      }
      vendor_assignments: {
        Row: {
          owner_business_code: string
          owner_business_name: string
          assignment_id: number
          vendor_email_identifier: string
          date_of_assignment: string
          branch_name: string
          vendor_business_code: string
        }
        Insert: {
          owner_business_code: string
          owner_business_name: string
          assignment_id?: number
          vendor_email_identifier: string
          date_of_assignment?: string
          branch_name: string
          vendor_business_code: string
        }
        Update: {
          owner_business_code?: string
          owner_business_name?: string
          assignment_id?: number
          vendor_email_identifier?: string
          date_of_assignment?: string
          branch_name?: string
          vendor_business_code?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
