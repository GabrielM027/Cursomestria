begin;

-- Widen the existing limits only: saved formations, votes and manual choices stay intact.
-- The existing goalkeeperCount = 1 check keeps one goalkeeper in every formation.
alter table public."selectionYearFormations"
  drop constraint "selectionYearFormations_defenderCount_check",
  drop constraint "selectionYearFormations_midfielderCount_check",
  drop constraint "selectionYearFormations_attackerCount_check",
  drop constraint "selectionYearFormations_check",
  add constraint "selectionYearFormations_defenderCount_check" check ("defenderCount" between 0 and 10),
  add constraint "selectionYearFormations_midfielderCount_check" check ("midfielderCount" between 0 and 10),
  add constraint "selectionYearFormations_attackerCount_check" check ("attackerCount" between 0 and 10),
  add constraint "selectionYearFormations_check" check ("defenderCount" + "midfielderCount" + "attackerCount" between 0 and 10);

alter table public."selectionYearOverrides"
  drop constraint if exists "selectionYearOverrides_slotNumber_check",
  drop constraint if exists selection_year_overrides_slot_number_check,
  add constraint selection_year_overrides_slot_number_check check ("slotNumber" between 1 and 10);

commit;
