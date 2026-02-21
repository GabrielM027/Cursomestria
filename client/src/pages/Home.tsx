/*
 * DESIGN: Blueprint Industrial — PÁGINA DE VENDAS OTIMIZADA v2
 * Fluxo de conversão: valor → identificação → prova → estrutura → confiança → oferta → segurança → decisão
 * Mobile-first: botão fixo, espaçamento thumb-friendly, áreas de toque generosas
 * Otimizações: hero com prova social, público-alvo emocional, micro-benefícios, autoridade, FAQ reordenado
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Play,
  Shield,
  Target,
  Users,
  Layers,
  Wrench,
  BarChart3,
  Smartphone,
  Lock,
  Zap,
  AlertTriangle,
  TrendingUp,
  Star,
  ShieldCheck,
  BadgeCheck,
  Hammer,
  HardHat,
  FileCheck,
  ArrowRight,
  GraduationCap,
  Timer,
  CreditCard,
  CircleCheck,
  MapPin,
  Ruler,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HERO_IMAGE,
  MODULE_IMAGES,
  modules,
  getTotalHours,
  getTotalLessons,
  COURSE_EMAIL,
} from "@/lib/courseData";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neutral-800/60 bg-neutral-900/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4 min-h-[56px]"
      >
        <span className="font-['IBM_Plex_Sans'] font-medium text-sm sm:text-base text-neutral-200">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-orange-400 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
          <p className="text-sm text-neutral-400 font-['IBM_Plex_Sans'] leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const totalLessons = getTotalLessons();
  const totalHours = getTotalHours();
  const [showStickyBtn, setShowStickyBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBtn(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ========== HERO — HEADLINE + PROVA SOCIAL + CERTIFICAÇÃO ========== */}
      <section className="relative min-h-[calc(100svh-3.5rem)] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Canteiro de obras profissional"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 container py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl"
          >
            {/* Selos de prova */}
            <motion.div variants={fadeUp} className="mb-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 rounded-sm text-orange-400 text-xs font-mono tracking-[0.15em] uppercase">
                <BadgeCheck className="w-3.5 h-3.5" />
                Preparatório para Certificação
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-sm text-green-400 text-xs font-mono tracking-[0.15em] uppercase">
                <Zap className="w-3.5 h-3.5" />
                Acesso Imediato
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-['Bebas_Neue'] text-5xl sm:text-6xl md:text-8xl leading-[0.9] tracking-wide text-white mb-3"
            >
              DE PEDREIRO A<br />
              <span className="text-orange-400">MESTRE DE OBRAS</span>
            </motion.h1>

            {/* Subtítulo direto e específico */}
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-neutral-200 leading-relaxed mb-2 max-w-lg font-['IBM_Plex_Sans'] font-medium"
            >
              Domine leitura de projetos, normas ABNT e gestão de canteiro.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="text-base text-neutral-400 leading-relaxed mb-6 max-w-lg font-['IBM_Plex_Sans']"
            >
              Formação completa em{" "}
              <strong className="text-white">10 módulos</strong> que seguem a{" "}
              <strong className="text-white">ordem real de uma obra</strong> — do alicerce ao acabamento.
            </motion.p>

            {/* Números de prova */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-6 mb-8"
            >
              {[
                { value: "10", label: "Módulos", icon: Layers },
                { value: `${totalHours}h`, label: "de Conteúdo", icon: Clock },
                { value: `${totalLessons}`, label: "Lições", icon: BookOpen },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-orange-500/15 flex items-center justify-center rounded-sm">
                    <stat.icon className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <span className="block text-lg font-['Bebas_Neue'] text-white tracking-wide leading-none">
                      {stat.value}
                    </span>
                    <span className="block text-[11px] font-mono text-neutral-500 leading-none mt-0.5">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTA visível sem rolagem */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-6">
              <a href="#preco">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-semibold px-8 py-6 text-base rounded-sm gap-2 shadow-lg shadow-orange-500/20"
                >
                  <Play className="w-5 h-5" />
                  Começar Agora — R$ 197
                </Button>
              </a>
              <a href="#conteudo">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white font-['IBM_Plex_Sans'] px-8 py-6 text-base rounded-sm gap-2"
                >
                  Ver Grade Completa
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-5">
              {[
                { text: "100% no Celular", icon: Smartphone },
                { text: "Garantia de 7 dias", icon: ShieldCheck },
                { text: "Baseado em Normas ABNT", icon: Shield },
              ].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                  <t.icon className="w-3.5 h-3.5 text-green-500/70" />
                  {t.text}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-5 h-8 border-2 border-neutral-600 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-orange-400 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ========== SEÇÃO DOR — O PROBLEMA ========== */}
      <section className="py-20 sm:py-28 bg-[#080808]">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="text-red-400/80 text-xs font-mono tracking-[0.2em] uppercase block mb-3">
                Você se identifica?
              </span>
              <h2 className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wide text-white">
                CANSADO DE SER <span className="text-red-400">SUBESTIMADO</span> NA OBRA?
              </h2>
            </motion.div>

            <motion.div variants={stagger} className="space-y-4">
              {[
                "Você trabalha duro, faz de tudo na obra, mas o salário não acompanha seu esforço.",
                "Quando chega um projeto complexo, você fica inseguro porque nunca aprendeu a ler plantas de verdade.",
                "Vê mestres com menos habilidade que você ganhando mais, só porque têm o diploma.",
                "Quer crescer na carreira, mas não sabe por onde começar nem tem tempo para cursos presenciais.",
                "Tem medo de assumir uma obra maior porque falta conhecimento técnico sobre normas e estruturas.",
              ].map((text, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex items-start gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-sm"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400/70 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-neutral-300 font-['IBM_Plex_Sans'] leading-relaxed">
                    {text}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-center mt-10 text-lg font-['IBM_Plex_Sans'] text-neutral-400"
            >
              Se você se identificou com pelo menos uma dessas situações,{" "}
              <strong className="text-orange-400">o Mestria foi feito para você.</strong>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ========== SEÇÃO SOLUÇÃO — O CURSO ========== */}
      <section className="py-20 sm:py-28 bg-[#0a0a0a] relative overflow-hidden">
        <div className="container max-w-5xl relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-orange-400 text-xs font-mono tracking-[0.2em] uppercase block mb-3">
                A Solução
              </span>
              <h2 className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wide text-white mb-4">
                CONHEÇA O <span className="text-orange-400">MESTRIA</span>
              </h2>
              <p className="text-neutral-400 font-['IBM_Plex_Sans'] max-w-2xl mx-auto leading-relaxed">
                O primeiro curso de Mestre de Obras 100% online que segue a ordem real de uma construção.
                Você aprende na mesma sequência que a obra acontece — do alicerce ao acabamento.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {[
                {
                  img: MODULE_IMAGES.projects,
                  title: "Teoria Aplicada",
                  desc: "Conteúdo técnico baseado nas normas ABNT, traduzido para linguagem de canteiro. Sem enrolação.",
                },
                {
                  img: MODULE_IMAGES.structure,
                  title: "Vídeos Práticos",
                  desc: "Cada lição acompanha vídeos complementares de obras reais. Você vê a teoria acontecendo na prática.",
                },
                {
                  img: MODULE_IMAGES.safety,
                  title: "Provas e Simulados",
                  desc: "Quizzes no estilo das provas de certificação oficial. Prepare-se para conquistar o diploma.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="group relative overflow-hidden bg-neutral-900/60 border border-neutral-800/60"
                >
                  <div className="h-40 overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-['Bebas_Neue'] text-xl tracking-wide text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-400 font-['IBM_Plex_Sans'] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== PÚBLICO-ALVO — CONEXÃO EMOCIONAL COM EVOLUÇÃO ========== */}
      <section className="py-20 sm:py-28 bg-[#080808]">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-orange-400 text-xs font-mono tracking-[0.2em] uppercase block mb-3">
                Para Quem é o Mestria
              </span>
              <h2 className="font-['Bebas_Neue'] text-3xl sm:text-5xl tracking-wide text-white mb-3">
                DE ONDE VOCÊ ESTÁ HOJE
                <br />
                <span className="text-orange-400">PARA ONDE VOCÊ QUER CHEGAR.</span>
              </h2>
              <p className="text-neutral-400 font-['IBM_Plex_Sans'] max-w-xl mx-auto leading-relaxed mt-4">
                Não importa seu ponto de partida. O Mestria te leva do conhecimento prático ao domínio técnico completo.
              </p>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  icon: Wrench,
                  title: "Pedreiros Experientes",
                  before: "Sabe fazer, mas não sabe explicar tecnicamente",
                  after: "Lidera equipes com autoridade técnica e ganha mais",
                },
                {
                  icon: GraduationCap,
                  title: "Buscando Certificação",
                  before: "Perde oportunidades por falta de diploma",
                  after: "Preparado para passar na prova de certificação",
                },
                {
                  icon: Users,
                  title: "Ajudantes com Ambição",
                  before: "Preso no operacional sem perspectiva de crescimento",
                  after: "Carreira sólida com conhecimento técnico de verdade",
                },
                {
                  icon: Award,
                  title: "Mestres sem Formação",
                  before: "Atua na prática, mas inseguro nas decisões técnicas",
                  after: "Domina normas, se certifica e toma decisões com confiança",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="group p-6 bg-neutral-900/40 border border-neutral-800/40 hover:border-orange-500/30 hover:bg-neutral-900/60 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-11 h-11 bg-orange-500/10 group-hover:bg-orange-500/20 flex items-center justify-center rounded-sm transition-colors duration-300">
                      <item.icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="font-['Bebas_Neue'] text-lg tracking-wide text-white">
                      {item.title}
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 bg-red-500/10 flex items-center justify-center rounded-full mt-0.5">
                        <span className="text-red-400 text-[10px] font-bold">✕</span>
                      </span>
                      <p className="text-sm text-neutral-500 font-['IBM_Plex_Sans'] leading-relaxed">
                        {item.before}
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 bg-green-500/15 flex items-center justify-center rounded-full mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      </span>
                      <p className="text-sm text-green-400/90 font-['IBM_Plex_Sans'] leading-relaxed font-medium">
                        {item.after}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== GRADE DO CURSO — FASES COM MICRO-BENEFÍCIOS PRÁTICOS ========== */}
      <section id="conteudo" className="py-20 sm:py-28 bg-[#0a0a0a]">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-6">
              <span className="text-orange-400 text-xs font-mono tracking-[0.2em] uppercase block mb-3">
                Grade Completa
              </span>
              <h2 className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wide text-white mb-4">
                10 MÓDULOS. 5 FASES.
                <br />
                <span className="text-orange-400">UMA FORMAÇÃO COMPLETA.</span>
              </h2>
            </motion.div>

            {/* Linha de contexto */}
            <motion.p
              variants={fadeUp}
              className="text-center text-neutral-400 font-['IBM_Plex_Sans'] max-w-xl mx-auto leading-relaxed mb-14"
            >
              Você aprende exatamente na <strong className="text-white">ordem real de uma obra</strong>.
              Cada fase prepara você para a próxima — sem pular etapas, sem lacunas.
            </motion.p>

            {/* Fases com progresso visual e micro-benefícios práticos */}
            <motion.div variants={stagger} className="space-y-8">
              {[
                {
                  phase: "Fase 1 — Antes da Obra",
                  benefit: "Você chega no canteiro sabendo ler qualquer projeto e conhecendo todas as normas",
                  color: "border-blue-500/30",
                  dotColor: "bg-blue-500",
                  mods: modules.filter(m => m.phase === "Fase 1 — Antes da Obra"),
                },
                {
                  phase: "Fase 2 — Estrutura",
                  benefit: "Você garante fundação, estrutura e alvenaria seguras e dentro da norma",
                  color: "border-orange-500/30",
                  dotColor: "bg-orange-500",
                  mods: modules.filter(m => m.phase === "Fase 2 — Estrutura"),
                },
                {
                  phase: "Fase 3 — Sistemas",
                  benefit: "Você elimina retrabalho em hidráulica e elétrica — o erro mais caro da obra",
                  color: "border-cyan-500/30",
                  dotColor: "bg-cyan-500",
                  mods: modules.filter(m => m.phase === "Fase 3 — Sistemas"),
                },
                {
                  phase: "Fase 4 — Fechamento",
                  benefit: "Você entrega acabamento com padrão profissional, sem improvisação",
                  color: "border-green-500/30",
                  dotColor: "bg-green-500",
                  mods: modules.filter(m => m.phase === "Fase 4 — Fechamento"),
                },
                {
                  phase: "Fase 5 — Gestão",
                  benefit: "Você controla orçamento, equipe e cronograma como um mestre de verdade",
                  color: "border-yellow-500/30",
                  dotColor: "bg-yellow-500",
                  mods: modules.filter(m => m.phase === "Fase 5 — Gestão"),
                },
              ].map((group, idx) => (
                <motion.div key={group.phase} variants={fadeUp} className="relative">
                  {/* Linha de progresso vertical */}
                  {idx < 4 && (
                    <div className="absolute left-[15px] top-[40px] bottom-[-32px] w-[2px] bg-neutral-800/60 hidden sm:block" />
                  )}

                  {/* Header da fase */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`flex-shrink-0 w-[32px] h-[32px] rounded-full ${group.dotColor} flex items-center justify-center text-sm relative z-10`}>
                      <span className="text-white font-bold text-xs">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-orange-400/80 tracking-[0.15em] uppercase">
                          {group.phase}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-['IBM_Plex_Sans'] mt-1 flex items-start gap-1.5 leading-relaxed">
                        <ArrowRight className="w-3 h-3 text-green-500/70 flex-shrink-0 mt-0.5" />
                        {group.benefit}
                      </p>
                    </div>
                  </div>

                  {/* Módulos da fase */}
                  <div className="sm:ml-[48px] space-y-2">
                    {group.mods.map((mod) => (
                      <div
                        key={mod.id}
                        className={`group flex items-center gap-4 bg-neutral-900/40 border ${group.color} p-4 sm:p-5 hover:border-orange-500/30 transition-all`}
                      >
                        <div
                          className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl rounded-sm"
                          style={{ background: `${mod.color}20` }}
                        >
                          {mod.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono text-neutral-500 tracking-[0.15em] uppercase">
                            {mod.subtitle}
                          </p>
                          <h3 className="font-['Bebas_Neue'] text-base sm:text-lg tracking-wide text-white truncate">
                            {mod.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <span className="text-xs font-mono hidden sm:block">
                            {mod.lessons.length} lições
                          </span>
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Resumo total após a grade */}
            <motion.div
              variants={fadeUp}
              className="mt-12 p-5 bg-orange-500/5 border border-orange-500/20 rounded-sm text-center"
            >
              <p className="text-sm font-['IBM_Plex_Sans'] text-neutral-300">
                <strong className="text-orange-400">{totalLessons} lições</strong> ·{" "}
                <strong className="text-orange-400">{totalHours} horas</strong> de conteúdo técnico ·{" "}
                <strong className="text-orange-400">10 quizzes</strong> de avaliação
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== DIFERENCIAIS — BENEFÍCIO DIRETO AO ALUNO ========== */}
      <section className="py-20 sm:py-28 bg-[#080808]">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-orange-400 text-xs font-mono tracking-[0.2em] uppercase block mb-3">
                Por que o Mestria
              </span>
              <h2 className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wide text-white">
                O QUE TORNA ESTE CURSO{" "}
                <span className="text-orange-400">DIFERENTE</span>
              </h2>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  icon: Lock,
                  title: "Progressão Inteligente",
                  benefit: "Você nunca se perde no conteúdo",
                  desc: "O próximo módulo só desbloqueia quando você dominar o anterior. Sem pular etapas, sem lacunas.",
                },
                {
                  icon: Play,
                  title: "Vídeos Complementares",
                  benefit: "Você vê a teoria acontecendo na prática",
                  desc: "Cada lição acompanha vídeos de obras reais selecionados para reforçar o aprendizado.",
                },
                {
                  icon: Shield,
                  title: "Baseado em Normas ABNT",
                  benefit: "Você aprende o jeito certo e legal",
                  desc: "Todo conteúdo segue as NBRs e NRs vigentes. Preparação real para provas de certificação.",
                },
                {
                  icon: Target,
                  title: "Foco na Certificação",
                  benefit: "Você chega na prova pronto para passar",
                  desc: "Simulados no estilo das provas oficiais. Estratégia inteligente para conquistar o diploma.",
                },
                {
                  icon: Smartphone,
                  title: "100% no Celular",
                  benefit: "Você estuda onde e quando quiser",
                  desc: "No ônibus, no almoço ou em casa. A plataforma funciona perfeitamente no celular.",
                },
                {
                  icon: BarChart3,
                  title: "Realidade de Obra Brasileira",
                  benefit: "Conteúdo feito para o nosso canteiro",
                  desc: "Nada de teoria importada. Tudo baseado na realidade das obras brasileiras, com materiais e técnicas do nosso mercado.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="group p-6 bg-neutral-900/40 border border-neutral-800/40 hover:border-orange-500/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-500/10 group-hover:bg-orange-500/20 flex items-center justify-center rounded-sm transition-colors">
                      <item.icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-['Bebas_Neue'] text-lg tracking-wide text-white leading-tight">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-green-500/80 mb-2 flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3" />
                    {item.benefit}
                  </p>
                  <p className="text-sm text-neutral-400 font-['IBM_Plex_Sans'] leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== CONFIANÇA E AUTORIDADE — NÚMEROS CONCRETOS ========== */}
      <section className="py-16 sm:py-24 bg-[#0a0a0a]">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-['Bebas_Neue'] text-3xl sm:text-4xl tracking-wide text-white mb-3">
                UM CURSO CONSTRUÍDO COM <span className="text-orange-400">MÉTODO</span>
              </h2>
              <p className="text-neutral-400 font-['IBM_Plex_Sans'] max-w-lg mx-auto text-sm leading-relaxed">
                Cada módulo foi estruturado com base nas normas técnicas brasileiras e na experiência real de canteiro de obras.
              </p>
            </motion.div>

            {/* Números de autoridade */}
            <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { number: "10", label: "Módulos completos", sublabel: "do básico ao avançado" },
                { number: `${totalLessons}`, label: "Lições técnicas", sublabel: "conteúdo exclusivo" },
                { number: `${totalHours}h`, label: "De formação", sublabel: "estudo no seu ritmo" },
                { number: "10", label: "Quizzes de prova", sublabel: "estilo certificação" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center p-5 bg-neutral-900/30 border border-neutral-800/30"
                >
                  <span className="font-['Bebas_Neue'] text-3xl sm:text-4xl text-orange-400 tracking-wide leading-none mb-1">
                    {item.number}
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-200 font-['IBM_Plex_Sans'] leading-snug font-medium">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    {item.sublabel}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Credenciais do método */}
            <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: FileCheck, label: "Normas ABNT atualizadas" },
                { icon: Hammer, label: "Ordem real de obra" },
                { icon: BadgeCheck, label: "Foco em certificação" },
                { icon: Zap, label: "Ensino direto ao ponto" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex items-center gap-2.5 p-3 bg-neutral-900/20 border border-neutral-800/20"
                >
                  <item.icon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-[11px] sm:text-xs text-neutral-400 font-['IBM_Plex_Sans'] leading-snug">
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== SEÇÃO PREÇO — VALUE FRAMING ========== */}
      <section id="preco" className="py-20 sm:py-28 bg-[#080808] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5" />
        <div className="container max-w-lg relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.span
              variants={fadeUp}
              className="text-orange-400 text-xs font-mono tracking-[0.2em] uppercase block mb-3"
            >
              Investimento
            </motion.span>

            {/* Título de valor com comparação */}
            <motion.h2
              variants={fadeUp}
              className="font-['Bebas_Neue'] text-3xl sm:text-4xl tracking-wide text-white mb-3"
            >
              FORMAÇÃO COMPLETA POR MENOS QUE
              <br />
              <span className="text-orange-400">UMA DIÁRIA DE ERRO NA OBRA.</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-neutral-400 font-['IBM_Plex_Sans'] text-sm mb-4 max-w-md mx-auto leading-relaxed"
            >
              Um erro de leitura de projeto pode custar milhares. O Mestria se paga na primeira semana de trabalho como Mestre.
            </motion.p>

            {/* Comparação de valor */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 text-xs font-mono"
            >
              <span className="text-neutral-500 line-through">Curso presencial: R$ 2.000+</span>
              <span className="hidden sm:block text-neutral-700">|</span>
              <span className="text-neutral-500 line-through">Técnico em edificações: R$ 5.000+</span>
              <span className="hidden sm:block text-neutral-700">|</span>
              <span className="text-orange-400 font-bold">Mestria: R$ 197</span>
            </motion.div>

            {/* Price Card */}
            <motion.div
              variants={fadeUp}
              className="relative bg-gradient-to-b from-neutral-900 to-neutral-900/80 border-2 border-orange-500/40 p-8 sm:p-10"
            >
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-orange-500 text-white text-xs font-mono tracking-[0.15em] uppercase px-4 py-1.5 font-bold">
                  Oferta de Lançamento
                </span>
              </div>

              <div className="mt-4 mb-6">
                <p className="text-neutral-500 font-mono text-sm line-through mb-1">
                  De R$ 297,00
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-neutral-400 font-['IBM_Plex_Sans'] text-lg">R$</span>
                  <span className="font-['Bebas_Neue'] text-7xl sm:text-8xl text-white tracking-wide">
                    197
                  </span>
                </div>
                <p className="text-neutral-400 font-['IBM_Plex_Sans'] text-sm mt-1">
                  ou <strong className="text-white">12x de R$ 19,42</strong>
                </p>
                <p className="text-[11px] text-neutral-500 font-mono mt-1">
                  Menos de R$ 0,55 por dia de acesso
                </p>
              </div>

              {/* Scarcity */}
              <div className="bg-orange-500/10 border border-orange-500/20 p-3 mb-6 rounded-sm">
                <p className="text-orange-400 text-xs font-mono tracking-wider text-center">
                  <Zap className="w-3.5 h-3.5 inline mr-1" />
                  PREÇO VÁLIDO PARA OS PRIMEIROS 100 ALUNOS
                </p>
              </div>

              {/* Destaques de acesso imediato */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Acesso imediato", icon: Zap },
                  { label: "Sem mensalidade", icon: CheckCircle },
                  { label: "1 ano de acesso", icon: Timer },
                ].map((h, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-3 bg-neutral-800/30 rounded-sm">
                    <h.icon className="w-4 h-4 text-orange-400 mb-1.5" />
                    <span className="text-[11px] text-neutral-300 font-mono leading-tight">{h.label}</span>
                  </div>
                ))}
              </div>

              {/* What's included */}
              <div className="space-y-3 mb-8 text-left">
                {[
                  "10 módulos completos (82 lições)",
                  `${totalHours} horas de conteúdo técnico`,
                  "Vídeos práticos complementares",
                  "Quizzes e simulados estilo prova",
                  "Progressão inteligente por módulos",
                  "Acesso por 1 ano completo",
                  "100% otimizado para celular",
                  "Conteúdo baseado em normas ABNT",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-neutral-300 font-['IBM_Plex_Sans']">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a href="#preco">
                <Button
                  size="lg"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-bold px-8 py-7 text-lg rounded-sm gap-2 shadow-lg shadow-orange-500/25"
                >
                  QUERO ME TORNAR MESTRE
                </Button>
              </a>

              <p className="text-xs text-neutral-500 font-mono mt-4 text-center flex items-center justify-center gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                Pagamento seguro via cartão de crédito
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== GARANTIA — REDUÇÃO DE RISCO ENFÁTICA ========== */}
      <section className="py-16 sm:py-24 bg-[#0a0a0a]">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="relative p-8 sm:p-10 bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/30"
          >
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center border-2 border-green-500/30">
                  <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-['Bebas_Neue'] text-3xl tracking-wide text-white mb-3">
                  GARANTIA INCONDICIONAL DE 7 DIAS
                </h3>
                <p className="text-base text-neutral-200 font-['IBM_Plex_Sans'] leading-relaxed mb-3">
                  <strong className="text-green-400">Teste o curso inteiro sem nenhum risco.</strong>
                </p>
                <p className="text-sm text-neutral-400 font-['IBM_Plex_Sans'] leading-relaxed mb-3">
                  Acesse os módulos, assista às lições, faça os quizzes. Se em 7 dias você sentir que o curso não é para você, basta nos enviar uma mensagem e devolvemos{" "}
                  <strong className="text-white">100% do seu dinheiro</strong>. Sem perguntas, sem burocracia.
                </p>
                <p className="text-sm text-green-400/80 font-['IBM_Plex_Sans'] font-medium">
                  O risco é todo nosso. A decisão é toda sua.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== FAQ — REORDENADO POR OBJEÇÃO DE COMPRA ========== */}
      <section className="py-20 sm:py-28 bg-[#080808]">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-orange-400 text-xs font-mono tracking-[0.2em] uppercase block mb-3">
                Tire Suas Dúvidas
              </span>
              <h2 className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wide text-white">
                PERGUNTAS FREQUENTES
              </h2>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-2">
              {/* Ordem: objeções de compra primeiro, depois operacionais */}
              <FAQItem
                question="E se eu não gostar do curso?"
                answer="Você tem 7 dias de garantia incondicional. Se por qualquer motivo sentir que o curso não é para você, basta nos enviar uma mensagem e devolvemos 100% do valor pago. Sem perguntas, sem burocracia. O risco é zero."
              />
              <FAQItem
                question="Posso parcelar o pagamento?"
                answer="Sim! Você pode parcelar em até 12x de R$ 19,42 no cartão de crédito. O pagamento é processado de forma segura. São menos de R$ 0,55 por dia para transformar sua carreira."
              />
              <FAQItem
                question="O curso dá certificado ou diploma?"
                answer="O Mestria é um curso livre de capacitação profissional. Ele te prepara com todo o conhecimento técnico necessário para passar nas provas de certificação oficial (como SENAI ou Certificação por Competência), onde você obtém o diploma reconhecido. Nossos simulados seguem o estilo das provas oficiais."
              />
              <FAQItem
                question="Preciso ter experiência em obras para fazer o curso?"
                answer="Não é obrigatório, mas recomendamos que você tenha pelo menos uma noção básica de construção civil. O curso foi pensado para pedreiros, ajudantes e profissionais que já atuam na área e querem evoluir para o cargo de Mestre de Obras."
              />
              <FAQItem
                question="Este curso serve para quem já trabalha na área?"
                answer="Com certeza! Na verdade, quem já trabalha na construção civil é quem mais se beneficia. Você já tem a prática — o Mestria vai te dar a base técnica, as normas e a visão de gestão que faltam para você assumir o comando de uma obra com segurança."
              />
              <FAQItem
                question="Quanto tempo tenho de acesso ao curso?"
                answer="Você terá acesso por 1 ano completo a partir da data da compra. Esse tempo é mais que suficiente para concluir todos os 10 módulos com calma, estudando 1 a 2 horas por dia."
              />
              <FAQItem
                question="Como funciona a liberação dos módulos?"
                answer="Os módulos são liberados por progressão. Ao concluir o quiz de um módulo com nota mínima de 70%, o próximo é desbloqueado automaticamente. Isso garante que você aprenda na ordem correta, sem pular etapas."
              />
              <FAQItem
                question="O curso funciona no celular?"
                answer="Sim! O Mestria foi desenvolvido com a filosofia 'mobile-first'. Toda a plataforma, incluindo lições, vídeos e quizzes, funciona perfeitamente no celular. Você pode estudar no ônibus, no almoço ou em qualquer lugar."
              />
              <FAQItem
                question="Os vídeos são do próprio curso?"
                answer="O curso utiliza conteúdo técnico escrito exclusivo, complementado por vídeos práticos cuidadosamente selecionados que mostram cada processo construtivo na prática. Essa combinação garante que você entenda a teoria e veja como ela acontece no canteiro."
              />
              <FAQItem
                question="Qual a diferença entre este curso e um técnico em edificações?"
                answer="O técnico em edificações é um curso longo (2+ anos) e caro (R$ 5.000+) que forma profissionais para projetar. O Mestria é focado especificamente na função de Mestre de Obras: liderar equipes, ler projetos, fiscalizar execução e garantir qualidade. É mais rápido, mais prático e custa uma fração do valor."
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== CTA FINAL — URGÊNCIA MODERADA COM PROVA DE VALOR ========== */}
      <section className="py-20 sm:py-28 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5" />
        <div className="container relative z-10 max-w-2xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center"
          >
            <motion.div variants={fadeUp}>
              <Award className="w-12 h-12 text-orange-400 mx-auto mb-6" />
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wide text-white mb-4"
            >
              SUA CARREIRA NA CONSTRUÇÃO
              <br />
              <span className="text-orange-400">MERECE ESSE PRÓXIMO PASSO.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-neutral-400 font-['IBM_Plex_Sans'] mb-3 leading-relaxed"
            >
              Enquanto você pensa, outros profissionais já estão se qualificando.
              São {totalLessons} lições, {totalHours} horas de conteúdo e 10 módulos
              que vão transformar sua carreira na construção civil.
            </motion.p>

            {/* Prova de valor rápida */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4 text-sm font-['IBM_Plex_Sans'] text-neutral-300"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Acesso imediato
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Garantia de 7 dias
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                12x de R$ 19,42
              </span>
            </motion.div>

            {/* Urgência moderada */}
            <motion.p
              variants={fadeUp}
              className="text-sm text-orange-400/80 font-mono mb-8"
            >
              Preço de lançamento válido para os primeiros 100 alunos.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col items-center gap-4">
              <a href="#preco">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-bold px-12 py-7 text-lg rounded-sm gap-2 shadow-lg shadow-orange-500/25"
                >
                  QUERO ME TORNAR MESTRE — R$ 197
                </Button>
              </a>
              <span className="text-xs text-neutral-600 font-mono flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" />
                Pagamento seguro · Acesso imediato · Garantia de 7 dias
              </span>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap justify-center gap-6 mt-10"
            >
              {[
                { icon: Shield, text: "Normas ABNT" },
                { icon: Smartphone, text: "100% no Celular" },
                { icon: Target, text: "Foco em Certificação" },
                { icon: Lock, text: "Progressão Inteligente" },
              ].map((badge, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-neutral-500 text-xs font-mono"
                >
                  <badge.icon className="w-3.5 h-3.5 text-orange-500/60" />
                  {badge.text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-8 bg-[#050505] border-t border-neutral-900">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-500 flex items-center justify-center rounded-sm">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-['Bebas_Neue'] text-lg tracking-wider text-neutral-400">
                MESTRIA
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <a
                href={`mailto:${COURSE_EMAIL}`}
                className="text-xs text-neutral-500 hover:text-orange-400 font-mono transition-colors"
              >
                {COURSE_EMAIL}
              </a>
              <span className="hidden sm:block text-neutral-800">|</span>
              <p className="text-xs text-neutral-600 font-mono">
                Formação de Mestre de Obras &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* ========== BOTÃO FIXO MOBILE — THUMB-FRIENDLY ========== */}
      {showStickyBtn && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-neutral-800/60 sm:hidden">
          <a href="#preco" className="block">
            <Button
              size="lg"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-['IBM_Plex_Sans'] font-bold py-5 text-base rounded-sm gap-2 shadow-lg shadow-orange-500/25"
            >
              QUERO ME TORNAR MESTRE — R$ 197
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
