insert into public.seasons (id, name, year, "competitionLabel", "isActive", "createdAt", "updatedAt")
values (1, 'Temporada 2026', 2026, 'Pontos corridos', true, '2026-08-25T09:47:37.000Z', '2026-08-25T09:47:37.000Z')
on conflict (id) do update set name = excluded.name, year = excluded.year, "competitionLabel" = excluded."competitionLabel", "isActive" = excluded."isActive";

insert into public.players (id, name, "participantType", "avatarUrl", "avatarKey", "isActive", "createdAt", "updatedAt")
values (1, 'Gabriel Goleiro', 'fixed', null, null, true, '2026-08-25T09:48:26.000Z', '2026-08-25T09:48:26.000Z')
on conflict (id) do update set name = excluded.name, "participantType" = excluded."participantType", "avatarUrl" = excluded."avatarUrl", "isActive" = excluded."isActive";

insert into public."seasonRegistrations" (id, "seasonId", "playerId", "footballEntityId", "isActive", "createdAt", "updatedAt")
values (1, 1, 1, null, true, '2026-08-25T09:48:26.000Z', '2026-08-25T09:48:26.000Z')
on conflict ("seasonId", "playerId") do update set "footballEntityId" = excluded."footballEntityId", "isActive" = excluded."isActive";

select setval(pg_get_serial_sequence('public.seasons', 'id'), greatest((select coalesce(max(id), 1) from public.seasons), 1), true);
select setval(pg_get_serial_sequence('public.players', 'id'), greatest((select coalesce(max(id), 1) from public.players), 1), true);
select setval(pg_get_serial_sequence('public."seasonRegistrations"', 'id'), greatest((select coalesce(max(id), 1) from public."seasonRegistrations"), 1), true);
