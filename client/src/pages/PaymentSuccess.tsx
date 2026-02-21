/**
 * DESIGN: Blueprint Industrial
 * Página de Sucesso do Pagamento
 */

import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Ícone de Sucesso */}
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>

        {/* Título */}
        <h1 className="font-['Bebas_Neue'] text-4xl tracking-wide text-white mb-4">
          PAGAMENTO APROVADO!
        </h1>

        {/* Mensagem */}
        <p className="text-neutral-300 font-['IBM_Plex_Sans'] leading-relaxed mb-8">
          Parabéns! Seu pagamento foi aprovado com sucesso. Você já tem acesso
          completo ao curso Mestria.
        </p>

        {/* Detalhes */}
        <div className="bg-neutral-900/50 border border-neutral-800/50 p-6 mb-8 text-left">
          <h2 className="font-['Bebas_Neue'] text-lg tracking-wide text-white mb-4">
            PRÓXIMOS PASSOS
          </h2>
          <ul className="space-y-3 text-sm text-neutral-300 font-['IBM_Plex_Sans']">
            <li className="flex items-start gap-3">
              <span className="text-orange-400 font-bold">1.</span>
              <span>Acesse a área de estudos para ver todos os módulos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-400 font-bold">2.</span>
              <span>Comece pelo Módulo 01 - Leitura de Projetos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-400 font-bold">3.</span>
              <span>Faça as avaliações ao final de cada módulo</span>
            </li>
          </ul>
        </div>

        {/* Botão */}
        <Link href="/estudos">
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-semibold py-6 transition-colors">
            <BookOpen className="w-5 h-5 mr-2" />
            Acessar Área de Estudos
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>

        {/* Link alternativo */}
        <Link
          href="/"
          className="inline-block mt-6 text-sm text-neutral-500 hover:text-neutral-300 font-['IBM_Plex_Sans'] transition-colors"
        >
          Voltar para a página inicial
        </Link>
      </motion.div>
    </div>
  );
}
