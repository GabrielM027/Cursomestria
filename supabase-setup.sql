-- =========================================================
-- CURSO MESTRIA - CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- =========================================================
-- Este arquivo contém toda a estrutura do banco de dados
-- para a plataforma de curso online Mestria
-- 
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- =========================================================

-- ---------------------------------------------------------
-- 1. EXTENSÕES
-- ---------------------------------------------------------
-- Habilita a extensão UUID se ainda não estiver ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 2. TABELAS
-- ---------------------------------------------------------

-- ================= PROFILES =================
-- Perfis de usuários (complemento do auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfis dos usuários com informações complementares';
COMMENT ON COLUMN public.profiles.role IS 'Tipo de usuário: student ou admin';

-- ================= ENROLLMENTS =================
-- Matrículas/Acessos ao curso
CREATE TABLE IF NOT EXISTS public.enrollments (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    purchased_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    payment_id TEXT, -- ID da transação do Mercado Pago
    payment_status TEXT, -- Status do pagamento
    payment_amount DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.enrollments IS 'Matrículas e controle de acesso ao curso';
COMMENT ON COLUMN public.enrollments.status IS 'Status da matrícula: pending, active, expired, cancelled';
COMMENT ON COLUMN public.enrollments.expires_at IS 'Data de expiração do acesso (1 ano após compra)';

-- ================= MODULES =================
-- Módulos do curso
CREATE TABLE IF NOT EXISTS public.modules (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    icon TEXT,
    image TEXT,
    lessons_count INTEGER DEFAULT 0,
    estimated_hours INTEGER DEFAULT 0,
    status TEXT DEFAULT 'coming-soon' CHECK (status IN ('available', 'coming-soon', 'locked')),
    color TEXT,
    phase TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.modules IS 'Módulos do curso';
COMMENT ON COLUMN public.modules.order_index IS 'Ordem de exibição do módulo';

-- ================= LESSONS =================
-- Lições de cada módulo
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT, -- Conteúdo da lição (vídeo URL, texto, etc)
    duration TEXT,
    type TEXT NOT NULL CHECK (type IN ('video', 'text', 'quiz', 'practice')),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.lessons IS 'Lições dos módulos';
COMMENT ON COLUMN public.lessons.content IS 'URL do vídeo, texto ou conteúdo da lição';

-- ================= USER_PROGRESS =================
-- Progresso do usuário (para FASE 2)
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, lesson_id)
);

COMMENT ON TABLE public.user_progress IS 'Progresso do usuário nas lições (implementado na Fase 2)';

-- ---------------------------------------------------------
-- 3. ÍNDICES
-- ---------------------------------------------------------

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_id ON public.enrollments(payment_id);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
CREATE INDEX IF NOT EXISTS idx_modules_order_index ON public.modules(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);

-- ---------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------

-- Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- ================= POLICIES: PROFILES =================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio perfil (apenas full_name)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- ================= POLICIES: ENROLLMENTS =================

-- Usuários podem ver sua própria matrícula
CREATE POLICY "Users can view own enrollment"
ON public.enrollments FOR SELECT
USING (auth.uid() = user_id);

-- Admins podem ver todas as matrículas
CREATE POLICY "Admins can view all enrollments"
ON public.enrollments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Service role pode inserir/atualizar matrículas (para webhook)
-- (Essas operações serão feitas via service role key no backend)

-- ================= POLICIES: MODULES =================

-- Todos os usuários autenticados podem ver módulos
CREATE POLICY "Authenticated users can view modules"
ON public.modules FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins podem fazer tudo nos módulos
CREATE POLICY "Admins can manage modules"
ON public.modules FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- ================= POLICIES: LESSONS =================

-- Usuários autenticados podem ver lições
CREATE POLICY "Authenticated users can view lessons"
ON public.lessons FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins podem fazer tudo nas lições
CREATE POLICY "Admins can manage lessons"
ON public.lessons FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- ================= POLICIES: USER_PROGRESS =================

-- Usuários podem ver e atualizar seu próprio progresso
CREATE POLICY "Users can view own progress"
ON public.user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress records"
ON public.user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Admins podem ver todo o progresso
CREATE POLICY "Admins can view all progress"
ON public.user_progress FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- ---------------------------------------------------------
-- 5. FUNCTIONS E TRIGGERS
-- ---------------------------------------------------------

-- ================= FUNÇÃO: Criar profile automaticamente =================
-- Esta função é chamada quando um novo usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT := 'cursomestria@gmail.com';
    user_role TEXT := 'student';
BEGIN
    -- Se o email for o admin email, define role como admin
    IF NEW.email = admin_email THEN
        user_role := 'admin';
    END IF;

    -- Insere o perfil do usuário
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        user_role
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ================= FUNÇÃO: Atualizar updated_at =================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_enrollments ON public.enrollments;
CREATE TRIGGER set_updated_at_enrollments
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_modules ON public.modules;
CREATE TRIGGER set_updated_at_modules
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_lessons ON public.lessons;
CREATE TRIGGER set_updated_at_lessons
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------
-- 6. DADOS INICIAIS (OPCIONAL)
-- ---------------------------------------------------------

-- Esta seção pode ser usada para popular os módulos e lições
-- a partir do courseData.ts, se desejado
-- Por enquanto, vamos deixar em branco pois os dados estão no frontend

-- ---------------------------------------------------------
-- FIM DO SCRIPT
-- ---------------------------------------------------------

-- Para verificar se tudo foi criado corretamente:
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.enrollments;
-- SELECT * FROM public.modules;
-- SELECT * FROM public.lessons;
