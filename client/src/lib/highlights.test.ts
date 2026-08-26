import { describe, expect, it } from "vitest";
import { groupHighlightsBySunday } from "./amigosData";

describe("histórico de destaques", () => {
  it("agrupa Melhor e Pior pelo domingo e mantém a rodada mais recente primeiro", () => {
    const rounds = groupHighlightsBySunday([
      { id: 1, matchDate: "2026-08-09T12:00:00Z", kind: "best" },
      { id: 2, matchDate: "2026-08-16T12:00:00Z", kind: "best" },
      { id: 3, matchDate: "2026-08-16T12:00:00Z", kind: "worst" },
    ]);
    expect(rounds).toHaveLength(2);
    expect(rounds[0].date).toBe("2026-08-16");
    expect(rounds[0].items.map(item => item.id)).toEqual([2, 3]);
  });
});
