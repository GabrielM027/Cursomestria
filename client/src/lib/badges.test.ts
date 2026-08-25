import { describe, expect, it } from "vitest";
import { getCountryBadge } from "./amigosData";

describe("símbolos de seleções", () => {
  it("reconhece nomes em português, inclusive com acentuação", () => {
    expect(getCountryBadge("Brasil")?.badgeUrl).toContain("/br.png");
    expect(getCountryBadge("Marrocos")?.badgeUrl).toContain("/ma.png");
    expect(getCountryBadge("México")?.badgeUrl).toContain("/mx.png");
  });
});
