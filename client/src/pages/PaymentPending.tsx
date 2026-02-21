/**
 * DESIGN: Blueprint Industrial
 * Página de Pagamento Pendente
 */

import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentPending() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Ícone de Pendente */}
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-12 h-12 text-yellow-400" />
        </div>

        {/* Título */}
        <h1 className="font-['Bebas_Neue'] text-4xl tracking-wide text-white mb-4">
          PAGAMENTO PENDENTE
        </h1>

        {/* Mensagem */}
        <p className="text-neutral-300 font-['IBM_Plex_Sans'] leading-relaxed mb-8">
          Seu pagamento está sendo processado. Assim que for aprovado, você
          receberá um email de confirmação e terá acesso completo ao curso.
        </p>

        {/* Detalhes */}
        <div className="bg-neutral-900/50 border border-neutral-800/50 p-6 mb-8 text-left">
          <h2 className="font-['Bebas_Neue'] text-lg tracking-wide text-white mb-4">
            O QUE FAZER AGORA?
          </h2>
          <ul className="space-y-3 text-sm text-neutral-300 font-['IBM_Plex_Sans']">
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 font-bold">•</span>
              <span>
                Pagamentos por boleto podem levar até 3 dias úteis para serem
                confirmados
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 font-bold">•</span>
              <span>Pagamentos por PIX são aprovados em até 1 hora</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 font-bold">•</span>
              <span>
                Você receberá um email assim que o pagamento for confirmado
              </span>
            </li>
          </ul>
        </div>

        {/* Botão */}
        <Link href="/">
          <Button className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-['IBM_Plex_Sans'] font-semibold py-6 transition-colors">
            <Home className="w-5 h-5 mr-2" />
            Voltar para a Página Inicial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
