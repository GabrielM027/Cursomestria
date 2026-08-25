alter table public."matchParticipants"
  alter column "playerId" drop not null,
  add column if not exists "guestName" varchar(120),
  add column if not exists "invitedByName" varchar(120);

alter table public."matchGoals"
  alter column "playerId" drop not null,
  add column if not exists "guestName" varchar(120);
