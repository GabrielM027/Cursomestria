/**
 * Tipos TypeScript gerados a partir do schema do Supabase
 * 
 * Estes tipos fornecem type-safety para todas as operações do banco de dados
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
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name: string;
          role?: 'student' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string;
          role?: 'student' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      enrollments: {
        Row: {
          user_id: string;
          status: 'pending' | 'active' | 'expired' | 'cancelled';
          purchased_at: string | null;
          expires_at: string | null;
          payment_id: string | null;
          payment_status: string | null;
          payment_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: 'pending' | 'active' | 'expired' | 'cancelled';
          purchased_at?: string | null;
          expires_at?: string | null;
          payment_id?: string | null;
          payment_status?: string | null;
          payment_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          status?: 'pending' | 'active' | 'expired' | 'cancelled';
          purchased_at?: string | null;
          expires_at?: string | null;
          payment_id?: string | null;
          payment_status?: string | null;
          payment_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      modules: {
        Row: {
          id: number;
          slug: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          icon: string | null;
          image: string | null;
          lessons_count: number;
          estimated_hours: number;
          status: 'available' | 'coming-soon' | 'locked';
          color: string | null;
          phase: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          slug: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          icon?: string | null;
          image?: string | null;
          lessons_count?: number;
          estimated_hours?: number;
          status?: 'available' | 'coming-soon' | 'locked';
          color?: string | null;
          phase?: string | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string;
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          icon?: string | null;
          image?: string | null;
          lessons_count?: number;
          estimated_hours?: number;
          status?: 'available' | 'coming-soon' | 'locked';
          color?: string | null;
          phase?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: number;
          title: string;
          content: string | null;
          duration: string;
          type: 'video' | 'text' | 'quiz' | 'practice';
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          module_id: number;
          title: string;
          content?: string | null;
          duration: string;
          type: 'video' | 'text' | 'quiz' | 'practice';
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: number;
          title?: string;
          content?: string | null;
          duration?: string;
          type?: 'video' | 'text' | 'quiz' | 'practice';
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_progress: {
        Row: {
          user_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          user_id?: string;
          lesson_id?: string;
          completed?: boolean;
          completed_at?: string | null;
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
