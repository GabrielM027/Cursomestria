/**
 * Hook useEnrollment v2
 * 
 * Verifica se o usuário tem acesso ativo ao curso.
 * Schema simplificado: apenas verifica status === 'active' e expires_at > now()
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/lib/database.types';

type Enrollment = Database['public']['Tables']['enrollments']['Row'];

interface EnrollmentState {
  enrollment: Enrollment | null;
  hasAccess: boolean;
  loading: boolean;
  isExpired: boolean;
  needsPurchase: boolean;
}

export function useEnrollment(): EnrollmentState {
  const { user, isAdmin } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEnrollment(null);
      setLoading(false);
      return;
    }

    loadEnrollment();
  }, [user]);

  async function loadEnrollment() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, é esperado se não tiver matrícula
        throw error;
      }

      setEnrollment(data);
    } catch (error) {
      console.error('Erro ao carregar matrícula:', error);
      setEnrollment(null);
    } finally {
      setLoading(false);
    }
  }

  // Admins sempre têm acesso
  if (isAdmin) {
    return {
      enrollment,
      hasAccess: true,
      loading: false,
      isExpired: false,
      needsPurchase: false,
    };
  }

  // Verifica se tem matrícula ativa e não expirada
  const now = new Date();
  const isActive = enrollment?.status === 'active';
  const isExpired = enrollment?.expires_at
    ? new Date(enrollment.expires_at) < now
    : false;
  
  const hasAccess = isActive && !isExpired;
  const needsPurchase = !enrollment || enrollment.status === 'inactive';

  return {
    enrollment,
    hasAccess,
    loading,
    isExpired,
    needsPurchase,
  };
}
