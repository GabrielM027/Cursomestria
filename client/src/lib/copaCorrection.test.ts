import { describe, expect, it } from "vitest";
import {
  buildCopaChanges,
  previewCopaResult,
  type CopaCorrectionState,
} from "./copaCorrection";
import { calculateHonorTotals, calculateSeasonTotals } from "./amigosData";

const state: CopaCorrectionState = {
  revision: "synthetic",
  data: {
    tournament: { id: 1, status: "active" },
    fixtures: [
      {
        id: 1,
        tournamentId: 1,
        stage: "quarterfinal",
        slotNumber: 1,
        status: "completed",
        homeEntrantId: 1,
        awayEntrantId: 2,
        winnerEntrantId: 1,
        homePenaltyScore: null,
        awayPenaltyScore: null,
      },
      {
        id: 7,
        tournamentId: 1,
        stage: "final",
        slotNumber: 1,
        status: "completed",
        homeEntrantId: 1,
        awayEntrantId: 2,
        winnerEntrantId: null,
        homePenaltyScore: null,
        awayPenaltyScore: null,
      },
      {
        id: 8,
        tournamentId: 1,
        stage: "final",
        slotNumber: 2,
        status: "completed",
        homeEntrantId: 1,
        awayEntrantId: 2,
        winnerEntrantId: 1,
        homePenaltyScore: null,
        awayPenaltyScore: null,
      },
    ],
    matches: [
      {
        id: 1,
        copaFixtureId: 1,
        matchDate: "2099-01-04",
        blackScore: 2,
        redScore: 1,
        notes: "Keep",
        countsForStandings: false,
      },
      {
        id: 7,
        copaFixtureId: 7,
        matchDate: "2099-02-15",
        blackScore: 2,
        redScore: 0,
        notes: null,
        countsForStandings: false,
      },
      {
        id: 8,
        copaFixtureId: 8,
        matchDate: "2099-02-22",
        blackScore: 0,
        redScore: 1,
        notes: null,
        countsForStandings: false,
      },
    ],
    participants: [
      {
        id: 1,
        playerId: 1,
        teamColor: "black",
        isGuest: false,
        guestName: null,
        invitedByName: null,
        bestVotes: 7,
        worstVotes: 0,
      },
      {
        id: 2,
        playerId: 2,
        teamColor: "red",
        isGuest: false,
        guestName: null,
        invitedByName: null,
        bestVotes: 0,
        worstVotes: 4,
      },
    ],
    goals: [
      { id: 1, playerId: 1, teamColor: "black", guestName: null, quantity: 2 },
    ],
    highlights: [
      { id: 1, kind: "best", playerId: 1 },
      { id: 2, kind: "worst", playerId: 2 },
    ],
  },
};
const values = {
  blackScore: 2,
  redScore: 1,
  homePenaltyScore: null,
  awayPenaltyScore: null,
  participants: state.data.participants,
  goals: state.data.goals,
  highlights: state.data.highlights,
};
describe("correção da Copa", () => {
  it("envia só o placar alterado, preservando escalação, votos, gols e destaques", () => {
    expect(buildCopaChanges(state, 1, 1, { ...values, redScore: 3 })).toEqual({
      redScore: 3,
    });
    expect(buildCopaChanges(state, 1, 1, values)).toEqual({});
  });
  it("preserva IDs e não envia campos enriquecidos ou de mídia", () => {
    const highlights = state.data.highlights.map(h => ({
      ...h,
      playerId: h.kind === "best" ? 2 : h.playerId,
      imageUrl: "Keep photo",
      caption: "Keep caption",
    }));
    expect(buildCopaChanges(state, 1, 1, { ...values, highlights })).toEqual({
      highlights: [
        { id: 1, kind: "best", playerId: 2 },
        { id: 2, kind: "worst", playerId: 2 },
      ],
    });
  });
  it("permite remoção explícita de gols e envio de votos alterados", () => {
    const participants = state.data.participants.map(p => ({
      ...p,
      bestVotes: p.playerId === 1 ? 8 : p.bestVotes,
    }));
    const changes = buildCopaChanges(state, 1, 1, {
      ...values,
      participants,
      goals: [{ ...state.data.goals[0], quantity: 0 }],
    });
    expect(changes.goals).toEqual([]);
    expect(changes.participants?.[0].bestVotes).toBe(8);
    expect(changes.participants?.[0].id).toBe(1);
  });
  it("primeiro jogo da final não pede pênaltis mesmo se empatado", () => {
    expect(previewCopaResult(state, 7, 7, 1, 1).needsPenalties).toBe(false);
  });
  it("a volta pede pênaltis no empate agregado mesmo com placar próprio diferente", () => {
    const preview = previewCopaResult(state, 8, 8, 0, 2);
    expect(preview.needsPenalties).toBe(true);
    expect(preview.aggregateBlack).toBe(2);
    expect(preview.aggregateRed).toBe(2);
  });
  it("empate no placar da volta dispensa pênaltis quando agregado desempata", () => {
    expect(previewCopaResult(state, 8, 8, 1, 1).needsPenalties).toBe(false);
    expect(previewCopaResult(state, 1, 1, 1, 1).needsPenalties).toBe(true);
  });
  it("corrigir Copa mantém pontos e vitórias anteriores, atualizando gols e Melhor/Pior", () => {
    const participants = state.data.participants.map(p => ({
      ...p,
      isGuest: false,
    }));
    const league = {
      blackScore: 2,
      redScore: 1,
      countsForStandings: true,
      participants,
      goals: state.data.goals,
    };
    const corrected = {
      blackScore: 1,
      redScore: 4,
      countsForStandings: false,
      participants,
      goals: [{ playerId: 2, quantity: 4 }],
    };
    const totals = calculateSeasonTotals([league, corrected]);
    expect(totals.get(1)?.points).toBe(3);
    expect(totals.get(1)?.wins).toBe(1);
    expect(totals.get(2)?.points).toBe(0);
    expect(totals.get(2)?.wins).toBe(0);
    expect(totals.get(2)?.goals).toBe(4);
    const honors = calculateHonorTotals(participants, [
      { kind: "best", playerId: 2 },
      { kind: "worst", playerId: 1 },
    ]);
    expect(honors.best.get(2)?.count).toBe(1);
    expect(honors.best.get(1)?.votes).toBe(7);
    expect(honors.worst.get(1)?.count).toBe(1);
  });
});
