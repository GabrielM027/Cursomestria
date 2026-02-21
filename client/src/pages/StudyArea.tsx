/*
 * DESIGN: Blueprint Industrial
 * Área de Estudos - Módulos agrupados por Fase da Obra
 * Tema escuro, acentos laranja (segurança) e azul (blueprint)
 * Header removido - agora é global via Sidebar no App.tsx
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Layers,
  ChevronRight,
  Lock,
} from "lucide-react";
import {
  modules,
  getTotalProgress,
  getTotalHours,
  getTotalLessons,
  type Module,
} from "@/lib/courseData";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

// Agrupa módulos por fase
function groupByPhase(mods: Module[]): { phase: string; modules: Module[] }[] {
  const groups: { phase: string; modules: Module[] }[] = [];
  for (const mod of mods) {
    const existing = groups.find((g) => g.phase === mod.phase);
    if (existing) {
      existing.modules.push(mod);
    } else {
      groups.push({ phase: mod.phase, modules: [mod] });
    }
  }
  return groups;
}

const phaseDescriptions: Record<string, string> = {
  "Fase 1 — Antes da Obra": "Planejamento, leitura de projetos e normas de segurança. Tudo que você precisa saber antes de pisar no canteiro.",
  "Fase 2 — Estrutura": "Do alicerce ao teto. Fundações, concreto armado e alvenaria na ordem que acontece na obra.",
  "Fase 3 — Sistemas": "Tubulações e fiação. Instalações que passam dentro das paredes antes do revestimento.",
  "Fase 4 — Fechamento": "Telhado, impermeabilização e acabamentos. Do contrapiso até a pintura final.",
  "Fase 5 — Gestão": "Orçamento, liderança e certificação. A visão completa do Mestre de Obras.",
};

const phaseIcons: Record<string, string> = {
  "Fase 1 — Antes da Obra": "📋",
  "Fase 2 — Estrutura": "🏗️",
  "Fase 3 — Sistemas": "🔧",
  "Fase 4 — Fechamento": "🏠",
  "Fase 5 — Gestão": "📊",
};

export default function StudyArea() {
  const totalProgress = getTotalProgress(modules);
  const totalLessons = getTotalLessons();
  const totalHours = getTotalHours();
  const phases = groupByPhase(modules);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero da Área de Estudos */}
      <section className="py-10 sm:py-14 border-b border-neutral-800/30">
        <div className="container">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.span
              variants={fadeUp}
              className="text-orange-400 text-xs font-mono tracking-[0.2em] uppercase block mb-2"
            >
              Área de Estudos
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wide text-white mb-4"
            >
              SEUS MÓDULOS
            </motion.h1>

            {/* Stats Row */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-6 mb-6"
            >
              {[
                { icon: BookOpen, value: totalLessons.toString(), label: "Lições" },
                { icon: Clock, value: `${totalHours}h`, label: "Conteúdo" },
                { icon: Layers, value: "10", label: "Módulos" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <stat.icon className="w-4 h-4 text-orange-400/70" />
                  <span className="text-sm font-bold text-white font-['IBM_Plex_Sans']">
                    {stat.value}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono uppercase">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Progress Bar */}
            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-neutral-500 tracking-[0.15em] uppercase">
                  Progresso Geral
                </span>
                <span className="text-sm font-bold text-orange-400 font-mono">
                  {totalProgress}%
                </span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Módulos Agrupados por Fase */}
      <section className="py-8 sm:py-10">
        <div className="container">
          {phases.map((group, groupIdx) => (
            <motion.div
              key={group.phase}
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="mb-10 last:mb-0"
            >
              {/* Phase Header */}
              <motion.div
                variants={fadeUp}
                className="mb-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{phaseIcons[group.phase] || "📌"}</span>
                  <h2 className="font-['Bebas_Neue'] text-xl sm:text-2xl tracking-wide text-white">
                    {group.phase.toUpperCase()}
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 font-['IBM_Plex_Sans'] leading-relaxed max-w-xl ml-10">
                  {phaseDescriptions[group.phase] || ""}
                </p>
                <div className="mt-3 ml-10 h-px bg-gradient-to-r from-orange-500/30 via-neutral-800/50 to-transparent" />
              </motion.div>

              {/* Module Cards Grid */}
              <motion.div
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-0 sm:ml-4"
              >
                {group.modules.map((mod) => (
                  <motion.div key={mod.id} variants={fadeUp}>
                    <Link href={`/modulo/${mod.slug}`}>
                      <div className="group relative bg-neutral-900/50 border border-neutral-800/50 overflow-hidden hover:border-orange-500/30 transition-all duration-300 cursor-pointer h-full">
                        {/* Module Image */}
                        <div className="relative h-36 overflow-hidden">
                          {mod.image ? (
                            <img
                              src={mod.image}
                              alt={mod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${mod.color}30, ${mod.color}10)`,
                              }}
                            >
                              <span className="text-5xl opacity-40">{mod.icon}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />

                          {/* Status Badge */}
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                              <Lock className="w-2.5 h-2.5" />
                              Em breve
                            </span>
                          </div>

                          {/* Icon */}
                          <div className="absolute bottom-3 left-4">
                            <span className="text-2xl">{mod.icon}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <p className="text-[10px] font-mono text-neutral-500 tracking-[0.15em] uppercase mb-1">
                            {mod.subtitle}
                          </p>
                          <h3 className="font-['Bebas_Neue'] text-lg tracking-wide text-white mb-2 group-hover:text-orange-400 transition-colors">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-neutral-500 font-['IBM_Plex_Sans'] leading-relaxed line-clamp-2 mb-3">
                            {mod.description}
                          </p>

                          {/* Meta */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-neutral-600">
                              <span className="flex items-center gap-1 text-[10px] font-mono">
                                <BookOpen className="w-3 h-3" />
                                {mod.lessons.length} lições
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-mono">
                                <Clock className="w-3 h-3" />
                                {mod.estimatedHours}h
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-orange-400 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
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
