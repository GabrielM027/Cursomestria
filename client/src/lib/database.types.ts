/**
 * Tipos TypeScript gerados a partir do schema do Supabase v2
 * 
 * Schema simplificado: apenas profiles e enrollments
 * Conteúdo do curso vem de courseData.ts
 */

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
          user_id: string;
          full_name: string;
          role: 'student' | 'admin';
          created_at: string;
        };
        Insert: {
          user_id: string;
          full_name: string;
          role?: 'student' | 'admin';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string;
          role?: 'student' | 'admin';
          created_at?: string;
        };
      };
      enrollments: {
        Row: {
          user_id: string;
          status: 'active' | 'inactive';
          purchased_at: string | null;
          expires_at: string | null;
          payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: 'active' | 'inactive';
          purchased_at?: string | null;
          expires_at?: string | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          status?: 'active' | 'inactive';
          purchased_at?: string | null;
          expires_at?: string | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      has_active_enrollment: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
