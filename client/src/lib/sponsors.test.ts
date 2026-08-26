import { describe, expect, it } from "vitest";
import { buildSponsorTickerItems, normalizeSponsorPresentation, usesFilledSponsorCard } from "./sponsors";

describe("faixa de patrocinadores", () => {
  it("repete somente os nomes preenchidos para manter uma rolagem contínua", () => {
    expect(buildSponsorTickerItems(["  Oficina do Bairro ", "", "Mercado Central"])).toEqual(["Oficina do Bairro", "Mercado Central", "Oficina do Bairro", "Mercado Central"]);
  });

  it("mantém a escala e a ordem do logo dentro dos limites visuais permitidos", () => {
    expect(normalizeSponsorPresentation({ displayScale: 3, sortOrder: -2 })).toEqual({ displayScale: 1.6, sortOrder: 0 });
    expect(normalizeSponsorPresentation({ displayScale: .92, sortOrder: 12.7 })).toEqual({ displayScale: .92, sortOrder: 13 });
  });

  it("marca somente a Panificadora Marques para preencher todo o cartão", () => {
    expect(usesFilledSponsorCard("Panificadora Marques")).toBe(true);
    expect(usesFilledSponsorCard("Goldcar Automóveis")).toBe(false);
  });
});
