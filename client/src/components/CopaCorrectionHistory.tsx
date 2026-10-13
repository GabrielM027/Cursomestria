import type { CopaCorrectionState } from "@/lib/copaCorrection";

type Snapshot = CopaCorrectionState["data"];
type AuditLog = {
  id: number;
  action: string;
  reason: string;
  performedBy: string;
  createdAt: string;
  beforeData: { matchId: number; fixtureId: number; state: Snapshot };
  afterData: {
    matchId: number;
    fixtureId: number;
    state: Snapshot;
    administrator?: { name: string };
  };
};

export function CopaCorrectionHistory({
  logs,
  players,
  entrants,
}: {
  logs: AuditLog[];
  players: { id: number; name: string }[];
  entrants: { id: number; playerNameSnapshot: string }[];
}) {
  const corrections = logs
    .filter(log => log.action === "match_corrected")
    .sort((a, b) => b.id - a.id);
  const playerName = (id: number | null, guestName?: string | null) =>
    players.find(player => player.id === id)?.name ?? guestName ?? "Jogador";
  const entrantName = (id: number | null) =>
    entrants.find(entrant => entrant.id === id)?.playerNameSnapshot ??
    "Sem classificado (aguarda agregado)";
  const detail = (snapshot: Snapshot, matchId: number, fixtureId: number) => {
    const match = snapshot.matches.find(item => item.id === matchId);
    const fixture = snapshot.fixtures.find(item => item.id === fixtureId);
    return (
      <div>
        <p>
          Placar: Preto {match?.blackScore} × {match?.redScore} Vermelho
        </p>
        <p>
          Capitão do Preto:{" "}
          {snapshot.entrants?.find(item => item.id === fixture?.homeEntrantId)
            ?.playerNameSnapshot ?? entrantName(fixture?.homeEntrantId ?? null)}
        </p>
        <p>
          Capitão do Vermelho:{" "}
          {snapshot.entrants?.find(item => item.id === fixture?.awayEntrantId)
            ?.playerNameSnapshot ?? entrantName(fixture?.awayEntrantId ?? null)}
        </p>
        <p>Classificado: {entrantName(fixture?.winnerEntrantId ?? null)}</p>
        {fixture?.homePenaltyScore !== null &&
          fixture?.homePenaltyScore !== undefined && (
            <p>
              Pênaltis: {fixture.homePenaltyScore} × {fixture.awayPenaltyScore}
            </p>
          )}
        {(["best", "worst"] as const).map(kind => {
          const highlight = snapshot.highlights.find(
            item => item.kind === kind
          );
          return (
            <p key={kind}>
              {kind === "best" ? "Melhor" : "Pior"}:{" "}
              {highlight ? playerName(highlight.playerId) : "Sem destaque"}
            </p>
          );
        })}
        <p>Observação: {match?.notes || "Sem observação"}</p>
        <ul>
          {snapshot.participants.map((participant, index) => {
            const goals = snapshot.goals
              .filter(goal =>
                participant.playerId !== null
                  ? goal.playerId === participant.playerId
                  : goal.playerId === null &&
                    goal.guestName === participant.guestName &&
                    goal.teamColor === participant.teamColor
              )
              .reduce((total, goal) => total + goal.quantity, 0);
            return (
              <li key={participant.id ?? index}>
                {playerName(participant.playerId, participant.guestName)} ·{" "}
                {participant.teamColor === "black" ? "Preto" : "Vermelho"} ·{" "}
                {goals} gols · votos Melhor {participant.bestVotes} / Pior{" "}
                {participant.worstVotes}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };
  return (
    <section className="admin-card">
      <h2>Histórico de correções</h2>
      {!corrections.length && (
        <p className="admin-muted">Nenhuma correção registrada.</p>
      )}
      {corrections.map(log => (
        <details key={log.id} className="copa-correction-audit">
          <summary>
            {new Date(log.createdAt).toLocaleString("pt-BR")} · Partida{" "}
            {log.afterData.matchId} · {log.reason}
          </summary>
          <p>
            Administrador:{" "}
            {log.afterData.administrator?.name || log.performedBy}
          </p>
          <div className="admin-form__grid">
            <div>
              <h3>Antes</h3>
              {detail(
                log.beforeData.state,
                log.beforeData.matchId,
                log.beforeData.fixtureId
              )}
            </div>
            <div>
              <h3>Depois</h3>
              {detail(
                log.afterData.state,
                log.afterData.matchId,
                log.afterData.fixtureId
              )}
            </div>
          </div>
        </details>
      ))}
    </section>
  );
}
