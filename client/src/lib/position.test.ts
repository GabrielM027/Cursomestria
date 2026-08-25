import { describe, expect, it } from "vitest";
import { normalizePlayerPosition } from "./amigosData";

describe("posição livre de jogador", () => {
  it("preserva o texto informado e ignora campos vazios", () => {
    expect(normalizePlayerPosition("  Goleiro  ")).toBe("Goleiro");
    expect(normalizePlayerPosition("Lateral-direito")).toBe("Lateral-direito");
    expect(normalizePlayerPosition("   ")).toBeNull();
  });
});
