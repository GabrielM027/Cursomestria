import { ArrowLeftRight, Check, ShieldQuestion, Trophy } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type Entrant = {
  playerNameSnapshot?: string;
  entityNameSnapshot?: string | null;
  entityBadgeUrlSnapshot?: string | null;
  player?: { name?: string; entityName?: string | null; entityBadgeUrl?: string | null };
};

type Fixture = {
  id: number;
  stage: string;
  slotNumber: number;
  scheduledDate: string;
  status: string;
  homeEntrantId: number | null;
  awayEntrantId: number | null;
  winnerEntrantId: number | null;
  home?: Entrant | null;
  away?: Entrant | null;
  match?: { blackScore: number; redScore: number } | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
};

type DateFormatter = (value: Date | string) => string;

function Crest({ url, name }: { url?: string | null; name?: string | null }) {
  const [unavailable, setUnavailable] = useState(false);
  return <span className="copa-tree__crest">
    {url && !unavailable
      ? <img src={url} alt={name ? `Escudo de ${name}` : "Escudo do time ou seleção"} width={44} height={44} loading="lazy" decoding="async" onError={() => setUnavailable(true)} />
      : <><ShieldQuestion aria-hidden="true" /><span className="sr-only">Escudo a definir ou indisponível</span></>}
  </span>;
}

function Participant({ entrant, score, winner }: { entrant?: Entrant | null; score?: number; winner: boolean }) {
  const name = entrant?.player?.name || entrant?.playerNameSnapshot || "A definir";
  const badge = entrant?.player?.entityBadgeUrl || entrant?.entityBadgeUrlSnapshot;
  const team = entrant?.player?.entityName || entrant?.entityNameSnapshot;
  return <div className={`copa-tree__participant${winner ? " copa-tree__participant--winner" : ""}${entrant ? "" : " copa-tree__participant--pending"}`}>
    <Crest key={badge || "missing"} url={badge} name={team} />
    <div className="copa-tree__person"><strong>{name}</strong>{team && <span>{team}</span>}{winner && <span className="copa-tree__winner"><Check size={12} aria-hidden="true" /> Vencedor</span>}</div>
    <b className="copa-tree__score" aria-label={score == null ? "Sem placar" : `${score} gols`}>{score ?? "—"}</b>
  </div>;
}

function Match({ fixture, formatDate }: { fixture: Fixture; formatDate: DateFormatter }) {
  const completed = fixture.status === "completed";
  const hasPenalties = completed && fixture.homePenaltyScore != null && fixture.awayPenaltyScore != null;
  const label = fixture.stage === "semifinal" ? `Semifinal ${fixture.slotNumber}` : `Jogo ${fixture.slotNumber}`;
  return <article className={`copa-tree__match copa-tree__match--${fixture.status}`} data-bracket-node={`fixture-${fixture.id}`} aria-label={`${fixture.stage === "quarterfinal" ? "Quartas de final · " : fixture.stage === "final" ? "Final · " : ""}${label}`}>
    <header className="copa-tree__match-meta"><span>{label}</span><time dateTime={fixture.scheduledDate}>{formatDate(fixture.scheduledDate)}</time></header>
    <div className="copa-tree__participants">
      <Participant entrant={fixture.home} score={completed && fixture.match ? fixture.match.blackScore : undefined} winner={fixture.winnerEntrantId != null && fixture.winnerEntrantId === fixture.homeEntrantId} />
      <Participant entrant={fixture.away} score={completed && fixture.match ? fixture.match.redScore : undefined} winner={fixture.winnerEntrantId != null && fixture.winnerEntrantId === fixture.awayEntrantId} />
    </div>
    {hasPenalties && <p className="copa-tree__penalties">Pênaltis: {fixture.homePenaltyScore} × {fixture.awayPenaltyScore}</p>}
    {fixture.status === "postponed" && <p className="copa-tree__penalties">Adiado</p>}
  </article>;
}

const EMPTY_FIXTURES: Fixture[] = [];
// Presentation follows resolveCopaFixture: Q1/Q4 → S1 and Q2/Q3 → S2.
// It never assigns entrants, advances winners, or modifies the fixture array.
const QUARTER_ORDER = [1, 4, 2, 3];
const SEMIFINAL_FOR_QUARTER: Record<number, number> = { 1: 1, 4: 1, 2: 2, 3: 2 };

export default function CopaBracket({ copa, formatDate }: { copa: { status: string; fixtures?: Fixture[] }; formatDate: DateFormatter }) {
  const fixtures = copa.fixtures || EMPTY_FIXTURES;
  const titleId = useId();
  const hintId = useId();
  const treeRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [scrollable, setScrollable] = useState(false);
  const rounds = [
    { stage: "quarterfinal", title: "Quartas de final", fixtures: fixtures.filter(fixture => fixture.stage === "quarterfinal").sort((a, b) => QUARTER_ORDER.indexOf(a.slotNumber) - QUARTER_ORDER.indexOf(b.slotNumber)) },
    { stage: "semifinal", title: "Semifinais", fixtures: fixtures.filter(fixture => fixture.stage === "semifinal").sort((a, b) => a.slotNumber - b.slotNumber) },
    { stage: "final", title: "Final", fixtures: fixtures.filter(fixture => fixture.stage === "final").sort((a, b) => a.slotNumber - b.slotNumber) },
  ];

  useEffect(() => {
    const tree = treeRef.current;
    const viewport = viewportRef.current;
    if (!tree || !viewport) return;
    const drawConnections = () => {
      const bounds = tree.getBoundingClientRect();
      const lines: string[] = [];
      const connect = (source: string, target: string) => {
        const from = tree.querySelector<HTMLElement>(`[data-bracket-node="${source}"]`)?.getBoundingClientRect();
        const to = tree.querySelector<HTMLElement>(`[data-bracket-node="${target}"]`)?.getBoundingClientRect();
        if (!from || !to) return;
        const x1 = from.right - bounds.left;
        const y1 = from.top + from.height / 2 - bounds.top;
        const x2 = to.left - bounds.left;
        const y2 = to.top + to.height / 2 - bounds.top;
        lines.push(`M ${x1} ${y1} H ${(x1 + x2) / 2} V ${y2} H ${x2}`);
      };
      fixtures.filter(fixture => fixture.stage === "quarterfinal").forEach(fixture => {
        const semifinal = fixtures.find(next => next.stage === "semifinal" && next.slotNumber === SEMIFINAL_FOR_QUARTER[fixture.slotNumber]);
        if (semifinal) connect(`fixture-${fixture.id}`, `fixture-${semifinal.id}`);
      });
      fixtures.filter(fixture => fixture.stage === "semifinal").forEach(fixture => connect(`fixture-${fixture.id}`, "final-series"));
      setPaths(current => current.length === lines.length && current.every((line, index) => line === lines[index]) ? current : lines);
      setScrollable(viewport.scrollWidth > viewport.clientWidth + 1);
    };
    drawConnections();
    const observer = new ResizeObserver(drawConnections);
    observer.observe(tree);
    observer.observe(viewport);
    tree.querySelectorAll<HTMLElement>("[data-bracket-node]").forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [fixtures]);

  return <section className="copa-bracket" aria-labelledby={titleId}>
    <div className="copa-bracket__heading"><div><span className="section-label">Caminho da taça</span><h2 id={titleId}>Chaveamento da <em>Copa</em></h2></div><span>{copa.status === "paused" ? "Pausada" : "Ao vivo"}</span></div>
    {scrollable && <p className="copa-tree__scroll-hint" id={hintId}><ArrowLeftRight size={16} aria-hidden="true" /> Deslize para acompanhar até a final</p>}
    <div className="copa-tree__viewport" ref={viewportRef} tabIndex={scrollable ? 0 : undefined} role="region" aria-label="Árvore de confrontos da Copa" aria-describedby={scrollable ? hintId : undefined}>
      <div className="copa-tree" ref={treeRef}>
        <svg className="copa-tree__connections" aria-hidden="true" focusable="false">{paths.map((path, index) => <path key={index} d={path} />)}</svg>
        {rounds.map(round => <section className={`copa-tree__round copa-tree__round--${round.stage}`} key={round.stage}>
          <header className="copa-tree__round-heading"><h3>{round.stage === "final" && <Trophy size={20} aria-hidden="true" />}{round.title}</h3><span>{round.fixtures.length} {round.stage === "final" ? (round.fixtures.length === 1 ? "jogo" : "jogos") : "confrontos"}</span></header>
          <div className="copa-tree__round-matches">
            {round.stage === "final" && round.fixtures.length > 0
              ? <div className="copa-tree__final-series" data-bracket-node="final-series">{round.fixtures.map(fixture => <Match key={fixture.id} fixture={fixture} formatDate={formatDate} />)}</div>
              : round.fixtures.map(fixture => <Match key={fixture.id} fixture={fixture} formatDate={formatDate} />)}
            {round.fixtures.length === 0 && <p className="copa-tree__empty">Confrontos a definir</p>}
          </div>
        </section>)}
      </div>
    </div>
  </section>;
}
