-- =============================================================================
-- CURSO MESTRIA - SCHEMA SIMPLIFICADO v2
-- Arquitetura Serverless para Vercel
-- =============================================================================

-- ATENÇÃO: Este SQL substitui o supabase-setup.sql original
-- Execute apenas UMA VEZ no Supabase Dashboard > SQL Editor

-- =============================================================================
-- 1. EXTENSÕES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 2. TABELA: profiles
-- Estende auth.users com informações adicionais
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfis de usuários do sistema';
COMMENT ON COLUMN public.profiles.user_id IS 'ID do usuário (referência auth.users)';
COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.profiles.role IS 'Papel: student ou admin';

-- =============================================================================
-- 3. TABELA: enrollments
-- Matrícula do aluno no curso
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  payment_id TEXT UNIQUE, -- Para idempotência
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.enrollments IS 'Matrículas dos alunos no curso';
COMMENT ON COLUMN public.enrollments.user_id IS 'ID do usuário matriculado';
COMMENT ON COLUMN public.enrollments.status IS 'Status: active ou inactive';
COMMENT ON COLUMN public.enrollments.purchased_at IS 'Data da compra';
COMMENT ON COLUMN public.enrollments.expires_at IS 'Data de expiração do acesso';
COMMENT ON COLUMN public.enrollments.payment_id IS 'ID do pagamento (Mercado Pago) - único para idempotência';

-- =============================================================================
-- 4. ÍNDICES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_id ON public.enrollments(payment_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at ON public.enrollments(expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- =============================================================================
-- 5. FUNÇÕES AUXILIARES
-- =============================================================================

-- Função: Verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Verificar se usuário tem matrícula ativa
CREATE OR REPLACE FUNCTION public.has_active_enrollment()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Verificar se é o email do admin
CREATE OR REPLACE FUNCTION public.is_admin_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- IMPORTANTE: Substitua pelo seu email de admin
  RETURN email = 'cursomestria@gmail.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 6. TRIGGER: Criar profile automaticamente ao registrar
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
BEGIN
  -- Obter nome do metadata ou usar email como fallback
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Verificar se é o email do admin
  IF public.is_admin_email(NEW.email) THEN
    user_role := 'admin';
  ELSE
    user_role := 'student';
  END IF;
  
  -- Criar perfil
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, user_name, user_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 7. TRIGGER: Atualizar updated_at em enrollments
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_enrollment_updated ON public.enrollments;

CREATE TRIGGER on_enrollment_updated
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PROFILES - Políticas
-- -----------------------------------------------------------------------------

-- SELECT: Qualquer usuário autenticado pode ver perfis
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Apenas via trigger (service_role)
-- Nenhuma policy de INSERT = bloqueado para usuários normais

-- UPDATE: Próprio usuário OU admin
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR public.is_admin()
  )
  WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
  );

-- DELETE: Nunca (apenas via cascade)
-- Nenhuma policy de DELETE = bloqueado

-- -----------------------------------------------------------------------------
-- ENROLLMENTS - Políticas
-- -----------------------------------------------------------------------------

-- SELECT: Próprio usuário OU admin
CREATE POLICY "enrollments_select_own_or_admin" ON public.enrollments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR public.is_admin()
  );

-- INSERT: Apenas via service_role (webhook)
-- Nenhuma policy de INSERT = bloqueado para usuários normais

-- UPDATE: Apenas via service_role (webhook)
-- Nenhuma policy de UPDATE = bloqueado para usuários normais

-- DELETE: Apenas admin
CREATE POLICY "enrollments_delete_admin_only" ON public.enrollments
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- 9. GRANTS
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.enrollments TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT DELETE ON public.enrollments TO authenticated;

-- Service role tem acesso total (para webhooks)
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.enrollments TO service_role;

-- =============================================================================
-- FIM DO SCHEMA v2
-- =============================================================================
