import { CalendarDays, ShieldQuestion, Trophy } from "lucide-react";
import { useId, useState } from "react";
import CopaBracket from "./CopaBracket";

type Entrant = {
  playerNameSnapshot?: string;
  entityNameSnapshot?: string | null;
  entityBadgeUrlSnapshot?: string | null;
  player?: {
    name?: string;
    entityName?: string | null;
    entityBadgeUrl?: string | null;
  };
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
};

type Copa = { status: string; fixtures?: Fixture[] };
const EMPTY_FIXTURES: Fixture[] = [];
const STAGE_LABELS: Record<string, string> = {
  quarterfinal: "Quartas de final",
  semifinal: "Semifinais",
  final: "Final",
  third_place: "3º lugar",
};

function fixtureDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day, 12));
}

function TeamBadge({
  url,
  name,
}: {
  url?: string | null;
  name?: string | null;
}) {
  const [unavailable, setUnavailable] = useState(false);
  return (
    <span className="copa-next-match__badge">
      {url && !unavailable ? (
        <img
          src={url}
          alt={
            name
              ? `Bandeira ou escudo de ${name}`
              : "Bandeira ou escudo do time"
          }
          width={160}
          height={160}
          decoding="async"
          fetchPriority="high"
          onError={() => setUnavailable(true)}
        />
      ) : (
        <>
          <ShieldQuestion aria-hidden="true" />
          <span className="sr-only">Bandeira ou escudo indisponível</span>
        </>
      )}
    </span>
  );
}

function Captain({ entrant }: { entrant: Entrant }) {
  const name =
    entrant.player?.name || entrant.playerNameSnapshot || "A definir";
  const team = entrant.player?.entityName || entrant.entityNameSnapshot;
  const badge =
    entrant.player?.entityBadgeUrl || entrant.entityBadgeUrlSnapshot;
  return (
    <div className="copa-next-match__team">
      <TeamBadge key={badge || "missing"} url={badge} name={team} />
      <h2>{name}</h2>
      {team && <p>{team}</p>}
    </div>
  );
}

export default function CopaHome({
  copa,
  formatDate,
}: {
  copa: Copa;
  formatDate: (value: Date | string) => string;
}) {
  const titleId = useId();
  const fixtures = copa.fixtures || EMPTY_FIXTURES;
  // Keep the existing choice of the next fixture; this component only presents it.
  const nextFixture = fixtures
    .filter(
      fixture => fixture.status !== "completed" && fixture.home && fixture.away
    )
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];
  const finalGames = fixtures.filter(
    fixture => fixture.stage === "final"
  ).length;

  return (
    <section
      className="copa-home"
      aria-label="Próximo confronto e chaveamento da Copa"
    >
      <div className="club-container">
        {nextFixture?.home && nextFixture.away ? (
          <article className="copa-next-match" aria-labelledby={titleId}>
            <header className="copa-next-match__heading">
              <p className="copa-next-match__round">
                {STAGE_LABELS[nextFixture.stage] || nextFixture.stage} · Jogo{" "}
                {nextFixture.slotNumber}
                {nextFixture.stage === "final" && finalGames > 1
                  ? ` de ${finalGames}`
                  : ""}
              </p>
              <h1 id={titleId}>Próximo confronto</h1>
              <p className="copa-next-match__date">
                <CalendarDays size={16} aria-hidden="true" />
                <time dateTime={nextFixture.scheduledDate}>
                  {fixtureDate(nextFixture.scheduledDate)}
                </time>
              </p>
            </header>
            <div className="copa-next-match__teams">
              <Captain entrant={nextFixture.home} />
              <span className="copa-next-match__versus" aria-hidden="true">
                ×
              </span>
              <Captain entrant={nextFixture.away} />
            </div>
            {copa.status === "paused" && (
              <p className="copa-next-match__pause" role="status">
                Copa pausada pela organização.
              </p>
            )}
          </article>
        ) : (
          <article
            className="copa-next-match copa-next-match--waiting"
            aria-labelledby={titleId}
          >
            <Trophy size={27} aria-hidden="true" />
            <h1 id={titleId}>
              {copa.status === "paused"
                ? "Copa pausada"
                : "Aguardando o próximo confronto"}
            </h1>
            <p>
              A organização atualiza a chave assim que cada jogo for confirmado.
            </p>
          </article>
        )}
        <CopaBracket copa={copa} formatDate={formatDate} />
      </div>
    </section>
  );
}
