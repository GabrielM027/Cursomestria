import { beforeEach, describe, expect, it, vi } from "vitest";

const transport = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("./supabase", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient("https://selection-test.invalid", "test-key", {
    global: { fetch: transport.fetch },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  client.auth.getUser = vi.fn();
  return { supabase: client, supabaseConfigured: true };
});
import { supabase } from "./supabase";
import {
  buildSelectionOfYear,
  buildSelectionSlots,
  DEFAULT_SELECTION_FORMATION,
  getSelectionPlayerCount,
  isValidSelectionFormation,
  normalizeSelectionFormation,
  saveSelectionFormation,
  saveSelectionOverrides,
} from "./amigosData";

const formation = {
  goalkeeperCount: 1 as const,
  defenderCount: 4,
  midfielderCount: 4,
  attackerCount: 2,
};
let writes: Array<{ table: string; method: string; body: any }>;
beforeEach(() => {
  writes = [];
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: "admin-ficticio" } },
    error: null,
  } as any);
  transport.fetch.mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    expect(url.hostname).toBe("selection-test.invalid");
    const table = url.pathname.split("/").at(-1)!;
    if (table === "adminProfiles")
      return new Response(
        JSON.stringify([{ userId: "admin-ficticio", isActive: true }]),
        { headers: { "content-type": "application/json" } }
      );
    writes.push({
      table,
      method: init.method,
      body: init.body ? JSON.parse(init.body) : null,
    });
    return new Response(null, { status: 204 });
  });
});

describe("quantidade da Seleção do Ano", () => {
  it.each([1, 7, 8, 9, 10, 11])(
    "aceita %i jogadores incluindo exatamente um goleiro",
    total => {
      const chosen = {
        goalkeeperCount: 1 as const,
        defenderCount: 0,
        midfielderCount: total - 1,
        attackerCount: 0,
      };
      expect(isValidSelectionFormation(chosen)).toBe(true);
      expect(getSelectionPlayerCount(normalizeSelectionFormation(chosen))).toBe(
        total
      );
      const slots = buildSelectionSlots(chosen);
      expect(slots).toHaveLength(total);
      expect(slots.filter(slot => slot.role === "goalkeeper")).toHaveLength(1);
      expect(new Set(slots.map(slot => `${slot.role}-${slot.slot}`)).size).toBe(
        total
      );
      expect(
        slots.every(
          slot =>
            slot.fieldX >= 5 &&
            slot.fieldX <= 95 &&
            slot.fieldY >= 5 &&
            slot.fieldY <= 95
        )
      ).toBe(true);
    }
  );

  it("rejeita mais de 11, frações, negativos e uma formação sem goleiro", () => {
    for (const invalid of [
      { ...formation, attackerCount: 3 },
      { ...formation, midfielderCount: -1 },
      { ...formation, defenderCount: 1.5 },
      { ...formation, attackerCount: NaN },
      { ...formation, goalkeeperCount: 0 as 1 },
      { ...formation, goalkeeperCount: 2 as 1 },
      { goalkeeperCount: 1 as const },
    ])
      expect(isValidSelectionFormation(invalid)).toBe(false);
    expect(normalizeSelectionFormation()).toEqual(DEFAULT_SELECTION_FORMATION);
  });

  it("adiciona automaticamente o segundo melhor atacante ao passar de 8 para 9", () => {
    const players = [
      { id: 1, name: "Goleiro", position: "goleiro", votes: 5 },
      { id: 2, name: "Primeiro atacante", position: "atacante", votes: 20 },
      { id: 3, name: "Segundo atacante", position: "atacante", votes: 15 },
      { id: 4, name: "Terceiro atacante", position: "atacante", votes: 7 },
      { id: 5, name: "Meia com mais votos", position: "meia", votes: 100 },
    ];
    const original = {
      goalkeeperCount: 1 as const,
      defenderCount: 2,
      midfielderCount: 4,
      attackerCount: 1,
    };
    const before = buildSelectionOfYear(players, original);
    const after = buildSelectionOfYear(players, {
      ...original,
      attackerCount: 2,
    });
    expect(before).toHaveLength(8);
    expect(after).toHaveLength(9);
    expect(
      before
        .filter(slot => slot.role === "attacker")
        .map(slot => slot.player?.id)
    ).toEqual([2]);
    expect(
      after
        .filter(slot => slot.role === "attacker")
        .map(slot => slot.player?.id)
    ).toEqual([2, 3]);
    expect(
      after
        .filter(slot => slot.role !== "attacker")
        .map(slot => slot.player?.id)
    ).toEqual(
      before
        .filter(slot => slot.role !== "attacker")
        .map(slot => slot.player?.id)
    );
  });

  it("preserva os desempates e deixa vagas sem candidato elegível", () => {
    const players = [
      {
        id: 1,
        name: "A",
        position: "atacante",
        votes: 10,
        count: 2,
        points: 8,
      },
      {
        id: 2,
        name: "B",
        position: "atacante",
        votes: 10,
        count: 3,
        points: 1,
      },
      {
        id: 3,
        name: "C",
        position: "atacante",
        votes: 10,
        count: 2,
        points: 10,
      },
      {
        id: 4,
        name: "D",
        position: "atacante",
        votes: 0,
        count: 5,
        points: 100,
      },
    ];
    const slots = buildSelectionOfYear(players, {
      goalkeeperCount: 1,
      defenderCount: 0,
      midfielderCount: 0,
      attackerCount: 4,
    });
    expect(
      slots
        .filter(slot => slot.role === "attacker")
        .map(slot => slot.player?.id ?? null)
    ).toEqual([2, 3, 1, null]);
  });

  it("distribui até dez jogadores da mesma posição em linhas com no máximo três", () => {
    const slots = buildSelectionSlots({
      goalkeeperCount: 1,
      defenderCount: 0,
      midfielderCount: 10,
      attackerCount: 0,
    });
    for (const slot of slots) {
      const sameRow = slots.filter(
        other => Math.abs(slot.fieldY - other.fieldY) <= 2
      );
      expect(sameRow.length).toBeLessThanOrEqual(3);
    }
  });
});

describe("salvamento da seleção ampliada", () => {
  it("salva a formação com 11 e conserva o fluxo de seleção automática", async () => {
    await saveSelectionFormation({ seasonId: 1, formation });
    expect(writes.map(write => [write.table, write.method])).toEqual([
      ["selectionYearFormations", "POST"],
      ["selectionYearOverrides", "DELETE"],
    ]);
    expect(writes[0].body).toMatchObject({ seasonId: 1, ...formation });
  });

  it("salva os onze ajustes manuais sem rejeitar o novo total", async () => {
    const slots = buildSelectionSlots(formation).map((slot, index) => ({
      role: slot.role,
      slotNumber: slot.slot,
      playerId: index + 1,
      fieldX: slot.fieldX,
      fieldY: slot.fieldY,
    }));
    await saveSelectionOverrides({ seasonId: 1, formation, slots });
    expect(writes).toHaveLength(1);
    expect(writes[0].body).toHaveLength(11);
    expect(writes[0].table).toBe("selectionYearOverrides");
    expect(writes[0].body.map((row: any) => row.playerId)).toEqual(
      Array.from({ length: 11 }, (_, i) => i + 1)
    );
  });

  it("impede jogadores repetidos e quantidade incompleta antes de gravar", async () => {
    const slots = buildSelectionSlots(formation).map(slot => ({
      role: slot.role,
      slotNumber: slot.slot,
      playerId: 1,
      fieldX: slot.fieldX,
      fieldY: slot.fieldY,
    }));
    await expect(
      saveSelectionOverrides({ seasonId: 1, formation, slots })
    ).rejects.toThrow("duas posições");
    await expect(
      saveSelectionOverrides({
        seasonId: 1,
        formation,
        slots: slots.slice(0, 8),
      })
    ).rejects.toThrow("formação escolhida");
    await expect(
      saveSelectionFormation({
        seasonId: 1,
        formation: { ...formation, attackerCount: 3 },
      })
    ).rejects.toThrow("até 11");
    expect(writes).toEqual([]);
  });
});
