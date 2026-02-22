/*
 * DESIGN: Blueprint Industrial
 * Dados estruturais do curso Mestria - Formação de Mestre de Obras
 * Módulos numerados de 01 a 10
 * REORGANIZADO: Segue a ordem cronológica real de uma obra
 * Cada lição dentro do módulo respeita a progressão de pré-requisitos
 */

// E-mail oficial do curso
// Configure your course email in .env (ADMIN_EMAIL)
export const COURSE_EMAIL = "seu-email-admin@exemplo.com";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "text" | "quiz" | "practice";
  completed: boolean;
}

export interface Module {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  image?: string;
  lessonsCount: number;
  estimatedHours: number;
  status: "available" | "coming-soon" | "locked";
  lessons: Lesson[];
  color: string;
  phase: string; // Fase da obra
}

export const HERO_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/8ebRCbiZtvhDp5WUeLywUG/sandbox/jL7YZfiAr4RQZZNQvPklUx-img-1_1771518901000_na1fn_aGVyby1iYW5uZXI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOGViUkNiaVp0dmhEcDVXVWVMeXdVRy9zYW5kYm94L2pMN1laZmlBcjRSUVpaTlF2UGtsVXgtaW1nLTFfMTc3MTUxODkwMTAwMF9uYTFmbl9hR1Z5YnkxaVlXNXVaWEkuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=iEhmOs7rZyLn5qSsNuRltZE8Mmb0U2zqMHqMQ-KO4gihPkxHtFmMRS~OiJhnGQd1pNpKJft40zZnb5MNLZQS85qcqrxmV8EB2OrmXufb4JQxKv~TJvX4mNn4Hy2lpNBaWNI0tSK-0WvPSDn6rxS3bSoWzAqnKXJ7tCUBJ-CHnFST2fosTGhJYoreDka-GqsqjsADKGSyyzsO8TIWKHhBTBGHo-dy6jA2ebEMxOND91kauuEHSiXaknUF6xtsZwHsn5REpcZgBY9NR7NVvU6IinJs-OVcIC5nkG~Z7RILyFefDhUpAWm8ewRdhSqdyfMVZoOl9A4DTZEOHg2YepF3Fw__";

export const MODULE_IMAGES = {
  projects: "https://private-us-east-1.manuscdn.com/sessionFile/8ebRCbiZtvhDp5WUeLywUG/sandbox/jL7YZfiAr4RQZZNQvPklUx-img-2_1771518896000_na1fn_bW9kdWxlLXByb2plY3Rz.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOGViUkNiaVp0dmhEcDVXVWVMeXdVRy9zYW5kYm94L2pMN1laZmlBcjRSUVpaTlF2UGtsVXgtaW1nLTJfMTc3MTUxODg5NjAwMF9uYTFmbl9iVzlrZFd4bExYQnliMnBsWTNSei5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ELiJaB~61HEnUSlEVUlJc8deYYYHyOU5lrGvEiVWALONAg4khxw2Ok6Nlig0o7zc~YepTP73IKRG~pbsgKgbpLRn8tgC4yNxNNoYhSbsUrvh9Gxd5x7MO3ymOEBAL1vCrWZZ0zOuPwnfCwXxMMsLtM8R6gsdIeo2Q1KUc-X1Ai~1i4zlGPfqziFsq16exITEogYgKJcCAV7kSyLz8gmWN12BeYgBYHJZUc77d-25n9QSH3KqFuGE~aQXgAYEUc1XdEw71Ugfbnc73FmgxCFNiGqpGwO2mZUWLV2f44nFjL93ySPnpkwa4kuWuHxKFkXqilojmHxbVmYcCrZyrAQobg__",
  safety: "https://private-us-east-1.manuscdn.com/sessionFile/8ebRCbiZtvhDp5WUeLywUG/sandbox/jL7YZfiAr4RQZZNQvPklUx-img-3_1771518899000_na1fn_bW9kdWxlLXNhZmV0eQ.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOGViUkNiaVp0dmhEcDVXVWVMeXdVRy9zYW5kYm94L2pMN1laZmlBcjRSUVpaTlF2UGtsVXgtaW1nLTNfMTc3MTUxODg5OTAwMF9uYTFmbl9iVzlrZFd4bExYTmhabVYwZVEuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=RNNpvB3tUwVCdURn9eDnSxPzi2xf-rhBXkCabYfJpmE9-PNHm0xQY85CjxkvoCRh9BV2QVIPgfP~gxdD0eIVeejBB6T9L70RZzvs38tPrJoag1x8i7An8k41b8-HHsa3Iyk4ojszfKtd2JrZ~aMjYyZDPFVu0XZTxcPBS7vT~bDnGd42yAmt81eHnzI7RfBq-Dsl9usdBzAkpBkDO4ZgbZEFAF0BPAQPExAKjw-zT3W2bQa0kWl6gW21pE6I6xHvJ0EJWNkKBEx4unh-GZF6yZDn-zmhpBuqdMeW-89MMioVQINmWU7E4kf8w1y77AP4HHsC9N-hgjdMRuvn8vIBSQ__",
  structure: "https://private-us-east-1.manuscdn.com/sessionFile/8ebRCbiZtvhDp5WUeLywUG/sandbox/jL7YZfiAr4RQZZNQvPklUx-img-4_1771518908000_na1fn_bW9kdWxlLXN0cnVjdHVyZQ.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOGViUkNiaVp0dmhEcDVXVWVMeXdVRy9zYW5kYm94L2pMN1laZmlBcjRSUVpaTlF2UGtsVXgtaW1nLTRfMTc3MTUxODkwODAwMF9uYTFmbl9iVzlrZFd4bExYTjBjblZqZEhWeVpRLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Wsthmi2dlf5keYC5VxZm26uqVBX95GoFx-Vg3guDvBMVBLIs5O7QlIxpCI2gqaaP6FVZcejfh--Yi0HljQPF~Tgm0Av9CrvGf~uWCCXytSqhuAhFQRrW8RZe1zqknrtnibIAG2Qw-gsSf7Tbhk6Ku2Ry0gxt2q4eV3Tm7BTFRackfa6~w8At0TvK2FTHqXvAJkoT~yl6ZIUt-eO2nF2j0BCyLs~xSTV21eXfLpzev5n-WHISmeeQrpJacJZ1QsQLTuqfWR7gSIHg5SR6G3Qzjp-ht023-tOMMaYMSnDrbQ8x7w5hVA-PD-AgS-Nw2oJGJ5EkDG~rMOa~fZZwhmR9kg__",
  finishing: "https://private-us-east-1.manuscdn.com/sessionFile/8ebRCbiZtvhDp5WUeLywUG/sandbox/jL7YZfiAr4RQZZNQvPklUx-img-5_1771518909000_na1fn_bW9kdWxlLWZpbmlzaGluZw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOGViUkNiaVp0dmhEcDVXVWVMeXdVRy9zYW5kYm94L2pMN1laZmlBcjRSUVpaTlF2UGtsVXgtaW1nLTVfMTc3MTUxODkwOTAwMF9uYTFmbl9iVzlrZFd4bExXWnBibWx6YUdsdVp3LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=a435cRwgLtxaz-yA-yBvuaR4bLA1DYG5h20H~q9QqtgLW~SXCzOzJrvQAN0VTDuxenk0caH5kux6uRoZZm5Ah4N3HKhzOgpqCrwFxbcE5MrlNczEGcKwYNWKMP5Z0k3h1c4SaKmJbQHf96UZdhVcxnITPFAITf7b9SRMBK8DBPuN7eULm4Qd8aij2r7qqj0EJpzY1PDGKHZ6CMeowH9cWl7CyIeC5-t0CiZTrQomqv3IrMEyF52zqRa1vj6YHHn3~uBWKVLWNjoYCj9vpNrhf4Uj8hzSbPDO3oSCgJghbSX3I5tRqeJOwO7Bzk0YbjAq-bjbC4Te~0qlIhYxmol9Fg__",
};

// Resumo dos módulos para a landing page
export const courseHighlights = [
  {
    icon: "📐",
    title: "Leitura de Projetos",
    description: "Plantas baixas, cortes, fachadas e projetos estruturais completos.",
  },
  {
    icon: "🛡️",
    title: "Normas e Segurança",
    description: "NR-18, NR-35, NBRs e tudo que cai nas provas de certificação.",
  },
  {
    icon: "🏗️",
    title: "Gestão de Canteiro",
    description: "Planejamento, cronograma, logística e liderança de equipes.",
  },
  {
    icon: "🏛️",
    title: "Estruturas de Concreto",
    description: "Fck, Slump Test, armações, fôrmas e concretagem profissional.",
  },
  {
    icon: "🔧",
    title: "Instalações Completas",
    description: "Hidráulica, elétrica, esgoto e combate a incêndio em edifícios.",
  },
  {
    icon: "📊",
    title: "Orçamento e Gestão",
    description: "Quantitativos, composição de custos e preparação para certificação.",
  },
];

/*
 * ORDEM DOS MÓDULOS - Segue a cronologia real de uma obra:
 *
 * FASE 1 - ANTES DA OBRA (Planejamento)
 *   01. Leitura de Projetos → Sem ler projeto, não começa nada
 *   02. Normas e Segurança → Antes de pisar no canteiro, conhecer as regras
 *   03. Canteiro e Planejamento → Organizar o espaço antes de construir
 *
 * FASE 2 - ESTRUTURA (Do chão para cima)
 *   04. Fundações → Primeiro serviço real: o alicerce
 *   05. Estruturas de Concreto → Pilares, vigas e lajes (esqueleto)
 *   06. Alvenaria → Só levanta parede depois da estrutura
 *
 * FASE 3 - SISTEMAS (Dentro das paredes, antes de fechar)
 *   07. Instalações Hidráulicas e Elétricas → Tubulação e fiação antes do revestimento
 *
 * FASE 4 - FECHAMENTO (De cima para baixo)
 *   08. Coberturas e Impermeabilização → Proteger antes de acabar
 *   09. Revestimentos e Acabamentos → Contrapiso → Impermeab. piso → Cerâmica → Pintura
 *
 * FASE 5 - GESTÃO (Visão completa do Mestre)
 *   10. Gestão, Orçamento e Certificação → Fecha com a visão gerencial
 */

export const modules: Module[] = [
  // ═══════════════════════════════════════════════════════
  // FASE 1 - ANTES DA OBRA (Planejamento e Teoria)
  // ═══════════════════════════════════════════════════════
  {
    id: 1,
    slug: "leitura-projetos",
    title: "LEITURA E INTERPRETAÇÃO DE PROJETOS",
    subtitle: "Módulo 01",
    description: "Domine a leitura de plantas baixas, cortes, fachadas e projetos estruturais. Aprenda a simbologia técnica e a extrair informações essenciais para a execução da obra.",
    icon: "📐",
    image: MODULE_IMAGES.projects,
    lessonsCount: 8,
    estimatedHours: 8,
    status: "coming-soon",
    color: "oklch(0.58 0.18 255)",
    phase: "Fase 1 — Antes da Obra",
    lessons: [
      // Progressão: O que é um projeto → tipos → planta baixa (mais simples) → cortes → simbologia → estrutural (mais complexo) → hidráulico/elétrico → prática
      { id: "1-1", title: "O que é um projeto e quem faz cada um", duration: "20 min", type: "text", completed: false },
      { id: "1-2", title: "Planta baixa: leitura completa passo a passo", duration: "35 min", type: "video", completed: false },
      { id: "1-3", title: "Escalas, cotas e medidas no projeto", duration: "25 min", type: "video", completed: false },
      { id: "1-4", title: "Cortes e elevações: como interpretar", duration: "30 min", type: "video", completed: false },
      { id: "1-5", title: "Simbologia técnica: portas, janelas, paredes", duration: "25 min", type: "text", completed: false },
      { id: "1-6", title: "Projeto estrutural: lendo ferragens e fôrmas", duration: "40 min", type: "video", completed: false },
      { id: "1-7", title: "Projeto hidráulico e elétrico: visão geral", duration: "35 min", type: "video", completed: false },
      { id: "1-8", title: "Avaliação: Interpretação de Projetos", duration: "30 min", type: "quiz", completed: false },
    ],
  },
  {
    id: 2,
    slug: "normas-seguranca",
    title: "NORMAS TÉCNICAS E SEGURANÇA",
    subtitle: "Módulo 02",
    description: "As NBRs e NRs que todo mestre precisa dominar. NR-18 (Canteiro), NR-35 (Trabalho em Altura) e as normas de concreto, alvenaria e instalações.",
    icon: "🛡️",
    image: MODULE_IMAGES.safety,
    lessonsCount: 8,
    estimatedHours: 8,
    status: "coming-soon",
    color: "oklch(0.65 0.19 145)",
    phase: "Fase 1 — Antes da Obra",
    lessons: [
      // Progressão: O que são normas → EPIs (mais básico) → NR-18 (canteiro) → NR-35 (altura) → NBRs de materiais → documentação → avaliação
      { id: "2-1", title: "O que são NRs e NBRs e por que importam", duration: "20 min", type: "text", completed: false },
      { id: "2-2", title: "EPIs e EPCs: o que é obrigatório na obra", duration: "25 min", type: "video", completed: false },
      { id: "2-3", title: "NR-18: Segurança no Canteiro de Obras", duration: "40 min", type: "video", completed: false },
      { id: "2-4", title: "NR-35: Trabalho em Altura", duration: "35 min", type: "video", completed: false },
      { id: "2-5", title: "NR-12: Máquinas e Equipamentos na obra", duration: "25 min", type: "video", completed: false },
      { id: "2-6", title: "NBR 6118 e outras normas de materiais", duration: "30 min", type: "text", completed: false },
      { id: "2-7", title: "PCMAT, PPRA e documentação de segurança", duration: "20 min", type: "text", completed: false },
      { id: "2-8", title: "Avaliação: Normas e Segurança", duration: "25 min", type: "quiz", completed: false },
    ],
  },
  {
    id: 3,
    slug: "canteiro-planejamento",
    title: "CANTEIRO DE OBRAS E PLANEJAMENTO",
    subtitle: "Módulo 03",
    description: "Organização do canteiro, logística de materiais, cronograma físico-financeiro e gestão de equipes. O coração da função do mestre de obras.",
    icon: "🏗️",
    lessonsCount: 8,
    estimatedHours: 8,
    status: "coming-soon",
    color: "oklch(0.7 0.15 80)",
    phase: "Fase 1 — Antes da Obra",
    lessons: [
      // Progressão: Layout do canteiro → áreas obrigatórias → recebimento de material → estoque → cronograma → diário de obra → gestão de equipe → avaliação
      { id: "3-1", title: "Layout do canteiro: como organizar o espaço", duration: "30 min", type: "video", completed: false },
      { id: "3-2", title: "Áreas obrigatórias: vestiário, refeitório, almoxarifado", duration: "20 min", type: "text", completed: false },
      { id: "3-3", title: "Recebimento e conferência de materiais", duration: "25 min", type: "video", completed: false },
      { id: "3-4", title: "Estoque e armazenamento correto", duration: "20 min", type: "text", completed: false },
      { id: "3-5", title: "Cronograma de obra: Diagrama de Gantt na prática", duration: "35 min", type: "practice", completed: false },
      { id: "3-6", title: "Diário de obra e documentação diária", duration: "20 min", type: "text", completed: false },
      { id: "3-7", title: "Gestão de equipes e liderança no canteiro", duration: "30 min", type: "video", completed: false },
      { id: "3-8", title: "Avaliação: Planejamento de Obras", duration: "25 min", type: "quiz", completed: false },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // FASE 2 - ESTRUTURA (Do chão para cima)
  // ═══════════════════════════════════════════════════════
  {
    id: 4,
    slug: "fundacoes",
    title: "FUNDAÇÕES E INFRAESTRUTURA",
    subtitle: "Módulo 04",
    description: "Sondagem de solo, fundações rasas e profundas, contenções e drenagem. Tudo que sustenta uma edificação segura, na ordem que acontece na obra.",
    icon: "⛏️",
    lessonsCount: 8,
    estimatedHours: 9,
    status: "coming-soon",
    color: "oklch(0.55 0.15 30)",
    phase: "Fase 2 — Estrutura",
    lessons: [
      // Progressão: Primeiro entende o solo → depois escolhe a fundação → rasas (mais simples) → profundas (mais complexas) → contenções → impermeabilização → drenagem → avaliação
      { id: "4-1", title: "Sondagem: entendendo o tipo de solo", duration: "30 min", type: "video", completed: false },
      { id: "4-2", title: "Locação da obra e gabarito", duration: "25 min", type: "video", completed: false },
      { id: "4-3", title: "Fundações rasas: sapatas e radier", duration: "35 min", type: "video", completed: false },
      { id: "4-4", title: "Fundações profundas: estacas e tubulões", duration: "40 min", type: "video", completed: false },
      { id: "4-5", title: "Vigas baldrame: ligando as fundações", duration: "30 min", type: "video", completed: false },
      { id: "4-6", title: "Contenções e muros de arrimo", duration: "30 min", type: "text", completed: false },
      { id: "4-7", title: "Impermeabilização e drenagem de fundações", duration: "25 min", type: "video", completed: false },
      { id: "4-8", title: "Avaliação: Fundações", duration: "30 min", type: "quiz", completed: false },
    ],
  },
  {
    id: 5,
    slug: "estruturas-concreto",
    title: "ESTRUTURAS DE CONCRETO ARMADO",
    subtitle: "Módulo 05",
    description: "Fôrmas, armações, concretagem e cura. Segue a ordem exata de execução: primeiro monta a fôrma, depois arma o ferro, depois concreta e por último cura e desforma.",
    icon: "🏛️",
    image: MODULE_IMAGES.structure,
    lessonsCount: 9,
    estimatedHours: 11,
    status: "coming-soon",
    color: "oklch(0.5 0.12 260)",
    phase: "Fase 2 — Estrutura",
    lessons: [
      // Progressão EXATA de execução: Entende o concreto → fôrmas (1º na obra) → armação (2º) → concretagem (3º) → cura/desforma (4º) → aditivos → Slump Test → avaliação
      { id: "5-1", title: "Tecnologia do concreto: Fck, traços e resistência", duration: "35 min", type: "video", completed: false },
      { id: "5-2", title: "Aditivos e concretos especiais", duration: "25 min", type: "text", completed: false },
      { id: "5-3", title: "Fôrmas: tipos, montagem e escoramento", duration: "40 min", type: "video", completed: false },
      { id: "5-4", title: "Armação: leitura de projeto de ferragem", duration: "45 min", type: "video", completed: false },
      { id: "5-5", title: "Armação: dobras, emendas e espaçadores", duration: "35 min", type: "video", completed: false },
      { id: "5-6", title: "Concretagem: procedimentos e vibração", duration: "35 min", type: "video", completed: false },
      { id: "5-7", title: "Slump Test e controle de qualidade", duration: "25 min", type: "video", completed: false },
      { id: "5-8", title: "Cura do concreto e desforma segura", duration: "25 min", type: "text", completed: false },
      { id: "5-9", title: "Avaliação: Estruturas de Concreto", duration: "30 min", type: "quiz", completed: false },
    ],
  },
  {
    id: 6,
    slug: "alvenaria-vedacoes",
    title: "ALVENARIA E VEDAÇÕES",
    subtitle: "Módulo 06",
    description: "Da marcação da primeira fiada ao encunhamento final. Técnicas de alvenaria estrutural e de vedação, vergas, contravergas e sistemas alternativos.",
    icon: "🧱",
    lessonsCount: 7,
    estimatedHours: 7,
    status: "coming-soon",
    color: "oklch(0.6 0.14 40)",
    phase: "Fase 2 — Estrutura",
    lessons: [
      // Progressão de execução: Diferença entre tipos → marcação (1ª fiada) → elevação → vergas/contravergas (durante elevação) → encunhamento (última etapa) → alternativas → avaliação
      { id: "6-1", title: "Alvenaria estrutural vs. vedação: quando usar cada uma", duration: "25 min", type: "video", completed: false },
      { id: "6-2", title: "Marcação da 1ª fiada: nível e alinhamento", duration: "30 min", type: "video", completed: false },
      { id: "6-3", title: "Elevação da alvenaria: técnicas e prumo", duration: "30 min", type: "video", completed: false },
      { id: "6-4", title: "Vergas e contravergas: norma e execução", duration: "25 min", type: "video", completed: false },
      { id: "6-5", title: "Encunhamento e juntas de dilatação", duration: "25 min", type: "text", completed: false },
      { id: "6-6", title: "Drywall e vedações alternativas", duration: "25 min", type: "video", completed: false },
      { id: "6-7", title: "Avaliação: Alvenaria e Vedações", duration: "20 min", type: "quiz", completed: false },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // FASE 3 - SISTEMAS (Dentro das paredes)
  // ═══════════════════════════════════════════════════════
  {
    id: 7,
    slug: "instalacoes",
    title: "INSTALAÇÕES HIDRÁULICAS E ELÉTRICAS",
    subtitle: "Módulo 07",
    description: "Tubulações de água, esgoto, elétrica e combate a incêndio. Na ordem que se instala: primeiro água fria, depois esgoto, depois elétrica.",
    icon: "🔧",
    lessonsCount: 9,
    estimatedHours: 10,
    status: "coming-soon",
    color: "oklch(0.55 0.2 220)",
    phase: "Fase 3 — Sistemas",
    lessons: [
      // Progressão de instalação: Água fria (1º) → água quente (2º) → esgoto (3º) → ventilação (complemento do esgoto) → elétrica conceitos → quadros → incêndio → avaliação
      { id: "7-1", title: "Água fria: tubulações, conexões e dimensionamento", duration: "35 min", type: "video", completed: false },
      { id: "7-2", title: "Leitura de projetos isométricos hidráulicos", duration: "30 min", type: "video", completed: false },
      { id: "7-3", title: "Água quente e gás: materiais e cuidados", duration: "25 min", type: "text", completed: false },
      { id: "7-4", title: "Esgoto: tubulações, caixas e declividade", duration: "30 min", type: "video", completed: false },
      { id: "7-5", title: "Ventilação sanitária: evitando mau cheiro", duration: "20 min", type: "video", completed: false },
      { id: "7-6", title: "Instalação elétrica: conceitos e fiação", duration: "35 min", type: "video", completed: false },
      { id: "7-7", title: "Quadros, disjuntores e aterramento", duration: "30 min", type: "video", completed: false },
      { id: "7-8", title: "Combate a incêndio em edifícios", duration: "25 min", type: "text", completed: false },
      { id: "7-9", title: "Avaliação: Instalações", duration: "30 min", type: "quiz", completed: false },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // FASE 4 - FECHAMENTO (De cima para baixo)
  // ═══════════════════════════════════════════════════════
  {
    id: 8,
    slug: "coberturas-impermeabilizacao",
    title: "COBERTURAS E IMPERMEABILIZAÇÃO",
    subtitle: "Módulo 08",
    description: "Estrutura de telhado, telhas, calhas e impermeabilização de lajes. Primeiro fecha o telhado para proteger a obra, depois impermeabiliza.",
    icon: "🏠",
    lessonsCount: 7,
    estimatedHours: 7,
    status: "coming-soon",
    color: "oklch(0.6 0.12 180)",
    phase: "Fase 4 — Fechamento",
    lessons: [
      // Progressão: Estrutura do telhado (1º) → telhas (2º) → calhas/rufos (3º, complemento do telhado) → impermeab. laje (4º) → impermeab. áreas molhadas (5º, depende de saber impermeab.) → avaliação
      { id: "8-1", title: "Estrutura de telhado: madeira e metálica", duration: "35 min", type: "video", completed: false },
      { id: "8-2", title: "Tipos de telhas e cálculo de inclinação", duration: "25 min", type: "video", completed: false },
      { id: "8-3", title: "Calhas, rufos e pingadeiras", duration: "25 min", type: "video", completed: false },
      { id: "8-4", title: "Impermeabilização de laje: manta asfáltica", duration: "30 min", type: "video", completed: false },
      { id: "8-5", title: "Impermeabilização de laje: argamassa polimérica", duration: "25 min", type: "video", completed: false },
      { id: "8-6", title: "Impermeabilização de áreas molhadas (banheiros)", duration: "25 min", type: "text", completed: false },
      { id: "8-7", title: "Avaliação: Coberturas e Impermeabilização", duration: "20 min", type: "quiz", completed: false },
    ],
  },
  {
    id: 9,
    slug: "revestimentos-acabamentos",
    title: "REVESTIMENTOS E ACABAMENTOS",
    subtitle: "Módulo 09",
    description: "Da regularização do piso até a pintura final. Cada etapa depende da anterior: contrapiso → impermeabilização → cerâmica → rejunte → pintura.",
    icon: "🎨",
    image: MODULE_IMAGES.finishing,
    lessonsCount: 9,
    estimatedHours: 9,
    status: "coming-soon",
    color: "oklch(0.6 0.16 330)",
    phase: "Fase 4 — Fechamento",
    lessons: [
      // Progressão EXATA de acabamento:
      // Parede: chapisco (1º) → emboço/reboco (2º)
      // Piso: contrapiso/regularização (3º) → impermeabilização do piso (4º)
      // Revestimento: cerâmica/porcelanato (5º, só depois do piso pronto) → grandes formatos (6º, avançado)
      // Finalização: gesso/forro (7º) → pintura (8º, última etapa) → avaliação
      { id: "9-1", title: "Chapisco: tipos e aplicação correta", duration: "20 min", type: "video", completed: false },
      { id: "9-2", title: "Emboço e reboco: traços e técnicas", duration: "30 min", type: "video", completed: false },
      { id: "9-3", title: "Contrapiso e regularização de piso", duration: "30 min", type: "video", completed: false },
      { id: "9-4", title: "Cerâmicas e porcelanatos: assentamento (NBR 13753)", duration: "35 min", type: "video", completed: false },
      { id: "9-5", title: "Grandes formatos e dupla camada", duration: "30 min", type: "video", completed: false },
      { id: "9-6", title: "Rejunte: tipos e aplicação profissional", duration: "20 min", type: "video", completed: false },
      { id: "9-7", title: "Gesso e forro: técnicas modernas", duration: "25 min", type: "video", completed: false },
      { id: "9-8", title: "Pintura: preparação da superfície e aplicação", duration: "25 min", type: "video", completed: false },
      { id: "9-9", title: "Avaliação: Revestimentos e Acabamentos", duration: "25 min", type: "quiz", completed: false },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // FASE 5 - GESTÃO (Visão completa do Mestre)
  // ═══════════════════════════════════════════════════════
  {
    id: 10,
    slug: "gestao-orcamento",
    title: "GESTÃO DE OBRAS E ORÇAMENTO",
    subtitle: "Módulo 10",
    description: "Orçamento completo, quantitativos, composição de custos, liderança de equipes e preparação final para a certificação oficial de Mestre de Obras.",
    icon: "📊",
    lessonsCount: 9,
    estimatedHours: 9,
    status: "coming-soon",
    color: "oklch(0.65 0.15 100)",
    phase: "Fase 5 — Gestão",
    lessons: [
      // Progressão: Quantitativos (base) → custos unitários → orçamento completo → BDI → liderança → fiscalização → simulado final → próximos passos
      { id: "10-1", title: "Levantamento de quantitativos na prática", duration: "35 min", type: "practice", completed: false },
      { id: "10-2", title: "Composição de custos unitários (SINAPI/TCPO)", duration: "30 min", type: "video", completed: false },
      { id: "10-3", title: "Montando o orçamento completo na planilha", duration: "40 min", type: "practice", completed: false },
      { id: "10-4", title: "BDI e encargos sociais", duration: "25 min", type: "text", completed: false },
      { id: "10-5", title: "Ferramentas digitais: Google Planilhas para obras", duration: "30 min", type: "practice", completed: false },
      { id: "10-6", title: "Liderança e comunicação com engenheiros", duration: "30 min", type: "video", completed: false },
      { id: "10-7", title: "Fiscalização e entrega de obra", duration: "25 min", type: "text", completed: false },
      { id: "10-8", title: "Simulado Final: Prova de Certificação", duration: "60 min", type: "quiz", completed: false },
      { id: "10-9", title: "Próximos passos: sua carreira de Mestre", duration: "15 min", type: "text", completed: false },
    ],
  },
];

export function getTotalProgress(mods: Module[]): number {
  const totalLessons = mods.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = mods.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0
  );
  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
}

export function getModuleProgress(mod: Module): number {
  const completed = mod.lessons.filter((l) => l.completed).length;
  return mod.lessons.length > 0 ? Math.round((completed / mod.lessons.length) * 100) : 0;
}

export function getTotalHours(): number {
  return modules.reduce((acc, m) => acc + m.estimatedHours, 0);
}

export function getTotalLessons(): number {
  return modules.reduce((acc, m) => acc + m.lessons.length, 0);
}
