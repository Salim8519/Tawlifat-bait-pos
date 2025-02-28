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
          id: string
          user_id: string
          business_code: string | null
          business_name: string | null
          full_name: string | null
          his_email: string | null
          is_vendor: boolean | null
          main_branch: string | null
          phone_number: number | null
          role: string | null
          salary: number | null
          'vendor_business _name': string | null
          working_status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          business_code?: string | null
          business_name?: string | null
          full_name?: string | null
          his_email?: string | null
          is_vendor?: boolean | null
          main_branch?: string | null
          phone_number?: number | null
          role?: string | null
          salary?: number | null
          'vendor_business _name'?: string | null
          working_status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          business_code?: string | null
          business_name?: string | null
          full_name?: string | null
          his_email?: string | null
          is_vendor?: boolean | null
          main_branch?: string | null
          phone_number?: number | null
          role?: string | null
          salary?: number | null
          'vendor_business _name'?: string | null
          working_status?: string | null
          created_at?: string | null
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
