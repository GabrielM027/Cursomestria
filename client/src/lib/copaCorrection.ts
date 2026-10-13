export type CopaStage = "quarterfinal" | "semifinal" | "final" | "third_place";
export type CopaFixture = {
  id: number;
  tournamentId: number;
  stage: CopaStage;
  slotNumber: number;
  status: string;
  homeEntrantId: number | null;
  awayEntrantId: number | null;
  winnerEntrantId: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
};
export type CopaParticipant = {
  id?: number;
  playerId: number | null;
  teamColor: "black" | "red";
  isGuest?: boolean;
  guestName: string | null;
  invitedByName: string | null;
  bestVotes: number;
  worstVotes: number;
};
export type CopaGoal = {
  id?: number;
  playerId: number | null;
  teamColor: "black" | "red";
  guestName: string | null;
  quantity: number;
};
export type CopaHighlight = {
  id?: number;
  kind: "best" | "worst";
  playerId: number;
};
export type CopaMatch = {
  id: number;
  copaFixtureId: number | null;
  blackScore: number;
  redScore: number;
  notes: string | null;
  matchDate: string;
  countsForStandings: boolean;
};
export type CopaCorrectionState = {
  revision: string;
  data: {
    tournament: { id: number; status: string };
    fixtures: CopaFixture[];
    matches: CopaMatch[];
    participants: CopaParticipant[];
    goals: CopaGoal[];
    highlights: CopaHighlight[];
  };
};
export type CopaMatchChanges = {
  blackScore?: number;
  redScore?: number;
  matchDate?: string;
  notes?: string | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  participants?: CopaParticipant[];
  goals?: CopaGoal[];
  highlights?: CopaHighlight[];
};

// Presentation preview only. The database independently validates the result under row locks.
export function previewCopaResult(
  state: CopaCorrectionState,
  fixtureId: number,
  matchId: number,
  blackScore: number,
  redScore: number
) {
  const fixture = state.data.fixtures.find(item => item.id === fixtureId)!;
  const finalLegs = state.data.fixtures.filter(item => item.stage === "final");
  const firstLeg =
    fixture.stage === "final" &&
    finalLegs.length === 2 &&
    fixture.slotNumber === 1;
  const secondLeg =
    fixture.stage === "final" &&
    finalLegs.length === 2 &&
    fixture.slotNumber === 2;
  const otherFixture = finalLegs.find(item => item.id !== fixture.id);
  const otherMatch = state.data.matches.find(
    item => item.copaFixtureId === otherFixture?.id && item.id !== matchId
  );
  const aggregateBlack = secondLeg
    ? blackScore + (otherMatch?.blackScore ?? 0)
    : blackScore;
  const aggregateRed = secondLeg
    ? redScore + (otherMatch?.redScore ?? 0)
    : redScore;
  return {
    firstLeg,
    secondLeg,
    aggregateBlack,
    aggregateRed,
    needsPenalties: !firstLeg && aggregateBlack === aggregateRed,
  };
}

// Only send edited fields. IDs match existing rows so unchanged metadata and media survive.
export function buildCopaChanges(
  state: CopaCorrectionState,
  fixtureId: number,
  matchId: number,
  values: {
    blackScore: number;
    redScore: number;
    matchDate?: string;
    notes?: string | null;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
    participants: CopaParticipant[];
    goals: CopaGoal[];
    highlights: CopaHighlight[];
  }
): CopaMatchChanges {
  const fixture = state.data.fixtures.find(item => item.id === fixtureId)!;
  const match = state.data.matches.find(item => item.id === matchId)!;
  const changes: CopaMatchChanges = {};
  if (values.matchDate !== undefined && values.matchDate !== match.matchDate)
    changes.matchDate = values.matchDate;
  if (values.notes !== undefined && values.notes !== match.notes)
    changes.notes = values.notes;
  if (values.blackScore !== match.blackScore)
    changes.blackScore = values.blackScore;
  if (values.redScore !== match.redScore) changes.redScore = values.redScore;
  if (values.homePenaltyScore !== fixture.homePenaltyScore)
    changes.homePenaltyScore = values.homePenaltyScore;
  if (values.awayPenaltyScore !== fixture.awayPenaltyScore)
    changes.awayPenaltyScore = values.awayPenaltyScore;
  const participants = (rows: CopaParticipant[]) =>
    rows.map(
      ({
        id,
        playerId,
        teamColor,
        guestName,
        invitedByName,
        bestVotes,
        worstVotes,
      }) => ({
        id,
        playerId,
        teamColor,
        guestName,
        invitedByName,
        bestVotes,
        worstVotes,
      })
    );
  const goals = (rows: CopaGoal[]) =>
    rows
      .map(({ id, playerId, teamColor, guestName, quantity }) => ({
        id,
        playerId,
        teamColor,
        guestName,
        quantity,
      }))
      .filter(row => row.quantity > 0);
  const highlights = (rows: CopaHighlight[]) =>
    rows.map(({ id, kind, playerId }) => ({ id, kind, playerId }));
  const equal = (a: unknown[], b: unknown[]) =>
    JSON.stringify(a) === JSON.stringify(b);
  if (
    !equal(
      participants(values.participants),
      participants(state.data.participants)
    )
  )
    changes.participants = participants(values.participants);
  if (!equal(goals(values.goals), goals(state.data.goals)))
    changes.goals = goals(values.goals);
  if (!equal(highlights(values.highlights), highlights(state.data.highlights)))
    changes.highlights = highlights(values.highlights);
  return changes;
}
