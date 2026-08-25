import { supabase, supabaseConfigured } from "./supabase";

type TeamColor = "black" | "red";
type ScoringMatch = {
  blackScore: number;
  redScore: number;
  participants: Array<{ playerId: number | null; teamColor: TeamColor; isGuest: boolean }>;
  goals: Array<{ playerId: number | null; quantity: number }>;
};

const TABLES = {
  seasons: "seasons",
  players: "players",
  entities: "footballEntities",
  registrations: "seasonRegistrations",
  matches: "matches",
  participants: "matchParticipants",
  goals: "matchGoals",
  highlights: "roundHighlights",
  gallery: "galleryItems",
  admins: "adminProfiles",
} as const;

function requireConfiguration() {
  if (!supabaseConfigured) throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.");
}

function fail(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Não foi possível concluir a operação.");
}

function groupBy<T, K>(rows: T[], key: (item: T) => K) {
  return rows.reduce((groups, row) => {
    const groupKey = key(row);
    const group = groups.get(groupKey) ?? [];
    group.push(row);
    groups.set(groupKey, group);
    return groups;
  }, new Map<K, T[]>());
}

export function calculateSeasonTotals(matches: ScoringMatch[]) {
  const totals = new Map<number, { points: number; wins: number; goals: number }>();
  const ensure = (playerId: number) => {
    const current = totals.get(playerId) ?? { points: 0, wins: 0, goals: 0 };
    totals.set(playerId, current);
    return current;
  };
  for (const match of matches) {
    const winner = match.blackScore === match.redScore ? null : match.blackScore > match.redScore ? "black" : "red";
    const rankingPlayerIds = new Set(match.participants.filter(participant => !participant.isGuest && participant.playerId !== null).map(participant => participant.playerId));
    for (const participant of match.participants) {
      if (participant.isGuest || participant.playerId === null) continue;
      const total = ensure(participant.playerId);
      if (winner === participant.teamColor) {
        total.points += 3;
        total.wins += 1;
      }
    }
    for (const goal of match.goals) if (goal.playerId !== null && rankingPlayerIds.has(goal.playerId)) ensure(goal.playerId).goals += goal.quantity;
  }
  return totals;
}

export function normalizePlayerPosition(value?: string | null) {
  return value?.trim() || null;
}

function emptyClubData() {
  return {
    activeSeason: null,
    standings: [],
    scorers: [],
    honorRankings: { best: [], worst: [] },
    matches: [],
    feed: [],
    gallery: [],
    home: { leader: null, leadingScorer: null, featuredMatches: [], galleryPreview: [], latestMatch: null, stats: { matches: 0, goals: 0 } },
  };
}

function buildClubData(input: any) {
  const people = new Map<number, any>(input.allPlayers.map((player: any) => [player.id, player]));
  const entities = new Map<number, any>(input.allEntities.map((entity: any) => [entity.id, entity]));
  const registrationByPlayer = new Map<number, any>(input.allRegistrations.map((registration: any) => [registration.playerId, registration]));
  const participantsByMatch = groupBy<any, number>(input.participantRows, row => row.matchId);
  const goalsByMatch = groupBy<any, number>(input.goalRows, row => row.matchId);
  const highlightsByMatch = groupBy<any, number>(input.highlightRows, row => row.matchId);

  const scoredMatches: ScoringMatch[] = input.matchRows.map((match: any) => ({
    blackScore: match.blackScore,
    redScore: match.redScore,
    participants: (participantsByMatch.get(match.id) ?? []).map(participant => ({
      playerId: participant.playerId,
      teamColor: participant.teamColor,
      isGuest: participant.isGuest,
    })),
    goals: (goalsByMatch.get(match.id) ?? []).map(goal => ({ playerId: goal.playerId, quantity: goal.quantity })),
  }));
  const totals = calculateSeasonTotals(scoredMatches);

  const playerInfo = (playerId: number) => {
    const player = people.get(playerId);
    const registration = registrationByPlayer.get(playerId);
    const entity = registration?.footballEntityId ? entities.get(registration.footballEntityId) : undefined;
    return {
      id: playerId,
      name: player?.name ?? "Jogador removido",
      position: player?.position ?? null,
      participantType: player?.participantType ?? "guest",
      avatarUrl: player?.avatarUrl ?? null,
      isActive: player?.isActive ?? false,
      entityName: entity?.name ?? null,
      entityBadgeUrl: entity?.badgeUrl ?? null,
    };
  };

  const standings = input.allPlayers
    .filter((player: any) => player.participantType === "fixed" && registrationByPlayer.get(player.id)?.isActive)
    .map((player: any) => ({ ...playerInfo(player.id), ...(totals.get(player.id) ?? { points: 0, wins: 0, goals: 0 }) }))
    .sort((a: any, b: any) => b.points - a.points || b.wins - a.wins || b.goals - a.goals || a.name.localeCompare(b.name));

  const scorers = Array.from(totals.entries())
    .filter(([, total]) => total.goals > 0)
    .map(([playerId, total]) => ({ ...playerInfo(playerId), goals: total.goals }))
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));

  const honorRankings = (["best", "worst"] as const).reduce((output, kind) => {
    const counts = new Map<number, number>();
    input.highlightRows.filter((row: any) => row.kind === kind).forEach((row: any) => counts.set(row.playerId, (counts.get(row.playerId) ?? 0) + 1));
    output[kind] = Array.from(counts.entries()).map(([playerId, count]) => ({ ...playerInfo(playerId), count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return output;
  }, { best: [] as any[], worst: [] as any[] });

  const participantDetails = (participant: any) => {
    const player = participant.playerId ? playerInfo(participant.playerId) : null;
    return { ...participant, player, displayName: player?.name ?? participant.guestName ?? "Convidado" };
  };
  const goalDetails = (goal: any) => {
    const player = goal.playerId ? playerInfo(goal.playerId) : null;
    return { ...goal, player, displayName: player?.name ?? goal.guestName ?? "Convidado" };
  };
  const matchesWithDetails = input.matchRows.map((match: any) => ({
    ...match,
    participants: (participantsByMatch.get(match.id) ?? []).map(participantDetails),
    goals: (goalsByMatch.get(match.id) ?? []).map(goalDetails),
    highlights: (highlightsByMatch.get(match.id) ?? []).map(highlight => ({ ...highlight, player: playerInfo(highlight.playerId) })),
  }));

  const feed = matchesWithDetails.flatMap((match: any) => match.highlights.map((highlight: any) => ({ ...highlight, matchDate: match.matchDate, matchId: match.id }))).sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
  const featuredMatches = [...matchesWithDetails].sort((a: any, b: any) => {
    const goalsA = a.blackScore + a.redScore;
    const goalsB = b.blackScore + b.redScore;
    return goalsB - goalsA || Math.abs(b.blackScore - b.redScore) - Math.abs(a.blackScore - a.redScore) || new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
  }).slice(0, 3).map((match: any) => ({ id: match.id, matchDate: match.matchDate, blackScore: match.blackScore, redScore: match.redScore, totalGoals: match.blackScore + match.redScore, goalDifference: Math.abs(match.blackScore - match.redScore), notes: match.notes }));
  const totalGoals = input.goalRows.reduce((sum: number, goal: any) => sum + goal.quantity, 0);

  return {
    activeSeason: input.activeSeason,
    standings,
    scorers,
    honorRankings,
    matches: matchesWithDetails,
    feed,
    gallery: input.galleryRows,
    home: {
      leader: standings[0] && standings[0].points > 0 ? standings[0] : null,
      leadingScorer: scorers[0] ?? null,
      featuredMatches,
      galleryPreview: input.galleryRows.slice(0, 3),
      latestMatch: matchesWithDetails[0] ?? null,
      stats: { matches: input.matchRows.length, goals: totalGoals },
    },
  };
}

async function selectAll(table: string) {
  const result = await supabase.from(table).select("*");
  fail(result.error);
  return result.data ?? [];
}

export async function getPublicClubData() {
  requireConfiguration();
  const seasonResult = await supabase.from(TABLES.seasons).select("*").eq("isActive", true).limit(1).maybeSingle();
  fail(seasonResult.error);
  const activeSeason = seasonResult.data;
  if (!activeSeason) return emptyClubData();

  const [playersResult, entitiesResult, registrationsResult, matchesResult, galleryResult] = await Promise.all([
    supabase.from(TABLES.players).select("*").order("name"),
    supabase.from(TABLES.entities).select("*").order("name"),
    supabase.from(TABLES.registrations).select("*").eq("seasonId", activeSeason.id),
    supabase.from(TABLES.matches).select("*").eq("seasonId", activeSeason.id).order("matchDate", { ascending: false }).order("id", { ascending: false }),
    supabase.from(TABLES.gallery).select("*").eq("seasonId", activeSeason.id).order("capturedAt", { ascending: false }).order("id", { ascending: false }),
  ]);
  [playersResult, entitiesResult, registrationsResult, matchesResult, galleryResult].forEach(result => fail(result.error));
  const matchRows = matchesResult.data ?? [];
  const matchIds = matchRows.map(match => match.id);
  let participantRows: any[] = [];
  let goalRows: any[] = [];
  let highlightRows: any[] = [];
  if (matchIds.length) {
    const [participantsResult, goalsResult, highlightsResult] = await Promise.all([
      supabase.from(TABLES.participants).select("*").in("matchId", matchIds),
      supabase.from(TABLES.goals).select("*").in("matchId", matchIds),
      supabase.from(TABLES.highlights).select("*").in("matchId", matchIds),
    ]);
    [participantsResult, goalsResult, highlightsResult].forEach(result => fail(result.error));
    participantRows = participantsResult.data ?? [];
    goalRows = goalsResult.data ?? [];
    highlightRows = highlightsResult.data ?? [];
  }
  return buildClubData({ activeSeason, allPlayers: playersResult.data ?? [], allEntities: entitiesResult.data ?? [], allRegistrations: registrationsResult.data ?? [], matchRows, participantRows, goalRows, highlightRows, galleryRows: galleryResult.data ?? [] });
}

export async function requireAdmin() {
  requireConfiguration();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const profile = await supabase.from(TABLES.admins).select("id,userId,name,email,isActive,createdAt").eq("userId", userData.user.id).eq("isActive", true).maybeSingle();
  if (profile.error || !profile.data) return null;
  return { id: profile.data.id, userId: userData.user.id, name: profile.data.name, email: profile.data.email };
}

export async function getAdminClubData() {
  if (!await requireAdmin()) throw new Error("Faça login com uma conta administrativa.");
  const [club, seasons, players, entities, registrations] = await Promise.all([
    getPublicClubData(),
    selectAll(TABLES.seasons),
    selectAll(TABLES.players),
    selectAll(TABLES.entities),
    selectAll(TABLES.registrations),
  ]);
  return { ...club, seasons: seasons.sort((a: any, b: any) => b.year - a.year), players: players.sort((a: any, b: any) => a.name.localeCompare(b.name)), entities: entities.sort((a: any, b: any) => a.name.localeCompare(b.name)), registrations };
}

export async function loginAdmin(input: { email: string; password: string }) {
  requireConfiguration();
  const result = await supabase.auth.signInWithPassword({ email: input.email.trim().toLowerCase(), password: input.password });
  fail(result.error);
  const admin = await requireAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    throw new Error("Esta conta não possui acesso administrativo ativo.");
  }
  return admin;
}

export async function logoutAdmin() {
  const result = await supabase.auth.signOut();
  fail(result.error);
  return { success: true };
}

export async function createSeason(input: { name: string; year: number; competitionLabel: string }) {
  fail((await supabase.from(TABLES.seasons).update({ isActive: false }).neq("id", 0)).error);
  fail((await supabase.from(TABLES.seasons).insert({ ...input, isActive: true })).error);
}

export async function saveFootballEntity(input: any) {
  const values = { name: input.name, category: input.category, badgeUrl: input.badgeUrl ?? null, source: input.source ?? null, sourceId: input.sourceId ?? null };
  if (input.id) {
    fail((await supabase.from(TABLES.entities).update(values).eq("id", input.id)).error);
    return input.id;
  }
  let existing: { id: number } | null = null;
  if (input.source && input.sourceId) {
    const result = await supabase.from(TABLES.entities).select("id").eq("source", input.source).eq("sourceId", input.sourceId).maybeSingle();
    fail(result.error); existing = result.data;
  } else {
    const result = await supabase.from(TABLES.entities).select("id").eq("name", input.name).eq("category", input.category).maybeSingle();
    fail(result.error); existing = result.data;
  }
  if (existing) {
    fail((await supabase.from(TABLES.entities).update(values).eq("id", existing.id)).error);
    return existing.id;
  }
  const result = await supabase.from(TABLES.entities).insert(values).select("id").single();
  fail(result.error); return result.data!.id;
}

export async function savePlayer(input: any) {
  const values = { name: input.name, position: normalizePlayerPosition(input.position), participantType: input.participantType, avatarUrl: input.avatarUrl ?? null, isActive: input.isActive };
  let playerId = input.id;
  if (playerId) fail((await supabase.from(TABLES.players).update(values).eq("id", playerId)).error);
  else {
    const result = await supabase.from(TABLES.players).insert(values).select("id").single();
    fail(result.error); playerId = result.data!.id;
  }
  if (input.participantType === "fixed" && input.seasonId) {
    fail((await supabase.from(TABLES.registrations).upsert({ seasonId: input.seasonId, playerId, footballEntityId: input.footballEntityId ?? null, isActive: input.isActive }, { onConflict: "seasonId,playerId" })).error);
  }
  return playerId;
}

export async function saveMatch(input: any) {
  const registeredParticipants = input.participants.filter((participant: any) => !participant.isGuest);
  const walkOnParticipants = input.participants.filter((participant: any) => participant.isGuest);
  const participantIds = registeredParticipants.map((participant: any) => participant.playerId);
  if (input.participants.length < 2 || new Set(participantIds).size !== participantIds.length) throw new Error("Cada jogador cadastrado pode estar em apenas um dos times.");
  if (walkOnParticipants.some((participant: any) => !participant.guestName?.trim())) throw new Error("Informe o nome de cada convidado.");
  const playersResult = participantIds.length ? await supabase.from(TABLES.players).select("id,participantType").in("id", participantIds) : { data: [], error: null };
  fail(playersResult.error);
  const playerById = new Map((playersResult.data ?? []).map(player => [player.id, player]));
  const participantById = new Map(registeredParticipants.map((participant: any) => [participant.playerId, participant]));
  const values = { seasonId: input.seasonId, matchDate: input.matchDate, blackScore: input.blackScore, redScore: input.redScore, notes: input.notes ?? null };
  let matchId = input.id;
  if (matchId) {
    fail((await supabase.from(TABLES.matches).update(values).eq("id", matchId)).error);
    fail((await supabase.from(TABLES.goals).delete().eq("matchId", matchId)).error);
    fail((await supabase.from(TABLES.participants).delete().eq("matchId", matchId)).error);
  } else {
    const result = await supabase.from(TABLES.matches).insert(values).select("id").single();
    fail(result.error); matchId = result.data!.id;
  }
  fail((await supabase.from(TABLES.participants).insert(input.participants.map((participant: any) => participant.isGuest ? ({ matchId, playerId: null, guestName: participant.guestName.trim(), invitedByName: participant.invitedByName?.trim() || null, teamColor: participant.teamColor, isGuest: true }) : ({ matchId, playerId: participant.playerId, guestName: null, invitedByName: null, teamColor: participant.teamColor, isGuest: playerById.get(participant.playerId)?.participantType === "guest" })))).error);
  const validGoals = input.goals.filter((goal: any) => goal.quantity > 0);
  if (validGoals.length) fail((await supabase.from(TABLES.goals).insert(validGoals.map((goal: any) => goal.isGuest ? ({ matchId, playerId: null, guestName: goal.guestName.trim(), teamColor: goal.teamColor, quantity: goal.quantity }) : ({ matchId, playerId: goal.playerId, guestName: null, teamColor: (participantById.get(goal.playerId) as any).teamColor, quantity: goal.quantity })))).error);
  return matchId;
}

export async function saveHighlight(input: any) {
  const participant = await supabase.from(TABLES.participants).select("id").eq("matchId", input.matchId).eq("playerId", input.playerId).maybeSingle();
  fail(participant.error);
  if (!participant.data) throw new Error("O destaque deve ser escolhido entre os jogadores da partida.");
  fail((await supabase.from(TABLES.highlights).upsert({ matchId: input.matchId, kind: input.kind, playerId: input.playerId, imageUrl: input.imageUrl ?? null, caption: input.caption ?? null }, { onConflict: "matchId,kind" })).error);
}

export async function saveGalleryItem(input: any) {
  const values = { seasonId: input.seasonId ?? null, matchId: input.matchId ?? null, mediaType: input.mediaType, mediaUrl: input.mediaUrl, mediaKey: input.mediaKey ?? null, caption: input.caption ?? null, capturedAt: input.capturedAt };
  if (input.id) fail((await supabase.from(TABLES.gallery).update(values).eq("id", input.id)).error);
  else fail((await supabase.from(TABLES.gallery).insert(values)).error);
}

function base64ToBlob(base64: string, mimeType: string) {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const bytes = Uint8Array.from(atob(clean), character => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

export async function uploadMedia(input: { base64: string; fileName: string; mimeType: string; folder: string }) {
  const extension = input.fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const key = `${input.folder}/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from("amigos-media").upload(key, base64ToBlob(input.base64, input.mimeType), { contentType: input.mimeType, upsert: false });
  fail(upload.error);
  const { data } = supabase.storage.from("amigos-media").getPublicUrl(key);
  return { key, url: data.publicUrl };
}

const COUNTRY_CODES: Record<string, { code: string; name: string }> = {
  brasil: { code: "br", name: "Brasil" }, brazil: { code: "br", name: "Brasil" }, argentina: { code: "ar", name: "Argentina" },
  portugal: { code: "pt", name: "Portugal" }, espanha: { code: "es", name: "Espanha" }, spain: { code: "es", name: "Espanha" },
  franca: { code: "fr", name: "França" }, france: { code: "fr", name: "França" }, alemanha: { code: "de", name: "Alemanha" }, germany: { code: "de", name: "Alemanha" },
  italia: { code: "it", name: "Itália" }, italy: { code: "it", name: "Itália" }, inglaterra: { code: "gb-eng", name: "Inglaterra" }, england: { code: "gb-eng", name: "Inglaterra" },
  uruguai: { code: "uy", name: "Uruguai" }, uruguay: { code: "uy", name: "Uruguai" }, chile: { code: "cl", name: "Chile" }, colombia: { code: "co", name: "Colômbia" },
  marrocos: { code: "ma", name: "Marrocos" }, morocco: { code: "ma", name: "Marrocos" }, mexico: { code: "mx", name: "México" },
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function getCountryBadge(term: string) {
  const country = COUNTRY_CODES[normalize(term)];
  return country ? { name: country.name, category: "national_team", badgeUrl: `https://flagcdn.com/w320/${country.code}.png`, source: "FlagCDN", sourceId: country.code.toUpperCase() } : null;
}

export async function searchFootballBadge(input: { term: string }) {
  const query = input.term.trim();
  if (query.length < 2) return [];
  const country = getCountryBadge(query);
  if (country) return [country];
  try {
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const payload = await response.json() as { teams?: Array<{ idTeam: string; strTeam: string; strBadge?: string; strTeamBadge?: string }> };
    return (payload.teams ?? []).slice(0, 5).map(team => ({ name: team.strTeam, category: "club", badgeUrl: team.strBadge ?? team.strTeamBadge ?? null, source: "TheSportsDB", sourceId: team.idTeam }));
  } catch {
    return [];
  }
}

export async function listAdminAccounts() {
  if (!await requireAdmin()) throw new Error("Faça login com uma conta administrativa.");
  const result = await supabase.from(TABLES.admins).select("id,userId,name,email,isActive,createdAt").order("createdAt");
  fail(result.error); return result.data ?? [];
}

export async function createAdminAccount(input: { name: string; email: string; password: string }) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error("Sua sessão administrativa expirou.");
  const response = await fetch("/api/create-admin", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Não foi possível criar o administrador.");
  return payload;
}

export async function setAdminAccountActive(input: { id: number; isActive: boolean }) {
  const current = await requireAdmin();
  if (!current) throw new Error("Sua sessão administrativa expirou.");
  if (current.id === input.id && !input.isActive) throw new Error("Você não pode desativar o próprio acesso.");
  fail((await supabase.from(TABLES.admins).update({ isActive: input.isActive }).eq("id", input.id)).error);
}
