/**
 * Configuração do Supabase Client
 * 
 * Este arquivo cria e exporta o cliente Supabase para uso em toda a aplicação.
 * Usa as variáveis de ambiente definidas no arquivo .env
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL e Anon Key são obrigatórios. Verifique seu arquivo .env'
  );
}

/**
 * Cliente Supabase com tipagem
 * Use este cliente em toda a aplicação para interagir com o Supabase
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
