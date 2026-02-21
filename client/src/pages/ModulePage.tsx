/*
 * DESIGN: Blueprint Industrial
 * Página de módulo individual com lista de lições, progresso e placeholder de conteúdo
 * Header removido - agora é global via Sidebar no App.tsx
 */
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  PlayCircle,
  FileText,
  HelpCircle,
  Wrench,
  CheckCircle2,
  Lock,
  ChevronRight,
} from "lucide-react";
import { modules, getModuleProgress } from "@/lib/courseData";
import { toast } from "sonner";

const typeIcons: Record<string, React.ReactNode> = {
  video: <PlayCircle className="w-4 h-4" />,
  text: <FileText className="w-4 h-4" />,
  quiz: <HelpCircle className="w-4 h-4" />,
  practice: <Wrench className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  video: "Vídeo Aula",
  text: "Conteúdo Técnico",
  quiz: "Avaliação",
  practice: "Prática",
};

const typeColors: Record<string, string> = {
  video: "rgb(248, 113, 113)",
  text: "rgb(96, 165, 250)",
  quiz: "rgb(251, 146, 60)",
  practice: "rgb(74, 222, 128)",
};

export default function ModulePage() {
  const params = useParams<{ slug: string }>();
  const module = modules.find((m) => m.slug === params.slug);

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <h1 className="font-['Bebas_Neue'] text-3xl text-white mb-4">
            MÓDULO NÃO ENCONTRADO
          </h1>
          <Link
            href="/estudos"
            className="text-orange-400 hover:underline text-sm font-['IBM_Plex_Sans']"
          >
            Voltar aos módulos
          </Link>
        </div>
      </div>
    );
  }

  const progress = getModuleProgress(module);
  const isComingSoon = module.status === "coming-soon";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Module header */}
      <section className="relative overflow-hidden">
        {module.image ? (
          <div className="absolute inset-0">
            <img
              src={module.image}
              alt={module.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/50" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${module.color}22, #0a0a0a)`,
            }}
          />
        )}

        <div className="relative container py-8 pt-6">
          {/* Back button */}
          <Link
            href="/estudos"
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white text-sm mb-6 transition-colors font-['IBM_Plex_Sans']"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos módulos
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">{module.icon}</span>
              <div className="flex-1">
                <p className="text-[10px] font-mono text-neutral-500 tracking-[0.15em] uppercase mb-1">
                  {module.subtitle} <span className="text-orange-400/60 ml-2">• {module.phase}</span>
                </p>
                <h1 className="font-['Bebas_Neue'] text-3xl sm:text-4xl tracking-wide text-white leading-tight">
                  {module.title}
                </h1>
              </div>
            </div>

            <p className="text-sm text-neutral-400 font-['IBM_Plex_Sans'] leading-relaxed max-w-2xl mb-6">
              {module.description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-5 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <span className="text-neutral-400 font-['IBM_Plex_Sans']">
                  {module.lessonsCount} lições
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-neutral-400 font-['IBM_Plex_Sans']">
                  {module.estimatedHours}h estimadas
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="max-w-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-neutral-500 tracking-[0.15em] uppercase">
                  Progresso do Módulo
                </span>
                <span className="text-sm font-bold text-orange-400 font-mono">
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Coming soon banner */}
      {isComingSoon && (
        <div className="container py-4">
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white font-['IBM_Plex_Sans']">
                Conteúdo em desenvolvimento
              </p>
              <p className="text-xs text-neutral-400 font-['IBM_Plex_Sans']">
                Este módulo será liberado em breve. A estrutura das lições já
                está definida abaixo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lessons list */}
      <section className="container py-6 pb-16">
        <h2 className="font-['Bebas_Neue'] text-xl tracking-wide text-white mb-5">
          LIÇÕES
        </h2>

        <div className="space-y-2">
          {module.lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <button
                onClick={() => {
                  if (isComingSoon) {
                    toast("Conteúdo em breve", {
                      description:
                        "Este módulo ainda está sendo desenvolvido. Aguarde!",
                    });
                  } else {
                    toast("Abrindo lição", {
                      description: lesson.title,
                    });
                  }
                }}
                className={`w-full text-left border transition-all ${
                  lesson.completed
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-neutral-800/50 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/70"
                } p-4`}
              >
                <div className="flex items-center gap-3">
                  {/* Lesson number */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono"
                    style={{
                      background: lesson.completed
                        ? "rgb(34, 197, 94)"
                        : `${typeColors[lesson.type]}22`,
                      color: lesson.completed
                        ? "#0a0a0a"
                        : typeColors[lesson.type],
                    }}
                  >
                    {lesson.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Lesson info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium font-['IBM_Plex_Sans'] truncate ${
                        lesson.completed
                          ? "text-neutral-500 line-through"
                          : "text-white"
                      }`}
                    >
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="flex items-center gap-1 text-[10px] font-mono font-medium"
                        style={{ color: typeColors[lesson.type] }}
                      >
                        {typeIcons[lesson.type]}
                        {typeLabels[lesson.type]}
                      </span>
                      <span className="text-[10px] text-neutral-600 font-mono">
                        {lesson.duration}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-neutral-700 shrink-0" />
                </div>
              </button>
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
