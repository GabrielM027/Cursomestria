import { describe, expect, it } from "vitest";
import { teamSelectionLabel } from "./teamSelection";

describe("teamSelectionLabel", () => {
  it("inclui a posição cadastrada no rótulo de escolha", () => {
    expect(teamSelectionLabel({ name: "Gabriel", position: "meia" })).toBe("Gabriel · MEIA");
  });

  it("mantém somente o nome quando a posição estiver em branco", () => {
    expect(teamSelectionLabel({ name: "Gabriel", position: " " })).toBe("Gabriel");
  });
});
