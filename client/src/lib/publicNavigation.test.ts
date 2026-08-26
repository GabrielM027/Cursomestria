import { describe, expect, it } from "vitest";
import { publicNavigation } from "./publicNavigation";

describe("publicNavigation", () => {
  it("mantém a ordem pública definida e substitui o ranking genérico", () => {
    expect(publicNavigation.map(([, label]) => label)).toEqual([
      "Início",
      "Pontos Corridos",
      "Copa",
      "Artilheiros",
      "Bola Cheia / Bola Murcha",
      "Seleção do Ano",
      "Partidas",
      "Galeria",
    ]);
    expect(publicNavigation.map(([, label]) => label)).not.toContain("Ranking");
  });
});
