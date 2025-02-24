export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          business_code: string;
          email: string;
          role: string;
          is_vendor: boolean;
          main_branch: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_code: string;
          email: string;
          role: string;
          is_vendor?: boolean;
          main_branch?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_code?: string;
          email?: string;
          role?: string;
          is_vendor?: boolean;
          main_branch?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_transactions: {
        Row: {
          transaction_id: string;
          vendor_code: string;
          business_code: string;
          branch_name: string | null;
          transaction_type: 'product_sale' | 'tax' | 'expense' | 'rental';
          amount: number;
          profit: number;
          transaction_date: string;
          status: 'completed' | 'pending' | 'cancelled';
          notes: string | null;
          tax_period: string | null;
          rental_start_date: string | null;
          rental_end_date: string | null;
          product_name: string | null;
          product_quantity: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          transaction_id?: string;
          vendor_code: string;
          business_code: string;
          branch_name?: string | null;
          transaction_type: 'product_sale' | 'tax' | 'expense' | 'rental';
          amount: number;
          profit: number;
          transaction_date: string;
          status?: 'completed' | 'pending' | 'cancelled';
          notes?: string | null;
          tax_period?: string | null;
          rental_start_date?: string | null;
          rental_end_date?: string | null;
          product_name?: string | null;
          product_quantity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          transaction_id?: string;
          vendor_code?: string;
          business_code?: string;
          branch_name?: string | null;
          transaction_type?: 'product_sale' | 'tax' | 'expense' | 'rental';
          amount?: number;
          profit?: number;
          transaction_date?: string;
          status?: 'completed' | 'pending' | 'cancelled';
          notes?: string | null;
          tax_period?: string | null;
          rental_start_date?: string | null;
          rental_end_date?: string | null;
          product_name?: string | null;
          product_quantity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
