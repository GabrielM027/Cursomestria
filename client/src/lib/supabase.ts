import { createClient } from "@supabase/supabase-js";

const publicSupabaseUrl = "https://tqkbehwjylktpfrguvlr.supabase.co";
const publicSupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxa2JlaHdqeWxrdHBmcmd1dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDM3OTMsImV4cCI6MjA4NzI3OTc5M30.y3_oPDjhM-u2Bq-R5YfOhonyfv8lChjfP2_zlAlu4Wg";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || publicSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || publicSupabaseAnonKey;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "amigos-fc-admin",
  },
});
