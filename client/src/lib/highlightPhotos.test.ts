import { beforeEach, describe, expect, it, vi } from "vitest";

const transport = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("./supabase", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient("https://highlight-test.invalid", "test-key", {
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
import { saveHighlight } from "./amigosData";

type Highlight = {
  id: number;
  matchId: number;
  kind: string;
  playerId: number;
  imageUrl: string | null;
  imageKey: string | null;
  caption: string | null;
};
let rows: Highlight[];
let completed: boolean;
let participant: boolean;
let concurrentChange: boolean;
let readError: boolean;
let writes: { method: string; url: URL; body: Record<string, unknown> }[];
const photo = {
  matchId: 301,
  kind: "best" as const,
  playerId: 1,
  imageUrl: "https://example.invalid/new.jpg",
  imageKey: "highlights/new.jpg",
  caption: "Foto nova",
};
const response = (value: unknown, status = 200) =>
  new Response(value === null ? null : JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });

beforeEach(() => {
  rows = [
    {
      id: 601,
      matchId: 301,
      kind: "best",
      playerId: 1,
      imageUrl: null,
      imageKey: null,
      caption: null,
    },
  ];
  completed = true;
  participant = true;
  concurrentChange = false;
  readError = false;
  writes = [];
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: "admin-ficticio" } },
    error: null,
  } as any);
  transport.fetch.mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    expect(url.hostname).toBe("highlight-test.invalid");
    const method = init?.method || "GET";
    const table = url.pathname.split("/").at(-1);
    if (table === "adminProfiles")
      return response([
        {
          id: 1,
          userId: "admin-ficticio",
          name: "Admin fictício",
          isActive: true,
        },
      ]);
    if (table === "matchParticipants")
      return response(participant ? [{ id: 401 }] : []);
    expect(table).toBe("roundHighlights");
    if (method === "GET") {
      if (readError)
        return response(
          { code: "TEST_ERROR", message: "Falha de leitura" },
          400
        );
      return response(
        rows.filter(
          row =>
            url.searchParams.get("matchId") === `eq.${row.matchId}` &&
            url.searchParams.get("kind") === `eq.${row.kind}`
        )
      );
    }
    const body = JSON.parse(String(init?.body));
    writes.push({ method, url, body });
    if (method === "PATCH") {
      if (concurrentChange) rows[0].playerId = 8;
      const row = rows.find(row =>
        ["id", "matchId", "kind", "playerId"].every(
          key =>
            url.searchParams.get(key) === `eq.${row[key as keyof Highlight]}`
        )
      );
      if (!row) return response([]);
      if (completed && row.playerId !== body.playerId)
        return response(
          { code: "P0001", message: "Use Corrigir partida na aba Copa." },
          400
        );
      Object.assign(row, body);
      return response([{ id: row.id }]);
    }
    expect(method).toBe("POST");
    // Reproduce the BEFORE INSERT guard seen in production, including UPSERT.
    if (completed)
      return response(
        { code: "P0001", message: "Use Corrigir partida na aba Copa." },
        400
      );
    rows.push({
      id: 602,
      imageUrl: null,
      imageKey: null,
      caption: null,
      ...body,
    });
    return response(null, 201);
  });
});

describe("salvamento de fotos dos destaques pelo SDK Supabase", () => {
  it("salva foto/legenda do Melhor existente por PATCH, sem disparar INSERT na Copa concluída", async () => {
    await saveHighlight(photo);
    expect(writes.map(write => write.method)).toEqual(["PATCH"]);
    expect(rows).toEqual([{ id: 601, ...photo }]);
    expect(writes[0].url.searchParams.get("playerId")).toBe("eq.1");
  });

  it("salva também a foto do Pior, mantendo seu ID e jogador", async () => {
    rows[0] = { ...rows[0], kind: "worst", playerId: 8 };
    await saveHighlight({ ...photo, kind: "worst", playerId: 8 });
    expect(writes[0].method).toBe("PATCH");
    expect(rows[0]).toMatchObject({
      id: 601,
      kind: "worst",
      playerId: 8,
      imageUrl: photo.imageUrl,
    });
  });

  it("preserva a foto existente quando somente a legenda é enviada", async () => {
    rows[0].imageUrl = "https://example.invalid/keep.jpg";
    rows[0].imageKey = "highlights/keep.jpg";
    await saveHighlight({
      matchId: 301,
      kind: "best",
      playerId: 1,
      caption: "Nova legenda",
    });
    expect(rows[0]).toMatchObject({
      imageUrl: "https://example.invalid/keep.jpg",
      imageKey: "highlights/keep.jpg",
      caption: "Nova legenda",
    });
    expect(writes[0].body).not.toHaveProperty("imageUrl");
  });

  it("continua criando destaque novo em partida comum", async () => {
    rows = [];
    completed = false;
    await saveHighlight(photo);
    expect(writes[0].method).toBe("POST");
    expect(rows[0]).toMatchObject(photo);
  });

  it("não cria estatística em partida concluída para contornar a proteção", async () => {
    rows = [];
    await expect(saveHighlight(photo)).rejects.toThrow("Corrigir partida");
    expect(rows).toEqual([]);
  });

  it("impede sobrescrever um jogador alterado durante o carregamento da foto", async () => {
    concurrentChange = true;
    await expect(saveHighlight(photo)).rejects.toThrow("outro administrador");
    expect(rows[0]).toMatchObject({ playerId: 8, imageUrl: null });
    expect(writes.map(write => write.method)).toEqual(["PATCH"]);
  });

  it("mantém o bloqueio do banco ao trocar o jogador de um destaque concluído", async () => {
    await expect(saveHighlight({ ...photo, playerId: 8 })).rejects.toThrow(
      "Corrigir partida"
    );
    expect(rows[0]).toMatchObject({ playerId: 1, imageUrl: null });
  });

  it("rejeita jogador fora da partida antes da gravação", async () => {
    participant = false;
    await expect(saveHighlight(photo)).rejects.toThrow("jogadores da partida");
    expect(writes).toEqual([]);
  });

  it("rejeita sessão ausente", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);
    await expect(saveHighlight(photo)).rejects.toThrow("conta administrativa");
    expect(writes).toEqual([]);
  });

  it("não tenta inserir caso a consulta do destaque falhe", async () => {
    readError = true;
    await expect(saveHighlight(photo)).rejects.toThrow("Falha de leitura");
    expect(writes).toEqual([]);
  });
});
