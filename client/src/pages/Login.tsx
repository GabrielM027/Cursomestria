/**
 * DESIGN: Blueprint Industrial
 * Página de Login
 * Mantém o visual do projeto: tema escuro, acentos laranja/azul
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error('Erro ao fazer login', {
        description: error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : error.message,
      });
    } else {
      toast.success('Login realizado com sucesso!');
      setLocation('/estudos');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-orange-500 flex items-center justify-center rounded-sm">
            <span className="text-white font-bold text-lg font-['Bebas_Neue']">M</span>
          </div>
          <span className="font-['Bebas_Neue'] text-2xl tracking-wider text-white">
            MESTRIA
          </span>
        </Link>

        {/* Card de Login */}
        <div className="bg-neutral-900/50 border border-neutral-800/50 p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-['Bebas_Neue'] text-3xl tracking-wide text-white mb-2">
              FAZER LOGIN
            </h1>
            <p className="text-sm text-neutral-400 font-['IBM_Plex_Sans']">
              Entre com sua conta para acessar o curso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono text-neutral-400 tracking-wider uppercase mb-2"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10 bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-600 font-['IBM_Plex_Sans']"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono text-neutral-400 tracking-wider uppercase mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-600 font-['IBM_Plex_Sans']"
                  required
                />
              </div>
            </div>

            {/* Botão de Login */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-semibold py-6 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Link para Cadastro */}
          <div className="mt-6 pt-6 border-t border-neutral-800/50">
            <p className="text-sm text-neutral-400 text-center font-['IBM_Plex_Sans']">
              Não tem uma conta?{' '}
              <Link
                href="/cadastro"
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        {/* Link para Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-300 font-['IBM_Plex_Sans'] transition-colors"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
