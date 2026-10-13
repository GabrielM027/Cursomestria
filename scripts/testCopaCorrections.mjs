// An in-memory PostgreSQL database; this runner has no URL, network or production credentials.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
const root = fileURLToPath(new URL("../", import.meta.url));
const ADMIN = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const db = new PGlite({ extensions: { pgcrypto } });
const query = async (sql, args = []) => (await db.query(sql, args)).rows;
const scalar = async (sql, args = []) =>
  Object.values((await query(sql, args))[0])[0];
let passed = 0;
async function test(name, fn) {
  await db.exec("BEGIN");
  try {
    await fn();
    passed++;
    console.log(`✓ ${name}`);
  } finally {
    await db.exec("ROLLBACK");
  }
}
async function seed() {
  await db.exec(`
    insert into auth.users (id) values ('${ADMIN}'),('${OTHER}');
    insert into public."adminProfiles" ("userId",name,email) values ('${ADMIN}','Admin fictício','admin@example.invalid');
    insert into public.seasons (id,name,year,"isActive") values (1,'Temporada fictícia',2099,true);
    insert into public.players (id,name,"participantType") select n,'Jogador fictício '||n,'fixed' from generate_series(1,8) n;
    insert into public."copaTournaments" (id,"seasonId",title,status,"startDate","standingsFrozenAt") values (1,1,'Copa fictícia','active','2099-01-04',now());
    insert into public."copaEntrants" (id,"tournamentId","playerId",seed,"playerNameSnapshot") select 200+n,1,n,n,'Capitão fictício '||n from generate_series(1,8) n;
    insert into public."copaFixtures" (id,"tournamentId",stage,"slotNumber","scheduledDate","homeEntrantId","awayEntrantId") values
      (101,1,'quarterfinal',1,'2099-01-04',201,208),(102,1,'quarterfinal',2,'2099-01-11',202,207),
      (103,1,'quarterfinal',3,'2099-01-18',203,206),(104,1,'quarterfinal',4,'2099-01-25',204,205),
      (105,1,'semifinal',1,'2099-02-01',201,204),(106,1,'semifinal',2,'2099-02-08',202,203),
      (107,1,'final',1,'2099-02-15',201,202),(108,1,'final',2,'2099-02-22',201,202);
    insert into public.matches (id,"seasonId","matchDate","blackScore","redScore",notes,"countsForStandings") values (301,1,'2099-01-04',2,1,'Nota preservada',false);
    insert into public."matchParticipants" (id,"matchId","playerId","teamColor","bestVotes","worstVotes") values (401,301,1,'black',7,0),(402,301,8,'red',1,4);
    insert into public."matchParticipants" (id,"matchId","playerId","guestName","invitedByName","teamColor","isGuest") values (403,301,null,'Convidado fictício','Anfitrião fictício','black',true);
    insert into public."matchGoals" (id,"matchId","playerId","teamColor",quantity) values (501,301,1,'black',2),(502,301,8,'red',1);
    insert into public."roundHighlights" (id,"matchId",kind,"playerId","imageUrl","imageKey",caption) values
      (601,301,'best',1,'https://example.invalid/best.jpg','keep-best','Legenda melhor'),(602,301,'worst',8,'https://example.invalid/worst.jpg','keep-worst','Legenda pior');
  `);
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${ADMIN}',false)`
  );
}
async function state(fixture = 101, match = 301) {
  return await scalar("select public.get_copa_match_state($1,$2)", [
    fixture,
    match,
  ]);
}
async function apply(
  fixture,
  match,
  changes = {},
  correction = true,
  revision = null,
  reason = "Correção fictícia confirmada"
) {
  const expected = revision ?? (await state(fixture, match)).revision;
  return await scalar(
    "select public.save_copa_match_result($1,$2,$3,$4::jsonb,$5,$6)",
    [fixture, match, expected, JSON.stringify(changes), reason, correction]
  );
}
async function reject(fn, pattern) {
  await db.exec("SAVEPOINT rejection");
  try {
    await assert.rejects(fn, pattern);
  } finally {
    await db.exec(
      "ROLLBACK TO SAVEPOINT rejection; RELEASE SAVEPOINT rejection"
    );
  }
}
async function completeQuarter() {
  await seed();
  await apply(101, 301, {}, false);
}
async function addMatch(id, fixture, black, red, complete = true) {
  await db.exec("reset role");
  await db.query(
    'insert into public.matches (id,"seasonId","matchDate","blackScore","redScore","countsForStandings") values ($1,1,\'2099-02-01\',$2,$3,false)',
    [id, black, red]
  );
  await db.query(
    'insert into public."matchParticipants" ("matchId","playerId","teamColor") values ($1,1,\'black\'),($1,8,\'red\')',
    [id]
  );
  await db.exec("set role authenticated");
  if (complete) await apply(fixture, id, {}, false);
}
try {
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects (id bigint,bucket_id text);
  `);
  for (const file of (await readdir(`${root}supabase/migrations`))
    .filter(file => file.endsWith(".sql"))
    .sort()) {
    await db.exec(await readFile(`${root}supabase/migrations/${file}`, "utf8"));
  }
  await test("capitães: inverter cores recalcula vencedor sem alterar placar ou estatísticas", async () => {
    await completeQuarter();
    const before = (await state()).data;
    await apply(101, 301, { homeEntrantId: 208, awayEntrantId: 201 });
    const after = (await state()).data;
    const fixture = after.fixtures.find(f => f.id === 101);
    assert.equal(fixture.homeEntrantId, 208);
    assert.equal(fixture.awayEntrantId, 201);
    assert.equal(fixture.winnerEntrantId, 208);
    assert.equal(after.fixtures.find(f => f.id === 105).homeEntrantId, 208);
    for (const key of [
      "matches",
      "participants",
      "goals",
      "highlights",
      "entrants",
    ])
      assert.deepEqual(after[key], before[key]);
    const log = (
      await query(
        "select * from public.\"copaAuditLogs\" where action='match_corrected'"
      )
    )[0];
    assert.equal(
      log.beforeData.state.fixtures.find(f => f.id === 101).homeEntrantId,
      201
    );
    assert.equal(
      log.afterData.state.fixtures.find(f => f.id === 101).homeEntrantId,
      208
    );
    assert.equal(log.performedBy, ADMIN);
  });
  await test("capitães: inverter cores no empate usa os pênaltis da cor correta", async () => {
    await completeQuarter();
    await apply(101, 301, {
      blackScore: 1,
      redScore: 1,
      homePenaltyScore: 3,
      awayPenaltyScore: 4,
    });
    await apply(101, 301, { homeEntrantId: 208, awayEntrantId: 201 });
    const fixture = (await state()).data.fixtures.find(f => f.id === 101);
    assert.equal(fixture.winnerEntrantId, 201);
    assert.equal(fixture.homePenaltyScore, 3);
    assert.equal(fixture.awayPenaltyScore, 4);
  });
  await test("capitães: rejeita duplicados, IDs inválidos e capitães de outra Copa", async () => {
    await completeQuarter();
    const before = await state();
    for (const changes of [
      { homeEntrantId: 208 },
      { homeEntrantId: 0 },
      { homeEntrantId: null },
      { homeEntrantId: 9999 },
      { homeEntrantId: 1.5 },
    ]) {
      await reject(() => apply(101, 301, changes), /capitães/);
    }
    await db.exec(
      'reset role; insert into public."copaTournaments" (id,"seasonId",title,status,"startDate") values (2,1,\'Outra Copa fictícia\',\'cancelled\',\'2099-01-01\'); insert into public."copaEntrants" (id,"tournamentId","playerId",seed,"playerNameSnapshot") values (999,2,2,1,\'Outro capitão fictício\'); set role authenticated'
    );
    await reject(() => apply(101, 301, { homeEntrantId: 999 }), /desta Copa/);
    assert.deepEqual(await state(), before);
  });
  await test("capitães: semifinal invertida atualiza os dois jogos da final", async () => {
    await seed();
    await addMatch(305, 105, 2, 1);
    const before = (await state(105, 305)).data;
    await apply(105, 305, { homeEntrantId: 204, awayEntrantId: 201 });
    const after = (await state(105, 305)).data;
    assert.equal(after.fixtures.find(f => f.id === 105).winnerEntrantId, 204);
    assert.equal(
      after.fixtures.filter(
        f =>
          f.stage === "final" &&
          f.homeEntrantId === 204 &&
          f.awayEntrantId === 202
      ).length,
      2
    );
    for (const key of ["matches", "participants", "goals", "highlights"])
      assert.deepEqual(after[key], before[key]);
  });
  await test("capitães: bloqueia inversão das quartas com semifinal concluída e reverte tudo", async () => {
    await completeQuarter();
    await addMatch(305, 105, 2, 0);
    const before = await state();
    const logs = await query('select * from public."copaAuditLogs"');
    await reject(
      () => apply(101, 301, { homeEntrantId: 208, awayEntrantId: 201 }),
      /semifinal.*resultado/
    );
    assert.deepEqual(await state(), before);
    assert.deepEqual(await query('select * from public."copaAuditLogs"'), logs);
  });
  await test("capitães: bloqueia semifinal invertida com final já concluída", async () => {
    await seed();
    await addMatch(305, 105, 2, 0);
    await addMatch(307, 107, 2, 0);
    const before = await state(105, 305);
    await reject(
      () => apply(105, 305, { homeEntrantId: 204, awayEntrantId: 201 }),
      /final.*resultado/
    );
    assert.deepEqual(await state(105, 305), before);
  });
  await test("capitães: alteração que mantém o vencedor preserva fases posteriores concluídas", async () => {
    await completeQuarter();
    await addMatch(305, 105, 2, 0);
    const before = (await state()).data;
    await apply(101, 301, { awayEntrantId: 207 });
    const after = (await state()).data;
    assert.equal(after.fixtures.find(f => f.id === 101).winnerEntrantId, 201);
    assert.deepEqual(
      after.fixtures.filter(f => f.id !== 101),
      before.fixtures.filter(f => f.id !== 101)
    );
    assert.deepEqual(after.matches, before.matches);
  });
  await test("capitães: correção do Jogo 1 alinha o Jogo 2 ainda não disputado", async () => {
    await seed();
    await addMatch(307, 107, 2, 1);
    const before = (await state(107, 307)).data;
    await apply(107, 307, { homeEntrantId: 202, awayEntrantId: 201 });
    const after = (await state(107, 307)).data;
    assert.equal(
      after.fixtures.filter(
        f =>
          f.stage === "final" &&
          f.homeEntrantId === 202 &&
          f.awayEntrantId === 201
      ).length,
      2
    );
    assert.equal(after.fixtures.find(f => f.id === 107).winnerEntrantId, null);
    assert.deepEqual(after.matches, before.matches);
  });
  await test("capitães: não troca capitães do Jogo 1 após o Jogo 2 concluído", async () => {
    await seed();
    await addMatch(307, 107, 2, 0);
    await addMatch(308, 108, 0, 1);
    const before = await state(107, 307);
    await reject(
      () => apply(107, 307, { homeEntrantId: 202, awayEntrantId: 201 }),
      /Jogo 2.*resultado/
    );
    assert.deepEqual(await state(107, 307), before);
  });
  await test("capitães: Jogo 2 invertido soma o agregado por finalista e preserva o Jogo 1", async () => {
    await seed();
    await addMatch(307, 107, 1, 4);
    await addMatch(308, 108, 4, 0);
    const before = (await state(108, 308)).data;
    assert.equal(before.fixtures.find(f => f.id === 108).winnerEntrantId, 201);
    await apply(108, 308, { homeEntrantId: 202, awayEntrantId: 201 });
    const after = (await state(108, 308)).data;
    assert.equal(after.fixtures.find(f => f.id === 108).winnerEntrantId, 202);
    assert.deepEqual(
      after.fixtures.find(f => f.id === 107),
      before.fixtures.find(f => f.id === 107)
    );
    assert.deepEqual(after.matches, before.matches);
    assert.deepEqual(after.tournament, before.tournament);
  });
  await test("capitães: inversão da volta com agregado empatado exige pênaltis", async () => {
    await seed();
    await addMatch(307, 107, 2, 0);
    await addMatch(308, 108, 2, 0);
    const before = await state(108, 308);
    await reject(
      () => apply(108, 308, { homeEntrantId: 202, awayEntrantId: 201 }),
      /pênaltis/
    );
    assert.deepEqual(await state(108, 308), before);
    await apply(108, 308, {
      homeEntrantId: 202,
      awayEntrantId: 201,
      homePenaltyScore: 5,
      awayPenaltyScore: 4,
    });
    assert.equal(
      (await state(108, 308)).data.fixtures.find(f => f.id === 108)
        .winnerEntrantId,
      202
    );
  });
  await test("capitães: não substitui os finalistas da volta por pessoas que não jogaram a ida", async () => {
    await seed();
    await addMatch(307, 107, 2, 0);
    await addMatch(308, 108, 0, 1);
    const before = await state(108, 308);
    await reject(
      () => apply(108, 308, { homeEntrantId: 204 }),
      /mesmos dois finalistas/
    );
    assert.deepEqual(await state(108, 308), before);
  });
  await test("quartas: troca vencedor e atualiza apenas o lado correspondente da semifinal", async () => {
    await completeQuarter();
    const before = (await state()).data;
    await apply(101, 301, { blackScore: 1, redScore: 3 });
    const after = (await state()).data;
    assert.equal(after.fixtures.find(f => f.id === 101).winnerEntrantId, 208);
    assert.equal(after.fixtures.find(f => f.id === 105).homeEntrantId, 208);
    assert.equal(after.fixtures.find(f => f.id === 105).awayEntrantId, 204);
    assert.deepEqual(after.participants, before.participants);
    assert.deepEqual(after.goals, before.goals);
    assert.deepEqual(after.highlights, before.highlights);
    assert.equal(after.matches[0].countsForStandings, false);
    assert.equal(after.matches[0].notes, "Nota preservada");
    assert.deepEqual(
      after.fixtures.filter(f => ![101, 105].includes(f.id)),
      before.fixtures.filter(f => ![101, 105].includes(f.id))
    );
  });
  for (const [slot, next, field, winner] of [
    [2, 106, "homeEntrantId", 207],
    [3, 106, "awayEntrantId", 206],
    [4, 105, "awayEntrantId", 205],
  ]) {
    await test(`quartas ${slot}: respeita o cruzamento original`, async () => {
      await seed();
      await addMatch(300 + slot, 100 + slot, 2, 1);
      await apply(100 + slot, 300 + slot, { blackScore: 0, redScore: 2 });
      assert.equal(
        await scalar(
          `select "${field}" from public."copaFixtures" where id=$1`,
          [next]
        ),
        winner
      );
    });
  }
  await test("semifinal: troca o finalista nos dois jogos da final", async () => {
    await seed();
    await addMatch(305, 105, 2, 1);
    await apply(105, 305, { blackScore: 0, redScore: 2 });
    assert.deepEqual(
      await query(
        'select "homeEntrantId","awayEntrantId" from public."copaFixtures" where stage=\'final\' order by id'
      ),
      [
        { homeEntrantId: 204, awayEntrantId: 202 },
        { homeEntrantId: 204, awayEntrantId: 202 },
      ]
    );
  });
  await test("segunda semifinal: troca o lado vermelho nos dois jogos", async () => {
    await seed();
    await addMatch(306, 106, 2, 1);
    await apply(106, 306, { blackScore: 0, redScore: 2 });
    assert.equal(
      await scalar(
        'select count(*)::int from public."copaFixtures" where stage=\'final\' and "awayEntrantId"=203'
      ),
      2
    );
  });
  await test("pênaltis nas quartas: exige vencedor e não soma pênaltis a gols", async () => {
    await completeQuarter();
    await reject(
      () => apply(101, 301, { blackScore: 1, redScore: 1 }),
      /pênaltis/
    );
    await reject(
      () =>
        apply(101, 301, {
          blackScore: 1,
          redScore: 1,
          homePenaltyScore: 4,
          awayPenaltyScore: 4,
        }),
      /pênaltis/
    );
    await apply(101, 301, {
      blackScore: 1,
      redScore: 1,
      homePenaltyScore: 3,
      awayPenaltyScore: 4,
    });
    assert.equal(
      await scalar(
        'select "winnerEntrantId" from public."copaFixtures" where id=101'
      ),
      208
    );
    assert.equal(
      await scalar(
        'select sum(quantity)::int from public."matchGoals" where "matchId"=301'
      ),
      3
    );
    await apply(101, 301, { blackScore: 5 });
    assert.equal(
      await scalar(
        'select "homePenaltyScore" from public."copaFixtures" where id=101'
      ),
      null
    );
  });
  await test("final: Jogo 1 não define campeão; Jogo 2 considera o agregado", async () => {
    await seed();
    await addMatch(307, 107, 3, 0);
    assert.equal(
      await scalar(
        'select "winnerEntrantId" from public."copaFixtures" where id=107'
      ),
      null
    );
    await addMatch(308, 108, 0, 2);
    assert.equal(
      await scalar(
        'select "winnerEntrantId" from public."copaFixtures" where id=108'
      ),
      201
    );
    assert.equal(
      await scalar('select status from public."copaTournaments" where id=1'),
      "completed"
    );
    await apply(108, 308, { redScore: 4 });
    assert.equal(
      await scalar(
        'select "winnerEntrantId" from public."copaFixtures" where id=108'
      ),
      202
    );
    assert.equal(
      await scalar('select status from public."copaTournaments" where id=1'),
      "completed"
    );
  });
  await test("final: empate agregado exige pênaltis mesmo se Jogo 2 não empatar", async () => {
    await seed();
    await addMatch(307, 107, 2, 0);
    await addMatch(308, 108, 0, 1);
    await reject(() => apply(108, 308, { redScore: 2 }), /pênaltis/);
    await apply(108, 308, {
      redScore: 2,
      homePenaltyScore: 5,
      awayPenaltyScore: 6,
    });
    assert.equal(
      await scalar(
        'select "winnerEntrantId" from public."copaFixtures" where id=108'
      ),
      202
    );
  });
  await test("final: empate no Jogo 2 não exige pênaltis se agregado desempata", async () => {
    await seed();
    await addMatch(307, 107, 2, 0);
    await addMatch(308, 108, 1, 1);
    await apply(108, 308, { blackScore: 2, redScore: 2 });
    assert.equal(
      await scalar(
        'select "winnerEntrantId" from public."copaFixtures" where id=108'
      ),
      201
    );
  });
  await test("Jogo 1 corrigível antes da volta; bloqueia placar após volta e permite votos", async () => {
    await seed();
    await addMatch(307, 107, 3, 0);
    await apply(107, 307, { blackScore: 4 });
    await addMatch(308, 108, 0, 1);
    const before = await state(107, 307);
    await reject(() => apply(107, 307, { blackScore: 1 }), /Jogo 2.*concluído/);
    assert.deepEqual(await state(107, 307), before);
    const participant = before.data.participants[0];
    await apply(107, 307, {
      participants: before.data.participants.map(p => ({
        id: p.id,
        bestVotes: p.id === participant.id ? 5 : p.bestVotes,
      })),
    });
    assert.equal((await state(107, 307)).data.participants[0].bestVotes, 5);
  });
  await test("final: impede registrar volta antes do Jogo 1", async () => {
    await seed();
    await addMatch(308, 108, 0, 2, false);
    await reject(() => apply(108, 308, {}, false), /Jogo 1/);
  });
  await test("bloqueia troca de vencedor das quartas se semifinal concluída; rollback integral", async () => {
    await completeQuarter();
    await addMatch(305, 105, 2, 0);
    const before = await state();
    const audit = await query('select * from public."copaAuditLogs"');
    await reject(
      () =>
        apply(101, 301, {
          blackScore: 0,
          redScore: 4,
          goals: [
            { id: 501, quantity: 1 },
            { id: 502, quantity: 4 },
          ],
        }),
      /semifinal.*resultado/
    );
    assert.deepEqual(await state(), before);
    assert.deepEqual(
      await query('select * from public."copaAuditLogs"'),
      audit
    );
    await apply(101, 301, { blackScore: 4 }); // Same winner remains safe.
  });
  for (const leg of [107, 108])
    await test(`bloqueia semifinal se final ${leg - 106} tiver resultado`, async () => {
      await seed();
      await addMatch(305, 105, 2, 0);
      await addMatch(307, 107, 2, 0);
      if (leg === 108) await addMatch(308, 108, 0, 1);
      const before = await state(105, 305);
      await reject(
        () => apply(105, 305, { blackScore: 0, redScore: 2 }),
        /final.*resultado/
      );
      assert.deepEqual(await state(105, 305), before);
    });
  await test("preserva fotos, legendas e IDs ao corrigir gols, votos e Melhor/Pior", async () => {
    await completeQuarter();
    const before = (await state()).data;
    await apply(101, 301, {
      participants: [
        { id: 401, bestVotes: 9 },
        { id: 402, worstVotes: 7 },
        { id: 403 },
      ],
      goals: [{ id: 501, quantity: 3 }, { id: 502 }],
      highlights: [
        { id: 601, kind: "best", playerId: 8 },
        { id: 602, kind: "worst", playerId: 1 },
      ],
    });
    const after = (await state()).data;
    assert.equal(after.participants[0].bestVotes, 9);
    assert.equal(after.goals[0].quantity, 3);
    assert.equal(after.highlights[0].playerId, 8);
    for (let i = 0; i < 2; i++)
      for (const field of [
        "id",
        "imageUrl",
        "imageKey",
        "caption",
        "createdAt",
      ])
        assert.equal(after.highlights[i][field], before.highlights[i][field]);
    assert.deepEqual(after.participants[2], before.participants[2]);
    assert.deepEqual(after.goals[1], before.goals[1]);
    const log = (
      await query(
        "select * from public.\"copaAuditLogs\" where action='match_corrected'"
      )
    )[0];
    assert.equal(log.performedBy, ADMIN);
    assert.ok(log.createdAt);
    assert.equal(log.reason, "Correção fictícia confirmada");
    assert.deepEqual(log.beforeData.state, before);
    assert.deepEqual(log.afterData.state, after);
  });
  await test("escalação: troca jogador junto de gols/destaques, mantém IDs", async () => {
    await completeQuarter();
    await apply(101, 301, {
      participants: [{ id: 401, playerId: 2 }, { id: 402 }, { id: 403 }],
      goals: [{ id: 501, playerId: 2 }, { id: 502 }],
      highlights: [
        { id: 601, kind: "best", playerId: 2 },
        { id: 602, kind: "worst", playerId: 8 },
      ],
    });
    const data = (await state()).data;
    assert.equal(data.participants[0].playerId, 2);
    assert.equal(data.goals[0].id, 501);
    assert.equal(data.highlights[0].id, 601);
  });
  await test("troca válida entre jogadores/gols preserva IDs sem conflito de unicidade", async () => {
    await completeQuarter();
    const before = (await state()).data;
    await apply(101, 301, {
      participants: [
        { id: 401, playerId: 8 },
        { id: 402, playerId: 1 },
        { id: 403 },
      ],
      goals: [
        { id: 501, playerId: 8 },
        { id: 502, playerId: 1 },
      ],
    });
    const after = (await state()).data;
    assert.equal(after.participants[0].playerId, 8);
    assert.equal(after.participants[1].playerId, 1);
    assert.equal(after.goals[0].playerId, 8);
    assert.equal(after.goals[1].playerId, 1);
    for (let i = 0; i < 2; i++) {
      assert.equal(after.participants[i].id, before.participants[i].id);
      assert.equal(
        after.participants[i].createdAt,
        before.participants[i].createdAt
      );
      assert.equal(after.goals[i].id, before.goals[i].id);
    }
  });
  await test("validação: rejeita gols/destaques órfãos, IDs de outra partida e dados inválidos", async () => {
    await completeQuarter();
    const before = await state();
    await reject(
      () =>
        apply(101, 301, {
          participants: [{ id: 401, playerId: 2 }, { id: 402 }, { id: 403 }],
        }),
      /gols/
    );
    await reject(
      () => apply(101, 301, { goals: [{ id: 999, quantity: 1 }] }),
      /não pertence/
    );
    await reject(
      () => apply(101, 301, { participants: [{ id: 401 }, { id: 401 }] }),
      /repetido/
    );
    await reject(() => apply(101, 301, { blackScore: -1 }), /inteiro/);
    await reject(() => apply(101, 301, { blackScore: 1.5 }), /inteiro/);
    await reject(
      () => apply(101, 301, { countsForStandings: true }),
      /não permitido/
    );
    await reject(() => apply(101, 301, {}, true, null, "x"), /motivo/);
    assert.deepEqual(await state(), before);
  });
  await test("preserva estatísticas antigas não editadas mesmo se o cadastro legado estiver incompleto", async () => {
    await seed();
    await db.exec(
      'update public."roundHighlights" set "playerId"=2 where id=601'
    );
    await apply(101, 301, {}, false);
    const before = (await state()).data;
    await apply(101, 301, { redScore: 3 });
    assert.deepEqual((await state()).data.highlights, before.highlights);
  });
  await test("mantém edição de data/observação no fluxo auditado da Copa", async () => {
    await completeQuarter();
    await apply(101, 301, {
      matchDate: "2099-01-05",
      notes: "Observação corrigida",
    });
    const match = (await state()).data.matches.find(m => m.id === 301);
    assert.equal(match.matchDate, "2099-01-05");
    assert.equal(match.notes, "Observação corrigida");
    assert.equal(match.countsForStandings, false);
  });
  await test("convidados: adiciona/remove somente linhas explícitas e mantém estatísticas restantes", async () => {
    await completeQuarter();
    const before = (await state()).data;
    await apply(101, 301, {
      participants: [
        { id: 401 },
        { id: 402 },
        { id: 403 },
        {
          playerId: null,
          guestName: "Novo fictício",
          invitedByName: "Convite fictício",
          teamColor: "red",
        },
      ],
      goals: [
        { id: 501 },
        { id: 502 },
        {
          playerId: null,
          guestName: "Novo fictício",
          teamColor: "red",
          quantity: 1,
        },
      ],
    });
    const added = (await state()).data;
    const guest = added.participants.find(p => p.guestName === "Novo fictício");
    assert.ok(guest.id);
    assert.equal(guest.isGuest, true);
    assert.equal(guest.invitedByName, "Convite fictício");
    await apply(101, 301, {
      participants: [{ id: 401 }, { id: 402 }, { id: 403 }],
      goals: [{ id: 501 }, { id: 502 }],
    });
    const after = (await state()).data;
    assert.deepEqual(after.participants, before.participants);
    assert.deepEqual(after.goals, before.goals);
  });
  await test("final de um jogo legado continua compatível", async () => {
    await seed();
    await db.exec('delete from public."copaFixtures" where id=108');
    await addMatch(307, 107, 1, 0);
    await apply(107, 307, { blackScore: 0, redScore: 1 });
    assert.equal(
      await scalar(
        'select "winnerEntrantId" from public."copaFixtures" where id=107'
      ),
      202
    );
  });
  await test("RPCs usam invoker, search_path fixo e execução restrita a authenticated", async () => {
    const functions = await query(
      "select p.proname,p.prosecdef,p.proconfig,has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('get_copa_match_state','save_copa_match_result')"
    );
    assert.equal(functions.length, 2);
    for (const fn of functions) {
      assert.equal(fn.prosecdef, false);
      assert.equal(fn.anon_execute, false);
      assert.ok(fn.proconfig.some(value => value.startsWith("search_path=")));
    }
  });
  await test("falha ao inserir auditoria reverte placar, estatísticas e chave", async () => {
    await completeQuarter();
    const before = await state();
    await db.exec(
      "reset role; create function public.fail_test_audit() returns trigger language plpgsql as $$begin raise exception 'Falha fictícia de auditoria'; end$$; create trigger fail_test_audit before insert on public.\"copaAuditLogs\" for each row execute function public.fail_test_audit(); set role authenticated"
    );
    await reject(() => apply(101, 301, { redScore: 4 }), /Falha fictícia/);
    assert.deepEqual(await state(), before);
  });
  await test("revisão obsoleta impede sobrescrita de outro administrador", async () => {
    await completeQuarter();
    const old = await state();
    await apply(101, 301, { blackScore: 3 });
    const current = await state();
    await reject(
      () => apply(101, 301, { redScore: 5 }, true, old.revision),
      /outro administrador/
    );
    assert.deepEqual(await state(), current);
  });
  await test("guarda do banco impede bypass via partidas, estatísticas ou chave", async () => {
    await completeQuarter();
    const before = await state();
    for (const sql of [
      'update public.matches set "redScore"=9 where id=301',
      "delete from public.matches where id=301",
      'update public."matchGoals" set quantity=9 where id=501',
      'delete from public."matchParticipants" where id=401',
      'update public."roundHighlights" set "playerId"=8 where id=601',
      'update public."copaFixtures" set "winnerEntrantId"=208 where id=101',
    ])
      await reject(() => db.exec(sql), /Corrigir partida/);
    assert.deepEqual(await state(), before);
    await db.exec(
      "update public.\"roundHighlights\" set caption='Foto atualizada' where id=601"
    ); // Existing media flow stays supported.
  });
  await test("somente administrador ativo: bloqueia anônimo, usuário comum e admin desativado", async () => {
    await completeQuarter();
    const revision = (await state()).revision;
    await db.exec(
      `select set_config('request.jwt.claim.sub','${OTHER}',false)`
    );
    await reject(
      () => apply(101, 301, { redScore: 8 }, true, revision),
      /administrativa ativa/
    );
    await db.exec("reset role");
    await db.query(
      'update public."adminProfiles" set "isActive"=false where "userId"=$1',
      [ADMIN]
    );
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${ADMIN}',false)`
    );
    await reject(
      () => apply(101, 301, { redScore: 8 }, true, revision),
      /administrativa ativa/
    );
    await db.exec("set role anon");
    await reject(() => state(), /permission denied/);
  });
  console.log(
    `\n${passed} testes de banco passaram; nenhum acesso a produção.`
  );
} catch (error) {
  console.error(error.message);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally {
  await db.close();
}
