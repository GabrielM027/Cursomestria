/**
 * Protected Route Component
 * 
 * Componente que protege rotas, exigindo autenticação.
 * Redireciona para login se o usuário não estiver autenticado.
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEnrollment?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireEnrollment = false 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400 text-sm font-['IBM_Plex_Sans']">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada (useEffect vai redirecionar)
  if (!user) {
    return null;
  }

  // Se estiver autenticado, renderiza o conteúdo
  return <>{children}</>;
}
