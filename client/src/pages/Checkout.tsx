/**
 * DESIGN: Blueprint Industrial
 * Página de Checkout - Mercado Pago
 * Mantém o visual do projeto: tema escuro, acentos laranja/azul
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  CheckCircle, 
  Shield, 
  CreditCard,
  ArrowRight,
  Loader2,
  Lock,
  Clock,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const COURSE_PRICE = 197.00;

export default function Checkout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!user) {
      toast.error('Você precisa estar logado para comprar o curso');
      return;
    }

    setLoading(true);

    try {
      // Chama a API para criar a preference do Mercado Pago
      const response = await axios.post('/api/create-checkout', {
        user_id: user.id,
      });

      const { init_point } = response.data;

      if (init_point) {
        // Redireciona para o checkout do Mercado Pago
        window.location.href = init_point;
      } else {
        throw new Error('Não foi possível criar o checkout');
      }
    } catch (error: any) {
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao processar pagamento', {
        description: error.response?.data?.error || 'Tente novamente mais tarde',
      });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero/Header */}
      <section className="py-10 sm:py-14 border-b border-neutral-800/30">
        <div className="container">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-orange-500 flex items-center justify-center rounded-sm">
              <span className="text-white font-bold text-sm font-['Bebas_Neue']">M</span>
            </div>
            <span className="font-['Bebas_Neue'] text-xl tracking-wider text-white">
              MESTRIA
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-orange-400 text-xs font-mono tracking-[0.2em] uppercase block mb-2">
              Checkout
            </span>
            <h1 className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wide text-white mb-4">
              GARANTA SEU ACESSO
            </h1>
            <p className="text-neutral-400 text-base font-['IBM_Plex_Sans'] max-w-2xl">
              Você está a um passo de se tornar um Mestre de Obras certificado.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <section className="py-10">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Coluna Esquerda - Detalhes do Curso */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:col-span-3 space-y-6"
            >
              {/* O que está incluído */}
              <div className="bg-neutral-900/50 border border-neutral-800/50 p-6">
                <h2 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white mb-4">
                  O QUE ESTÁ INCLUÍDO
                </h2>
                <ul className="space-y-3">
                  {[
                    'Acesso completo a todos os 10 módulos',
                    '80+ lições em vídeo e texto',
                    '90+ horas de conteúdo técnico',
                    'Material de apoio para download',
                    'Certificado digital de conclusão',
                    'Suporte direto via comunidade',
                    'Acesso vitalício às atualizações',
                    'Garantia de 7 dias',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-neutral-300 font-['IBM_Plex_Sans']">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Garantia */}
              <div className="bg-green-500/10 border border-green-500/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 flex items-center justify-center shrink-0 rounded">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-xl tracking-wide text-white mb-2">
                      GARANTIA DE 7 DIAS
                    </h3>
                    <p className="text-sm text-neutral-300 font-['IBM_Plex_Sans'] leading-relaxed">
                      Se você não estiver satisfeito com o curso, devolvemos 100% do seu
                      dinheiro nos primeiros 7 dias. Sem perguntas, sem complicação.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Coluna Direita - Resumo do Pedido */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="md:col-span-2"
            >
              <div className="bg-neutral-900/50 border border-neutral-800/50 p-6 sticky top-20">
                <h2 className="font-['Bebas_Neue'] text-xl tracking-wide text-white mb-4">
                  RESUMO DO PEDIDO
                </h2>

                {/* Detalhes do Produto */}
                <div className="space-y-4 mb-6 pb-6 border-b border-neutral-800/50">
                  <div>
                    <p className="text-sm font-semibold text-white font-['IBM_Plex_Sans'] mb-1">
                      Curso Mestria - Formação Completa
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <BookOpen className="w-3 h-3" />
                      <span>10 módulos • 80+ lições</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>Acesso por 1 ano</span>
                    </div>
                  </div>
                </div>

                {/* Preço */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-['IBM_Plex_Sans']">
                      Subtotal
                    </span>
                    <span className="text-white font-semibold font-['IBM_Plex_Sans']">
                      R$ {COURSE_PRICE.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-800/50">
                    <span className="font-['Bebas_Neue'] text-lg text-white">
                      TOTAL
                    </span>
                    <span className="font-['Bebas_Neue'] text-2xl text-orange-400">
                      R$ {COURSE_PRICE.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Botão de Checkout */}
                <Button
                  onClick={handleCheckout}
                  disabled={loading || !user}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-semibold py-6 transition-colors mb-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Ir para Pagamento
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {!user && (
                  <p className="text-xs text-center text-orange-400 mb-4 font-['IBM_Plex_Sans']">
                    Você precisa estar logado para continuar
                  </p>
                )}

                {/* Segurança */}
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                  <Lock className="w-3 h-3" />
                  <span className="font-['IBM_Plex_Sans']">
                    Pagamento 100% seguro via Mercado Pago
                  </span>
                </div>

                {/* Métodos de Pagamento */}
                <div className="mt-6 pt-6 border-t border-neutral-800/50">
                  <p className="text-xs text-neutral-500 text-center font-['IBM_Plex_Sans'] mb-3">
                    Formas de pagamento aceitas:
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {['PIX', 'Cartão', 'Boleto'].map((method) => (
                      <div
                        key={method}
                        className="px-3 py-1.5 bg-neutral-800/50 border border-neutral-700/50 text-xs text-neutral-400 font-mono"
                      >
                        {method}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-[#050505] border-t border-neutral-900">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 flex items-center justify-center rounded-sm">
              <span className="text-white font-bold text-[10px]">M</span>
            </div>
            <span className="font-['Bebas_Neue'] text-sm tracking-wider text-neutral-500">
              MESTRIA
            </span>
          </div>
          <p className="text-[10px] text-neutral-700 font-mono">
            &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
