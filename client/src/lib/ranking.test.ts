import { describe, expect, it } from "vitest";
import { calculateHonorTotals, calculateSeasonTotals } from "./amigosData";

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

    expect(totals.get(1)).toEqual({ points: 3, wins: 1, goals: 2 });
    expect(totals.get(2)).toBeUndefined();
    expect(totals.get(3)).toEqual({ points: 0, wins: 0, goals: 2 });
  });

  it("não atribui pontos em empate e mantém a artilharia", () => {
    const totals = calculateSeasonTotals([{
      blackScore: 1,
      redScore: 1,
      participants: [
        { playerId: 1, teamColor: "black", isGuest: false },
        { playerId: 2, teamColor: "red", isGuest: false },
      ],
      goals: [{ playerId: 2, quantity: 1 }],
    }]);

    expect(totals.get(1)).toEqual({ points: 0, wins: 0, goals: 0 });
    expect(totals.get(2)).toEqual({ points: 0, wins: 0, goals: 1 });
  });

  it("não inclui gols de convidados avulsos em nenhum ranking", () => {
    const totals = calculateSeasonTotals([{
      blackScore: 2,
      redScore: 1,
      participants: [{ playerId: 1, teamColor: "black", isGuest: false }, { playerId: null, teamColor: "black", isGuest: true }, { playerId: 2, teamColor: "red", isGuest: false }],
      goals: [{ playerId: null, quantity: 2 }, { playerId: 2, quantity: 1 }],
    }]);
    expect(totals.get(1)).toEqual({ points: 3, wins: 1, goals: 0 });
    expect(totals.get(2)).toEqual({ points: 0, wins: 0, goals: 1 });
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
});
