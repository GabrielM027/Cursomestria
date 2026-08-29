import { describe, expect, it } from "vitest";
import { normalizePlayerPosition, summarizePlayersByPosition } from "./amigosData";

describe("posição livre de jogador", () => {
  it("preserva o texto informado e ignora campos vazios", () => {
    expect(normalizePlayerPosition("  Goleiro  ")).toBe("Goleiro");
    expect(normalizePlayerPosition("Lateral-direito")).toBe("Lateral-direito");
    expect(normalizePlayerPosition("   ")).toBeNull();
  });

  it("agrupa posições iguais sem diferenciar maiúsculas e destaca atletas sem posição", () => {
    expect(summarizePlayersByPosition([
      { position: " Goleiro ", isActive: true },
      { position: "goleiro", isActive: false },
      { position: "Atacante", isActive: true },
      { position: null, isActive: true },
    ])).toEqual([
      { position: "Goleiro", total: 2, active: 1 },
      { position: "Atacante", total: 1, active: 1 },
      { position: "Sem posição", total: 1, active: 1 },
    ]);
  });
});
