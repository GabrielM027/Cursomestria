import { describe, expect, it } from "vitest";
import { buildSponsorTickerItems, normalizeSponsorPresentation, usesFilledSponsorCard } from "./sponsors";

describe("faixa de patrocinadores", () => {
  it("repete somente os nomes preenchidos para manter uma rolagem contínua", () => {
    expect(buildSponsorTickerItems(["  Oficina do Bairro ", "", "Mercado Central"])).toEqual(["Oficina do Bairro", "Mercado Central", "Oficina do Bairro", "Mercado Central"]);
  });

  it("mantém escala, ordem e posição dentro dos limites visuais permitidos", () => {
    expect(normalizeSponsorPresentation({ displayScale: 3, sortOrder: -2 })).toEqual({ displayScale: 1.6, sortOrder: 0, offsetX: 0, offsetY: 0, fitMode: "cover" });
    expect(normalizeSponsorPresentation({ displayScale: .92, sortOrder: 12.7, offsetX: 44, offsetY: -41, fitMode: "contain" })).toEqual({ displayScale: .92, sortOrder: 13, offsetX: 30, offsetY: -30, fitMode: "contain" });
  });

  it("marca qualquer logo cadastrada para preencher todo o cartão", () => {
    expect(usesFilledSponsorCard("Panificadora Marques")).toBe(true);
    expect(usesFilledSponsorCard("Goldcar Automóveis")).toBe(true);
    expect(usesFilledSponsorCard("Marca fora da faixa")).toBe(true);
    expect(usesFilledSponsorCard(" ")).toBe(false);
  });
});
