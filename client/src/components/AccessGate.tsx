/**
 * Access Gate Component
 * 
 * Verifica se o usuário tem acesso ao curso (matrícula ativa).
 * Se não tiver, exibe mensagem com botão para checkout.
 */

import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Lock, ShoppingCart, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnrollment } from '@/hooks/useEnrollment';
import { Loader2 } from 'lucide-react';

interface AccessGateProps {
  children: React.ReactNode;
}

export default function AccessGate({ children }: AccessGateProps) {
  const { hasAccess, loading, isExpired, needsPurchase } = useEnrollment();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400 text-sm font-['IBM_Plex_Sans']">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  // Acesso liberado
  if (hasAccess) {
    return <>{children}</>;
  }

  // Sem acesso - precisa comprar ou renovar
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Ícone */}
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          {isExpired ? (
            <Clock className="w-12 h-12 text-orange-400" />
          ) : (
            <Lock className="w-12 h-12 text-orange-400" />
          )}
        </div>

        {/* Título */}
        <h1 className="font-['Bebas_Neue'] text-4xl tracking-wide text-white mb-4">
          {isExpired ? 'SEU ACESSO EXPIROU' : 'ACESSO RESTRITO'}
        </h1>

        {/* Mensagem */}
        <p className="text-neutral-300 font-['IBM_Plex_Sans'] leading-relaxed mb-8">
          {isExpired
            ? 'Seu acesso ao curso expirou. Renove agora para continuar aprendendo.'
            : 'Você precisa adquirir o curso para acessar este conteúdo.'}
        </p>

        {/* Detalhes do Curso */}
        <div className="bg-neutral-900/50 border border-neutral-800/50 p-6 mb-8 text-left">
          <h2 className="font-['Bebas_Neue'] text-lg tracking-wide text-white mb-4">
            O QUE VOCÊ VAI RECEBER
          </h2>
          <ul className="space-y-3">
            {[
              'Acesso completo a todos os 10 módulos',
              '80+ lições em vídeo e texto',
              'Material de apoio para download',
              'Certificado digital de conclusão',
              'Acesso por 1 ano',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-300 font-['IBM_Plex_Sans']">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Link href="/checkout">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-semibold py-6 transition-colors">
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isExpired ? 'Renovar Acesso - R$ 197,00' : 'Adquirir Curso - R$ 197,00'}
            </Button>
          </Link>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white font-['IBM_Plex_Sans'] font-semibold py-6 transition-colors"
            >
              Voltar para a Página Inicial
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
