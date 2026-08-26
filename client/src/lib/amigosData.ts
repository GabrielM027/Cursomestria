import { supabase, supabaseConfigured } from "./supabase";

type TeamColor = "black" | "red";
type ScoringMatch = {
  blackScore: number;
  redScore: number;
  countsForStandings?: boolean;
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
  copaTournaments: "copaTournaments",
  copaEntrants: "copaEntrants",
  copaFixtures: "copaFixtures",
  copaAudit: "copaAuditLogs",
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
  const totals = new Map<number, { points: number; wins: number; goals: number; goalBalance: number }>();
  const ensure = (playerId: number) => {
    const current = totals.get(playerId) ?? { points: 0, wins: 0, goals: 0, goalBalance: 0 };
    totals.set(playerId, current);
    return current;
  };
  for (const match of matches) {
    const winner = match.blackScore === match.redScore ? null : match.blackScore > match.redScore ? "black" : "red";
    const rankingPlayerIds = new Set(match.participants.filter(participant => !participant.isGuest && participant.playerId !== null).map(participant => participant.playerId));
    for (const participant of match.participants) {
      if (participant.isGuest || participant.playerId === null) continue;
      const total = ensure(participant.playerId);
      total.goalBalance += participant.teamColor === "black" ? match.blackScore - match.redScore : match.redScore - match.blackScore;
      if (match.countsForStandings !== false && winner === participant.teamColor) {
        total.points += 3;
        total.wins += 1;
      }
    }
    for (const goal of match.goals) if (goal.playerId !== null && rankingPlayerIds.has(goal.playerId)) ensure(goal.playerId).goals += goal.quantity;
  }
  return totals;
}

export function calculateHonorTotals(participants: Array<{ playerId: number | null; isGuest: boolean; bestVotes?: number | null; worstVotes?: number | null }>, highlights: Array<{ playerId: number; kind: "best" | "worst" }>) {
  const output = { best: new Map<number, { count: number; votes: number }>(), worst: new Map<number, { count: number; votes: number }>() };
  for (const highlight of highlights) {
    const current = output[highlight.kind].get(highlight.playerId) ?? { count: 0, votes: 0 };
    current.count += 1;
    output[highlight.kind].set(highlight.playerId, current);
  }
  for (const participant of participants) {
    if (participant.isGuest || participant.playerId === null) continue;
    for (const [kind, votes] of [["best", participant.bestVotes ?? 0], ["worst", participant.worstVotes ?? 0]] as const) {
      const current = output[kind].get(participant.playerId) ?? { count: 0, votes: 0 };
      current.votes += votes;
      output[kind].set(participant.playerId, current);
    }
  }
  return output;
}

export function groupHighlightsBySunday<T extends { matchDate: Date | string }>(highlights: T[]) {
  const groups = groupBy(highlights, highlight => typeof highlight.matchDate === "string" ? highlight.matchDate.slice(0, 10) : highlight.matchDate.toISOString().slice(0, 10));
  return Array.from(groups.entries()).sort(([first], [second]) => second.localeCompare(first)).map(([date, items]) => ({ date, items }));
}

export function visibleRankingRows<T>(rows: T[], showAll = false, limit = 8) {
  return showAll ? rows : rows.slice(0, limit);
}

export function normalizePlayerPosition(value?: string | null) {
  return value?.trim() || null;
}

type CopaPlanEntrant = { id: number };
type CopaFixturePlan = { stage: "quarterfinal" | "semifinal" | "final" | "third_place"; slotNumber: number; scheduledDate: string; homeEntrantId: number | null; awayEntrantId: number | null };

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function buildCopaFixturePlan(entrants: CopaPlanEntrant[], startDate: string, includeThirdPlace = false, random = Math.random): CopaFixturePlan[] {
  if (entrants.length !== 8) throw new Error("A Copa precisa de exatamente oito classificados.");
  const draw = [...entrants];
  for (let index = draw.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [draw[index], draw[swapIndex]] = [draw[swapIndex], draw[index]];
  }
  const fixtures: CopaFixturePlan[] = draw.reduce<CopaFixturePlan[]>((items, entrant, index) => {
    if (index % 2 === 0) items.push({ stage: "quarterfinal", slotNumber: index / 2 + 1, scheduledDate: addDays(startDate, (index / 2) * 7), homeEntrantId: entrant.id, awayEntrantId: draw[index + 1].id });
    return items;
  }, []);
  fixtures.push(
    { stage: "semifinal", slotNumber: 1, scheduledDate: addDays(startDate, 28), homeEntrantId: null, awayEntrantId: null },
    { stage: "semifinal", slotNumber: 2, scheduledDate: addDays(startDate, 35), homeEntrantId: null, awayEntrantId: null },
    { stage: "final", slotNumber: 1, scheduledDate: addDays(startDate, 42), homeEntrantId: null, awayEntrantId: null },
  );
  if (includeThirdPlace) fixtures.push({ stage: "third_place", slotNumber: 1, scheduledDate: addDays(startDate, 42), homeEntrantId: null, awayEntrantId: null });
  return fixtures;
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
    copa: null,
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
    countsForStandings: match.countsForStandings !== false,
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
    .map((player: any) => ({ ...playerInfo(player.id), ...(totals.get(player.id) ?? { points: 0, wins: 0, goals: 0, goalBalance: 0 }) }))
    .sort((a: any, b: any) => b.points - a.points || b.wins - a.wins || b.goals - a.goals || a.name.localeCompare(b.name));

  const scorers = Array.from(totals.entries())
    .filter(([, total]) => total.goals > 0)
    .map(([playerId, total]) => ({ ...playerInfo(playerId), goals: total.goals }))
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));

  const honorTotals = calculateHonorTotals(input.participantRows, input.highlightRows);
  const honorRankings = (["best", "worst"] as const).reduce((output, kind) => {
    output[kind] = Array.from(honorTotals[kind].entries()).map(([playerId, total]) => ({ ...playerInfo(playerId), ...total })).sort((a, b) => b.count - a.count || b.votes - a.votes || a.name.localeCompare(b.name));
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
  const entrantRows = input.copaEntrantRows ?? [];
  const fixtureRows = input.copaFixtureRows ?? [];
  const copaRows = input.copaRows ?? [];
  const currentCopa = copaRows.find((copa: any) => copa.status === "active" || copa.status === "paused") ?? copaRows.find((copa: any) => copa.status === "completed") ?? null;
  const copaEntrants = currentCopa ? entrantRows.filter((entrant: any) => entrant.tournamentId === currentCopa.id).map((entrant: any) => {
    const current = playerInfo(entrant.playerId);
    return { ...entrant, player: { ...current, name: current.name === "Jogador removido" ? entrant.playerNameSnapshot : current.name, avatarUrl: current.avatarUrl ?? entrant.avatarUrlSnapshot, entityName: current.entityName ?? entrant.entityNameSnapshot, entityBadgeUrl: current.entityBadgeUrl ?? entrant.entityBadgeUrlSnapshot } };
  }) : [];
  const entrantById = new Map(copaEntrants.map((entrant: any) => [entrant.id, entrant]));
  const copa = currentCopa ? { ...currentCopa, entrants: copaEntrants, fixtures: fixtureRows.filter((fixture: any) => fixture.tournamentId === currentCopa.id).sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate) || a.id - b.id).map((fixture: any) => ({ ...fixture, home: fixture.homeEntrantId ? entrantById.get(fixture.homeEntrantId) ?? null : null, away: fixture.awayEntrantId ? entrantById.get(fixture.awayEntrantId) ?? null : null, winner: fixture.winnerEntrantId ? entrantById.get(fixture.winnerEntrantId) ?? null : null, match: input.matchRows.find((match: any) => match.copaFixtureId === fixture.id) ?? null })) } : null;

  return {
    activeSeason: input.activeSeason,
    standings,
    scorers,
    honorRankings,
    matches: matchesWithDetails,
    feed,
    gallery: input.galleryRows,
    copa,
    home: {
      leader: standings[0] && standings[0].points > 0 ? standings[0] : null,
      leadingScorer: scorers[0] ?? null,
      featuredMatches,
      galleryPreview: input.galleryRows.slice(0, 3),
      latestMatch: matchesWithDetails[0] ?? null,
      stats: { matches: input.matchRows.length, goals: totalGoals },
      copa: copa?.status === "active" || copa?.status === "paused" ? copa : null,
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

  const [playersResult, entitiesResult, registrationsResult, matchesResult, galleryResult, copaResult] = await Promise.all([
    supabase.from(TABLES.players).select("*").order("name"),
    supabase.from(TABLES.entities).select("*").order("name"),
    supabase.from(TABLES.registrations).select("*").eq("seasonId", activeSeason.id),
    supabase.from(TABLES.matches).select("*").eq("seasonId", activeSeason.id).order("matchDate", { ascending: false }).order("id", { ascending: false }),
    supabase.from(TABLES.gallery).select("*").eq("seasonId", activeSeason.id).order("capturedAt", { ascending: false }).order("id", { ascending: false }),
    supabase.from(TABLES.copaTournaments).select("*").eq("seasonId", activeSeason.id).in("status", ["active", "paused", "completed"]).order("createdAt", { ascending: false }),
  ]);
  [playersResult, entitiesResult, registrationsResult, matchesResult, galleryResult, copaResult].forEach(result => fail(result.error));
  const matchRows = matchesResult.data ?? [];
  const matchIds = matchRows.map(match => match.id);
  let participantRows: any[] = [];
  let goalRows: any[] = [];
  let highlightRows: any[] = [];
  const copaRows = copaResult.data ?? [];
  let copaEntrantRows: any[] = [];
  let copaFixtureRows: any[] = [];
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
  if (copaRows.length) {
    const tournamentIds = copaRows.map(copa => copa.id);
    const [entrantsResult, fixturesResult] = await Promise.all([supabase.from(TABLES.copaEntrants).select("*").in("tournamentId", tournamentIds), supabase.from(TABLES.copaFixtures).select("*").in("tournamentId", tournamentIds)]);
    [entrantsResult, fixturesResult].forEach(result => fail(result.error));
    copaEntrantRows = entrantsResult.data ?? [];
    copaFixtureRows = fixturesResult.data ?? [];
  }
  return buildClubData({ activeSeason, allPlayers: playersResult.data ?? [], allEntities: entitiesResult.data ?? [], allRegistrations: registrationsResult.data ?? [], matchRows, participantRows, goalRows, highlightRows, galleryRows: galleryResult.data ?? [], copaRows, copaEntrantRows, copaFixtureRows });
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
  const [club, seasons, players, entities, registrations, copaTournaments, copaEntrants, copaFixtures, copaAudit] = await Promise.all([
    getPublicClubData(),
    selectAll(TABLES.seasons),
    selectAll(TABLES.players),
    selectAll(TABLES.entities),
    selectAll(TABLES.registrations),
    selectAll(TABLES.copaTournaments),
    selectAll(TABLES.copaEntrants),
    selectAll(TABLES.copaFixtures),
    selectAll(TABLES.copaAudit),
  ]);
  return { ...club, seasons: seasons.sort((a: any, b: any) => b.year - a.year), players: players.sort((a: any, b: any) => a.name.localeCompare(b.name)), entities: entities.sort((a: any, b: any) => a.name.localeCompare(b.name)), registrations, copaTournaments, copaEntrants, copaFixtures, copaAudit };
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

async function writeCopaAudit(tournamentId: number, action: string, reason?: string | null, beforeData?: unknown, afterData?: unknown) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Faça login com uma conta administrativa.");
  fail((await supabase.from(TABLES.copaAudit).insert({ tournamentId, action, reason: reason ?? null, beforeData: beforeData ?? null, afterData: afterData ?? null, performedBy: admin.userId })).error);
}

export async function createCopaTournament(input: { title: string; startDate: string }) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Faça login com uma conta administrativa.");
  const club = await getPublicClubData();
  if (!club.activeSeason) throw new Error("Ative uma temporada antes de criar a Copa.");
  const classified = club.standings.slice(0, 8);
  if (classified.length < 8) throw new Error("São necessários oito jogadores fixos ativos para criar a Copa.");
  const tournamentResult = await supabase.from(TABLES.copaTournaments).insert({ seasonId: club.activeSeason.id, title: input.title.trim() || `Copa ${club.activeSeason.year}`, status: "draft", startDate: input.startDate, createdBy: admin.userId }).select("*").single();
  fail(tournamentResult.error);
  const tournament = tournamentResult.data!;
  const entrantsPayload = classified.map((player: any, index: number) => ({ tournamentId: tournament.id, playerId: player.id, seed: index + 1, qualificationPoints: player.points, qualificationWins: player.wins, qualificationGoals: player.goals, playerNameSnapshot: player.name, avatarUrlSnapshot: player.avatarUrl ?? null, entityNameSnapshot: player.entityName ?? null, entityBadgeUrlSnapshot: player.entityBadgeUrl ?? null }));
  const entrantsResult = await supabase.from(TABLES.copaEntrants).insert(entrantsPayload).select("id");
  fail(entrantsResult.error);
  const fixtures = buildCopaFixturePlan(entrantsResult.data ?? [], input.startDate).map(fixture => ({ ...fixture, tournamentId: tournament.id, status: "scheduled" }));
  fail((await supabase.from(TABLES.copaFixtures).insert(fixtures)).error);
  await writeCopaAudit(tournament.id, "created", "Copa criada em rascunho com os oito melhores dos pontos corridos.", null, { classifiedPlayerIds: classified.map((player: any) => player.id), startDate: input.startDate });
  return tournament;
}

export async function setCopaTournamentStatus(input: { tournamentId: number; status: "active" | "paused" | "cancelled" | "completed"; reason?: string }) {
  const currentResult = await supabase.from(TABLES.copaTournaments).select("*").eq("id", input.tournamentId).single();
  fail(currentResult.error);
  const current = currentResult.data!;
  const updates: Record<string, unknown> = { status: input.status };
  if (input.status === "active" && !current.standingsFrozenAt) updates.standingsFrozenAt = new Date().toISOString();
  if (input.status === "cancelled") updates.cancelReason = input.reason?.trim() || "Cancelada pelo administrador";
  fail((await supabase.from(TABLES.copaTournaments).update(updates).eq("id", input.tournamentId)).error);
  await writeCopaAudit(input.tournamentId, `status_${input.status}`, input.reason, current, updates);
}

export async function updateCopaFixture(input: { fixtureId: number; scheduledDate?: string; homeEntrantId?: number | null; awayEntrantId?: number | null; notes?: string | null }) {
  const currentResult = await supabase.from(TABLES.copaFixtures).select("*").eq("id", input.fixtureId).single();
  fail(currentResult.error);
  const current = currentResult.data!;
  if (current.status === "completed") throw new Error("Este confronto já foi concluído. Corrija o resultado antes de editar a chave.");
  const updates = { scheduledDate: input.scheduledDate ?? current.scheduledDate, homeEntrantId: input.homeEntrantId ?? null, awayEntrantId: input.awayEntrantId ?? null, notes: input.notes ?? null };
  if (updates.homeEntrantId && updates.homeEntrantId === updates.awayEntrantId) throw new Error("Um capitão não pode enfrentar ele mesmo.");
  fail((await supabase.from(TABLES.copaFixtures).update(updates).eq("id", input.fixtureId)).error);
  await writeCopaAudit(current.tournamentId, "fixture_edited", "Chave ou data alterada manualmente.", current, updates);
}

export async function postponeCopaTournament(input: { tournamentId: number; fromDate: string; reason?: string }) {
  const fixturesResult = await supabase.from(TABLES.copaFixtures).select("*").eq("tournamentId", input.tournamentId).neq("status", "completed").gte("scheduledDate", input.fromDate);
  fail(fixturesResult.error);
  const fixtures = fixturesResult.data ?? [];
  for (const fixture of fixtures) fail((await supabase.from(TABLES.copaFixtures).update({ scheduledDate: addDays(fixture.scheduledDate, 7), status: fixture.status === "scheduled" ? "postponed" : fixture.status }).eq("id", fixture.id)).error);
  await writeCopaAudit(input.tournamentId, "fixtures_postponed", input.reason || "Pelada cancelada; chave empurrada uma semana.", fixtures, { fromDate: input.fromDate, delayedFixtures: fixtures.length });
}

export async function resolveCopaFixture(input: { fixtureId: number; matchId: number; blackScore: number; redScore: number; homePenaltyScore?: number; awayPenaltyScore?: number }) {
  const fixtureResult = await supabase.from(TABLES.copaFixtures).select("*").eq("id", input.fixtureId).single();
  fail(fixtureResult.error);
  const fixture = fixtureResult.data!;
  if (!fixture.homeEntrantId || !fixture.awayEntrantId) throw new Error("Defina os dois capitães antes de encerrar esse confronto.");
  const tied = input.blackScore === input.redScore;
  if (tied && (input.homePenaltyScore === undefined || input.awayPenaltyScore === undefined || input.homePenaltyScore === input.awayPenaltyScore)) throw new Error("Em empate, informe um placar de pênaltis com vencedor definido.");
  const homeWon = tied ? Number(input.homePenaltyScore) > Number(input.awayPenaltyScore) : input.blackScore > input.redScore;
  const winnerEntrantId = homeWon ? fixture.homeEntrantId : fixture.awayEntrantId;
  const updates = { status: "completed", winnerEntrantId, homePenaltyScore: tied ? input.homePenaltyScore : null, awayPenaltyScore: tied ? input.awayPenaltyScore : null };
  fail((await supabase.from(TABLES.copaFixtures).update(updates).eq("id", fixture.id)).error);
  fail((await supabase.from(TABLES.matches).update({ copaFixtureId: fixture.id, countsForStandings: false }).eq("id", input.matchId)).error);
  const nextStage = fixture.stage === "quarterfinal" ? "semifinal" : fixture.stage === "semifinal" ? "final" : null;
  if (nextStage) {
    const nextSlot = fixture.stage === "quarterfinal" ? Math.ceil(fixture.slotNumber / 2) : 1;
    const nextResult = await supabase.from(TABLES.copaFixtures).select("*").eq("tournamentId", fixture.tournamentId).eq("stage", nextStage).eq("slotNumber", nextSlot).single();
    fail(nextResult.error);
    const field = fixture.slotNumber % 2 === 1 ? "homeEntrantId" : "awayEntrantId";
    fail((await supabase.from(TABLES.copaFixtures).update({ [field]: winnerEntrantId }).eq("id", nextResult.data!.id)).error);
  } else if (fixture.stage === "final") {
    await setCopaTournamentStatus({ tournamentId: fixture.tournamentId, status: "completed", reason: "Final concluída." });
  }
  await writeCopaAudit(fixture.tournamentId, "fixture_resolved", "Confronto encerrado e chave atualizada.", fixture, { ...updates, matchId: input.matchId });
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
  const values = { seasonId: input.seasonId, matchDate: input.matchDate, blackScore: input.blackScore, redScore: input.redScore, notes: input.notes ?? null, countsForStandings: input.countsForStandings !== false, copaFixtureId: input.copaFixtureId ?? null };
  let matchId = input.id;
  if (matchId) {
    fail((await supabase.from(TABLES.matches).update(values).eq("id", matchId)).error);
    fail((await supabase.from(TABLES.goals).delete().eq("matchId", matchId)).error);
    fail((await supabase.from(TABLES.participants).delete().eq("matchId", matchId)).error);
  } else {
    const result = await supabase.from(TABLES.matches).insert(values).select("id").single();
    fail(result.error); matchId = result.data!.id;
  }
  fail((await supabase.from(TABLES.participants).insert(input.participants.map((participant: any) => participant.isGuest ? ({ matchId, playerId: null, guestName: participant.guestName.trim(), invitedByName: participant.invitedByName?.trim() || null, teamColor: participant.teamColor, isGuest: true, bestVotes: 0, worstVotes: 0 }) : ({ matchId, playerId: participant.playerId, guestName: null, invitedByName: null, teamColor: participant.teamColor, isGuest: playerById.get(participant.playerId)?.participantType === "guest", bestVotes: Math.max(0, Number(participant.bestVotes || 0)), worstVotes: Math.max(0, Number(participant.worstVotes || 0)) })))).error);
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

export async function deleteGalleryItem(input: { id: number }) {
  if (!await requireAdmin()) throw new Error("Faça login com uma conta administrativa.");
  const itemResult = await supabase.from(TABLES.gallery).select("mediaKey").eq("id", input.id).single();
  fail(itemResult.error);
  fail((await supabase.from(TABLES.gallery).delete().eq("id", input.id)).error);
  if (itemResult.data?.mediaKey) await supabase.storage.from("amigos-media").remove([itemResult.data.mediaKey]);
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
