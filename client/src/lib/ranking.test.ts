import { describe, expect, it } from "vitest";
import { buildCopaFixturePlan, buildSelectionOfYear, calculateHonorTotals, calculateSeasonTotals, visibleRankingRows } from "./amigosData";

describe("ranking da pelada", () => {
  it("atribui três pontos e uma vitória somente aos jogadores fixos do time vencedor", () => {
    const totals = calculateSeasonTotals([{
      blackScore: 4,
      redScore: 2,
      participants: [
        { playerId: 1, teamColor: "black", isGuest: false },
        { playerId: 2, teamColor: "black", isGuest: true },
        { playerId: 3, teamColor: "red", isGuest: false },
      ],
      goals: [
        { playerId: 1, quantity: 2 },
        { playerId: 2, quantity: 2 },
        { playerId: 3, quantity: 2 },
      ],
    }]);

    expect(totals.get(1)).toEqual({ points: 3, wins: 1, goals: 2, goalBalance: 2 });
    expect(totals.get(2)).toBeUndefined();
    expect(totals.get(3)).toEqual({ points: 0, wins: 0, goals: 2, goalBalance: -2 });
  });

  it("atribui um ponto aos jogadores fixos dos dois times em empate e mantém a artilharia", () => {
    const totals = calculateSeasonTotals([{
      blackScore: 1,
      redScore: 1,
      participants: [
        { playerId: 1, teamColor: "black", isGuest: false },
        { playerId: 2, teamColor: "red", isGuest: false },
      ],
      goals: [{ playerId: 2, quantity: 1 }],
    }]);

    expect(totals.get(1)).toEqual({ points: 1, wins: 0, goals: 0, goalBalance: 0 });
    expect(totals.get(2)).toEqual({ points: 1, wins: 0, goals: 1, goalBalance: 0 });
  });

  it("não inclui gols de convidados avulsos em nenhum ranking", () => {
    const totals = calculateSeasonTotals([{
      blackScore: 2,
      redScore: 1,
      participants: [{ playerId: 1, teamColor: "black", isGuest: false }, { playerId: null, teamColor: "black", isGuest: true }, { playerId: 2, teamColor: "red", isGuest: false }],
      goals: [{ playerId: null, quantity: 2 }, { playerId: 2, quantity: 1 }],
    }]);
    expect(totals.get(1)).toEqual({ points: 3, wins: 1, goals: 0, goalBalance: 1 });
    expect(totals.get(2)).toEqual({ points: 0, wins: 0, goals: 1, goalBalance: -1 });
    expect(totals.has(null as never)).toBe(false);
  });

  it("soma votos e frequência de Melhor e Pior sem incluir convidados", () => {
    const totals = calculateHonorTotals([
      { playerId: 1, isGuest: false, bestVotes: 7, worstVotes: 1 },
      { playerId: 2, isGuest: false, bestVotes: 3, worstVotes: 6 },
      { playerId: null, isGuest: true, bestVotes: 99, worstVotes: 99 },
    ], [{ playerId: 1, kind: "best" }, { playerId: 1, kind: "best" }, { playerId: 2, kind: "worst" }]);
    expect(totals.best.get(1)).toEqual({ count: 2, votes: 7 });
    expect(totals.worst.get(2)).toEqual({ count: 1, votes: 6 });
    expect(totals.best.has(null as never)).toBe(false);
  });

  it("congela pontos e vitórias durante a Copa, mas mantém gols e saldo individuais", () => {
    const totals = calculateSeasonTotals([{ blackScore: 4, redScore: 1, countsForStandings: false, participants: [{ playerId: 1, teamColor: "black", isGuest: false }, { playerId: 2, teamColor: "red", isGuest: false }], goals: [{ playerId: 1, quantity: 2 }, { playerId: 2, quantity: 1 }] }]);
    expect(totals.get(1)).toEqual({ points: 0, wins: 0, goals: 2, goalBalance: 3 });
    expect(totals.get(2)).toEqual({ points: 0, wins: 0, goals: 1, goalBalance: -3 });
  });

  it("cria quatro quartas, duas semifinais e uma final em domingos consecutivos", () => {
    const plan = buildCopaFixturePlan(Array.from({ length: 8 }, (_, index) => ({ id: index + 1 })), "2026-10-04", false, () => 0);
    expect(plan).toHaveLength(7);
    expect(plan.filter(fixture => fixture.stage === "quarterfinal")).toHaveLength(4);
    expect(plan.map(fixture => fixture.scheduledDate)).toEqual(["2026-10-04", "2026-10-11", "2026-10-18", "2026-10-25", "2026-11-01", "2026-11-08", "2026-11-15"]);
  });

  it("mostra somente os oito primeiros até a classificação completa ser solicitada", () => {
    const rows = Array.from({ length: 11 }, (_, index) => index + 1);
    expect(visibleRankingRows(rows)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(visibleRankingRows(rows, true)).toEqual(rows);
  });

  it("monta a Seleção do Ano por votos de Bola Cheia, posição e desempates", () => {
    const selection = buildSelectionOfYear([
      { id: 1, name: "Goleiro", position: "Goleiro", votes: 9, count: 2, points: 4 },
      { id: 2, name: "Zagueiro A", position: "Zagueiro", votes: 8, count: 2, points: 7 },
      { id: 3, name: "Zagueiro B", position: "Lateral", votes: 8, count: 1, points: 20 },
      { id: 4, name: "Meia A", position: "Meia", votes: 6, count: 2, points: 5 },
      { id: 5, name: "Meia B", position: "Volante", votes: 5, count: 1, points: 9 },
      { id: 6, name: "Atacante A", position: "Atacante", votes: 11, count: 1, points: 2 },
      { id: 7, name: "Atacante B", position: "Centroavante", votes: 7, count: 1, points: 3 },
      { id: 8, name: "Meia C", position: "Meio-campo", votes: 4, count: 1, points: 2 },
    ]);
    expect(selection).toHaveLength(8);
    expect(selection.map(slot => `${slot.role}-${slot.slot}`)).toEqual(["goalkeeper-1", "defender-1", "defender-2", "midfielder-1", "midfielder-2", "midfielder-3", "attacker-1", "attacker-2"]);
    expect(selection.map(slot => [slot.fieldX, slot.fieldY])).toEqual([[50, 86], [26, 66], [74, 66], [18, 44], [50, 42], [82, 44], [34, 21], [66, 21]]);
    expect(selection.filter(slot => slot.role === "defender").map(slot => slot.player?.name)).toEqual(["Zagueiro A", "Zagueiro B"]);
    expect(selection.filter(slot => slot.role === "attacker").map(slot => slot.player?.name)).toEqual(["Atacante A", "Atacante B"]);
    expect(selection.filter(slot => slot.role === "midfielder").map(slot => slot.player?.name)).toEqual(["Meia A", "Meia B", "Meia C"]);
  });
});
