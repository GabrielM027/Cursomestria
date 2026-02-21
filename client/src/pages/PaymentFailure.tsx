/**
 * DESIGN: Blueprint Industrial
 * Página de Falha no Pagamento
 */

import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { XCircle, ArrowRight, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentFailure() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Ícone de Erro */}
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-400" />
        </div>

        {/* Título */}
        <h1 className="font-['Bebas_Neue'] text-4xl tracking-wide text-white mb-4">
          PAGAMENTO NÃO APROVADO
        </h1>

        {/* Mensagem */}
        <p className="text-neutral-300 font-['IBM_Plex_Sans'] leading-relaxed mb-8">
          Infelizmente seu pagamento não foi aprovado. Isso pode acontecer por
          diversos motivos, mas você pode tentar novamente.
        </p>

        {/* Detalhes */}
        <div className="bg-neutral-900/50 border border-neutral-800/50 p-6 mb-8 text-left">
          <h2 className="font-['Bebas_Neue'] text-lg tracking-wide text-white mb-4">
            MOTIVOS COMUNS
          </h2>
          <ul className="space-y-3 text-sm text-neutral-300 font-['IBM_Plex_Sans']">
            <li className="flex items-start gap-3">
              <span className="text-red-400 font-bold">•</span>
              <span>Cartão sem limite disponível</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 font-bold">•</span>
              <span>Dados do cartão incorretos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 font-bold">•</span>
              <span>Problema com a operadora do cartão</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 font-bold">•</span>
              <span>Endereço de cobrança não confere</span>
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Link href="/checkout">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-semibold py-6 transition-colors">
              <RefreshCcw className="w-5 h-5 mr-2" />
              Tentar Novamente
              <ArrowRight className="w-5 h-5 ml-2" />
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
