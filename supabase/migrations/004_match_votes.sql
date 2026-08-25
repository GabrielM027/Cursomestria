alter table public."matchParticipants"
  add column if not exists "bestVotes" integer not null default 0 check ("bestVotes" >= 0),
  add column if not exists "worstVotes" integer not null default 0 check ("worstVotes" >= 0);
