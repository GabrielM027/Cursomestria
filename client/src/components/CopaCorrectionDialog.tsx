import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  buildCopaChanges,
  previewCopaResult,
  type CopaCorrectionState,
  type CopaParticipant,
  type CopaGoal,
  type CopaHighlight,
} from "@/lib/copaCorrection";

type Player = {
  id: number;
  name: string;
  isActive: boolean;
  participantType: string;
};

function CorrectionForm({
  state,
  fixtureId,
  matchId,
  players,
  onClose,
  onBusyChange,
}: {
  state: CopaCorrectionState;
  fixtureId: number;
  matchId: number;
  players: Player[];
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const fixture = state.data.fixtures.find(item => item.id === fixtureId)!;
  const match = state.data.matches.find(item => item.id === matchId)!;
  const [blackScore, setBlackScore] = useState(String(match.blackScore));
  const [redScore, setRedScore] = useState(String(match.redScore));
  const [matchDate, setMatchDate] = useState(match.matchDate);
  const [notes, setNotes] = useState(match.notes ?? "");
  const [homePenalty, setHomePenalty] = useState(
    String(fixture.homePenaltyScore ?? "")
  );
  const [awayPenalty, setAwayPenalty] = useState(
    String(fixture.awayPenaltyScore ?? "")
  );
  const [participants, setParticipants] = useState<CopaParticipant[]>(() =>
    state.data.participants.map(row => ({ ...row }))
  );
  const [goals, setGoals] = useState<CopaGoal[]>(() =>
    state.data.goals.map(row => ({ ...row }))
  );
  const [highlights, setHighlights] = useState<CopaHighlight[]>(() =>
    state.data.highlights.map(row => ({ ...row }))
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const mutation = trpc.admin.copa.correctMatch.useMutation();
  const utils = trpc.useUtils();
  const result = previewCopaResult(
    state,
    fixtureId,
    matchId,
    Number(blackScore),
    Number(redScore)
  );
  const eligiblePlayers = players.filter(
    player =>
      player.isActive || participants.some(row => row.playerId === player.id)
  );
  const updateParticipant = (index: number, change: Partial<CopaParticipant>) =>
    setParticipants(rows =>
      rows.map((row, i) => (i === index ? { ...row, ...change } : row))
    );
  const name = (row: CopaParticipant | CopaGoal) =>
    players.find(player => player.id === row.playerId)?.name ??
    row.guestName ??
    "Convidado";
  const participantGoal = (row: CopaParticipant) =>
    goals.find(goal =>
      row.playerId !== null
        ? goal.playerId === row.playerId
        : goal.playerId === null &&
          goal.guestName === row.guestName &&
          goal.teamColor === row.teamColor
    );
  const updateGoals = (row: CopaParticipant, quantity: number) => {
    const existing = participantGoal(row);
    const goal = {
      ...existing,
      playerId: row.playerId,
      guestName: row.playerId === null ? row.guestName : null,
      teamColor: row.teamColor,
      quantity,
    };
    setGoals(rows =>
      existing
        ? rows.map(item => (item === existing ? goal : item))
        : [...rows, goal]
    );
  };
  const setHighlight = (kind: "best" | "worst", playerId: string) =>
    setHighlights(rows => {
      const current = rows.find(row => row.kind === kind);
      const others = rows.filter(row => row.kind !== kind);
      return playerId
        ? [...others, { ...current, kind, playerId: Number(playerId) }].sort(
            (a, b) => (a.id ?? Infinity) - (b.id ?? Infinity)
          )
        : others;
    });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const changes = buildCopaChanges(state, fixtureId, matchId, {
        blackScore: Number(blackScore),
        redScore: Number(redScore),
        matchDate,
        notes: notes || null,
        homePenaltyScore:
          result.needsPenalties && homePenalty !== ""
            ? Number(homePenalty)
            : null,
        awayPenaltyScore:
          result.needsPenalties && awayPenalty !== ""
            ? Number(awayPenalty)
            : null,
        participants,
        goals,
        highlights,
      });
      if (!Object.keys(changes).length)
        throw new Error("Nenhuma alteração foi informada.");
      onBusyChange(true);
      await mutation.mutateAsync({
        fixtureId,
        matchId,
        expectedRevision: state.revision,
        changes,
        reason,
      });
      await Promise.all([
        utils.admin.data.invalidate(),
        utils.club.publicData.invalidate(),
      ]);
      toast.success(
        "Partida corrigida. Chaveamento e estatísticas atualizados; histórico registrado."
      );
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível corrigir a partida."
      );
    } finally {
      onBusyChange(false);
    }
  };
  return (
    <form className="admin-form" onSubmit={submit}>
      <fieldset
        disabled={mutation.isPending}
        className="copa-correction-fields"
      >
        <p className="admin-muted">
          Preto e vermelho mantêm os capitães deste confronto. Informe somente
          os dados confirmados. Pontos corridos permanecem congelados para esta
          partida.
        </p>
        <div className="admin-form__grid">
          <label className="admin-field">
            <span>Gols do Preto</span>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={blackScore}
              onChange={event => setBlackScore(event.target.value)}
            />
          </label>
          <label className="admin-field">
            <span>Gols do Vermelho</span>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={redScore}
              onChange={event => setRedScore(event.target.value)}
            />
          </label>
        </div>
        <label className="admin-field">
          <span>Data da partida</span>
          <input
            required
            type="date"
            value={matchDate}
            onChange={event => setMatchDate(event.target.value)}
          />
        </label>
        <label className="admin-field">
          <span>Observação da partida</span>
          <textarea
            value={notes}
            onChange={event => setNotes(event.target.value)}
          />
        </label>
        {result.firstLeg && (
          <p className="admin-muted">
            Jogo 1: o campeão será definido pelo agregado após o Jogo 2. Se o
            Jogo 2 estiver concluído, o placar do Jogo 1 não poderá ser
            alterado.
          </p>
        )}
        {result.secondLeg && (
          <p className="admin-muted">
            Agregado: Preto {result.aggregateBlack} × {result.aggregateRed}{" "}
            Vermelho.
          </p>
        )}
        {result.needsPenalties && (
          <div className="admin-form__grid">
            <label className="admin-field">
              <span>Pênaltis do Preto</span>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={homePenalty}
                onChange={event => setHomePenalty(event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Pênaltis do Vermelho</span>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={awayPenalty}
                onChange={event => setAwayPenalty(event.target.value)}
              />
            </label>
          </div>
        )}
        <h3>Participantes e votos</h3>
        <p className="admin-muted">
          Ao trocar um participante ou seu time, ajuste também seus gols e os
          destaques. Dados incompatíveis impedem a gravação.
        </p>
        {participants.map((row, index) => (
          <div className="copa-correction-row" key={row.id ?? `new-${index}`}>
            <label className="admin-field">
              <span>Jogador {index + 1}</span>
              {row.playerId === null ? (
                <input
                  required
                  value={row.guestName ?? ""}
                  onChange={event =>
                    updateParticipant(index, { guestName: event.target.value })
                  }
                />
              ) : (
                <select
                  value={row.playerId}
                  onChange={event => {
                    const player = players.find(
                      item => item.id === Number(event.target.value)
                    );
                    updateParticipant(index, {
                      playerId: Number(event.target.value),
                      isGuest: player?.participantType === "guest",
                    });
                  }}
                >
                  {eligiblePlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label className="admin-field">
              <span>Time</span>
              <select
                value={row.teamColor}
                onChange={event =>
                  updateParticipant(index, {
                    teamColor: event.target.value as "black" | "red",
                  })
                }
              >
                <option value="black">Preto</option>
                <option value="red">Vermelho</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Votos Melhor</span>
              <input
                type="number"
                min="0"
                step="1"
                value={row.bestVotes}
                disabled={row.isGuest}
                onChange={event =>
                  updateParticipant(index, {
                    bestVotes: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="admin-field">
              <span>Votos Pior</span>
              <input
                type="number"
                min="0"
                step="1"
                value={row.worstVotes}
                disabled={row.isGuest}
                onChange={event =>
                  updateParticipant(index, {
                    worstVotes: Number(event.target.value),
                  })
                }
              />
            </label>
            <button
              type="button"
              className="admin-danger"
              onClick={() =>
                setParticipants(rows => rows.filter((_, i) => i !== index))
              }
              aria-label={`Remover ${name(row)}`}
            >
              Remover
            </button>
          </div>
        ))}
        <div className="copa-correction-actions">
          <button
            type="button"
            className="admin-secondary"
            onClick={() => {
              const player = eligiblePlayers.find(
                item => !participants.some(row => row.playerId === item.id)
              );
              if (player)
                setParticipants(rows => [
                  ...rows,
                  {
                    playerId: player.id,
                    teamColor: "black",
                    isGuest: player.participantType === "guest",
                    guestName: null,
                    invitedByName: null,
                    bestVotes: 0,
                    worstVotes: 0,
                  },
                ]);
            }}
          >
            Adicionar jogador
          </button>
          <button
            type="button"
            className="admin-secondary"
            onClick={() =>
              setParticipants(rows => [
                ...rows,
                {
                  playerId: null,
                  teamColor: "black",
                  isGuest: true,
                  guestName: "",
                  invitedByName: null,
                  bestVotes: 0,
                  worstVotes: 0,
                },
              ])
            }
          >
            Adicionar convidado
          </button>
        </div>
        <h3>Gols individuais</h3>
        {goals.map((row, index) => (
          <div className="copa-correction-row" key={row.id ?? `goal-${index}`}>
            <label className="admin-field">
              <span>Autor do gol</span>
              <select
                value={participants.findIndex(
                  p =>
                    p.teamColor === row.teamColor &&
                    (p.playerId !== null
                      ? p.playerId === row.playerId
                      : p.playerId === null && p.guestName === row.guestName)
                )}
                onChange={event => {
                  const participant = participants[Number(event.target.value)];
                  if (participant)
                    setGoals(rows =>
                      rows.map((goal, i) =>
                        i === index
                          ? {
                              ...goal,
                              playerId: participant.playerId,
                              guestName:
                                participant.playerId === null
                                  ? participant.guestName
                                  : null,
                              teamColor: participant.teamColor,
                            }
                          : goal
                      )
                    );
                }}
              >
                <option value="-1">
                  {name(row)} (revise participante/time)
                </option>
                {participants.map((p, i) => (
                  <option key={p.id ?? `p-${i}`} value={i}>
                    {name(p)} · {p.teamColor === "black" ? "Preto" : "Vermelho"}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Quantidade</span>
              <input
                type="number"
                min="0"
                step="1"
                value={row.quantity}
                onChange={event =>
                  setGoals(rows =>
                    rows.map((goal, i) =>
                      i === index
                        ? { ...goal, quantity: Number(event.target.value) }
                        : goal
                    )
                  )
                }
              />
            </label>
            <button
              type="button"
              className="admin-danger"
              onClick={() =>
                setGoals(rows => rows.filter((_, i) => i !== index))
              }
            >
              Remover gol
            </button>
          </div>
        ))}
        <label className="admin-field">
          <span>Adicionar gols para</span>
          <select
            value=""
            onChange={event => {
              const p = participants[Number(event.target.value)];
              if (p) updateGoals(p, (participantGoal(p)?.quantity ?? 0) + 1);
            }}
          >
            <option value="">Selecione um participante...</option>
            {participants.map((p, i) => (
              <option key={p.id ?? `add-${i}`} value={i}>
                {name(p)}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-form__grid">
          {(["best", "worst"] as const).map(kind => {
            const current = highlights.find(row => row.kind === kind);
            const eligible = participants.filter(
              p => p.playerId !== null && !p.isGuest
            );
            return (
              <label className="admin-field" key={kind}>
                <span>
                  {kind === "best" ? "Melhor jogador" : "Pior jogador"}
                </span>
                <select
                  value={current?.playerId ?? ""}
                  onChange={event => setHighlight(kind, event.target.value)}
                >
                  <option value="">Sem destaque</option>
                  {current &&
                    !eligible.some(p => p.playerId === current.playerId) && (
                      <option value={current.playerId}>
                        Jogador fora da escalação: revise
                      </option>
                    )}
                  {eligible.map(p => (
                    <option key={p.playerId} value={p.playerId!}>
                      {name(p)}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
        <label className="admin-field">
          <span>Motivo da correção</span>
          <textarea
            required
            minLength={5}
            maxLength={1000}
            value={reason}
            onChange={event => setReason(event.target.value)}
            placeholder="Explique quais dados estavam incorretos e a informação confirmada."
          />
        </label>
        {error && (
          <p role="alert" className="copa-correction-error">
            {error}
          </p>
        )}
        <div className="copa-correction-actions">
          <button className="admin-save" type="submit">
            {mutation.isPending
              ? "Salvando..."
              : "Salvar correção e atualizar chave"}
          </button>
          <button type="button" className="admin-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </fieldset>
    </form>
  );
}

export function CopaCorrectionDialog({
  fixtureId,
  matchId,
  players,
  onClose,
}: {
  fixtureId: number;
  matchId: number;
  players: Player[];
  onClose: () => void;
}) {
  const query = trpc.admin.copa.matchState.useQuery(
    { fixtureId, matchId },
    {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
  // Hold the loaded snapshot for the lifetime of the form; background refetches cannot erase edits.
  const [initialState, setInitialState] = useState<CopaCorrectionState | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!initialState && query.isFetchedAfterMount && query.data)
      setInitialState(query.data);
  }, [initialState, query.isFetchedAfterMount, query.data]);
  const state = initialState;
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="copa-correction-dialog"
        showCloseButton={!busy}
        onEscapeKeyDown={event => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={event => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogTitle>Corrigir partida da Copa</DialogTitle>
        <DialogDescription>
          O resultado, as estatísticas e o histórico serão salvos juntos. Uma
          mudança que invalide resultado posterior será bloqueada.
        </DialogDescription>
        {query.isError && !state ? (
          <p role="alert">{query.error.message}</p>
        ) : state ? (
          <CorrectionForm
            state={state}
            fixtureId={fixtureId}
            matchId={matchId}
            players={players}
            onClose={onClose}
            onBusyChange={setBusy}
          />
        ) : (
          <p>Carregando dados da partida...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
