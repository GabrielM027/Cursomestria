// Runs against an isolated in-memory PostgreSQL instance, never production.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
const db = new PGlite({ extensions: { pgcrypto } });
const ADMIN = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const migration = "20261101170150_selection_year_player_count.sql";
const query = async sql => (await db.query(sql)).rows;
const snapshot = async () => ({
  formations: await query('select * from public."selectionYearFormations" order by id'),
  overrides: await query('select * from public."selectionYearOverrides" order by id'),
});
try {
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects (id bigint,bucket_id text);
  `);
  const files = (await readdir(new URL("../supabase/migrations/", import.meta.url))).filter(file => file.endsWith(".sql")).sort();
  for (const file of files.filter(file => file !== migration)) await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
  await db.exec(`
    insert into auth.users (id) values ('${ADMIN}'),('${OTHER}');
    insert into public."adminProfiles" ("userId",name,email) values ('${ADMIN}','Admin fictício','admin@example.invalid');
    insert into public.seasons (id,name,year,"isActive") values (1,'Temporada fictícia',2099,true);
    insert into public.players (id,name,"participantType") select n,'Jogador fictício '||n,'fixed' from generate_series(1,11) n;
    insert into public."selectionYearFormations" ("seasonId","goalkeeperCount","defenderCount","midfielderCount","attackerCount") values (1,1,2,4,1);
    insert into public."selectionYearOverrides" ("seasonId",role,"slotNumber","playerId","fieldX","fieldY") values (1,'attacker',1,1,50,21);
  `);
  const before = await snapshot();
  await db.exec(await readFile(new URL(`../supabase/migrations/${migration}`, import.meta.url), "utf8"));
  assert.deepEqual(await snapshot(), before);
  console.log("✓ Migration preserves every existing formation and manual choice");
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${ADMIN}',false)`);
  for (const total of [1, 7, 8, 9, 10, 11]) {
    await db.exec(`update public."selectionYearFormations" set "defenderCount"=0,"midfielderCount"=${total - 1},"attackerCount"=0 where "seasonId"=1`);
    const saved = (await query('select "goalkeeperCount" + "defenderCount" + "midfielderCount" + "attackerCount" as total from public."selectionYearFormations"'))[0];
    assert.equal(saved.total, total);
  }
  await db.exec(`insert into public."selectionYearOverrides" ("seasonId",role,"slotNumber","playerId","fieldX","fieldY") values (1,'midfielder',10,11,50,50)`);
  assert.equal((await query('select count(*)::int as count from public."selectionYearOverrides"'))[0].count, 2);
  console.log("✓ Admin saves and reloads totals through 11 and slot 10");
  for (const sql of [
    'update public."selectionYearFormations" set "midfielderCount"=11 where "seasonId"=1',
    'update public."selectionYearFormations" set "goalkeeperCount"=2 where "seasonId"=1',
    'update public."selectionYearFormations" set "midfielderCount"=-1 where "seasonId"=1',
    'update public."selectionYearOverrides" set "slotNumber"=11',
  ]) await assert.rejects(db.exec(sql), /check constraint/);
  console.log("✓ Database rejects 12 players, invalid goalkeeper, negative count and slot 11");
  const saved = await snapshot();
  await db.exec(`select set_config('request.jwt.claim.sub','${OTHER}',false)`);
  await db.exec('update public."selectionYearFormations" set "midfielderCount"=2 where "seasonId"=1');
  assert.deepEqual(await snapshot(), saved);
  await assert.rejects(db.exec('insert into public."selectionYearOverrides" ("seasonId",role,"slotNumber","fieldX","fieldY") values (1,\'defender\',1,50,50)'), /row-level security/);
  await db.exec('set role anon');
  await assert.rejects(db.exec('update public."selectionYearFormations" set "midfielderCount"=2 where "seasonId"=1'), /permission denied/);
  assert.equal((await query('select "midfielderCount" from public."selectionYearFormations"'))[0].midfielderCount, 10);
  console.log("✓ Public reading works; non-admin writes remain blocked");
} finally {
  await db.close();
}
