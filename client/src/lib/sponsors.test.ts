import { describe, expect, it } from "vitest";
import { buildSponsorTickerItems } from "./sponsors";

describe("faixa de patrocinadores", () => {
  it("repete somente os nomes preenchidos para manter uma rolagem contínua", () => {
    expect(buildSponsorTickerItems(["  Oficina do Bairro ", "", "Mercado Central"])).toEqual(["Oficina do Bairro", "Mercado Central", "Oficina do Bairro", "Mercado Central"]);
  });
});
