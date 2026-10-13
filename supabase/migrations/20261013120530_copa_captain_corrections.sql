begin;

-- Captain correction: include the frozen entrants in the revision and audit snapshot.
create or replace function public.get_copa_match_state(p_fixture_id bigint, p_match_id bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_data jsonb;
begin
  if auth.uid() is null or not public.is_amigos_admin() then
    raise exception 'Faça login com uma conta administrativa ativa.' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'tournament', to_jsonb(t),
    'entrants', (select coalesce(jsonb_agg(to_jsonb(e) order by e.id), '[]') from public."copaEntrants" e where e."tournamentId" = t.id),
    'fixtures', (select coalesce(jsonb_agg(to_jsonb(f) order by f.id), '[]') from public."copaFixtures" f where f."tournamentId" = t.id),
    'matches', (select coalesce(jsonb_agg(to_jsonb(m) order by m.id), '[]') from public.matches m where m.id = p_match_id or m."copaFixtureId" in (select f.id from public."copaFixtures" f where f."tournamentId" = t.id)),
    'participants', (select coalesce(jsonb_agg(to_jsonb(p) order by p.id), '[]') from public."matchParticipants" p where p."matchId" = p_match_id),
    'goals', (select coalesce(jsonb_agg(to_jsonb(g) order by g.id), '[]') from public."matchGoals" g where g."matchId" = p_match_id),
    'highlights', (select coalesce(jsonb_agg(to_jsonb(h) order by h.id), '[]') from public."roundHighlights" h where h."matchId" = p_match_id)
  ) into v_data from public."copaTournaments" t
  join public."copaFixtures" f on f."tournamentId" = t.id where f.id = p_fixture_id;
  if v_data is null or not exists (select 1 from public.matches where id = p_match_id) then
    raise exception 'Confronto ou partida não encontrado.';
  end if;
  return jsonb_build_object('data', v_data, 'revision', md5(v_data::text));
end;
$$;
revoke all on function public.get_copa_match_state(bigint, bigint) from public, anon;
grant execute on function public.get_copa_match_state(bigint, bigint) to authenticated;

-- Completion and correction share the same transactional path and lock order.
create or replace function public.save_copa_match_result(
  p_fixture_id bigint, p_match_id bigint, p_expected_revision text,
  p_changes jsonb, p_reason text, p_correction boolean default true
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_fixture public."copaFixtures";
  v_tournament public."copaTournaments";
  v_match public.matches;
  v_first public."copaFixtures";
  v_second public."copaFixtures";
  v_next public."copaFixtures";
  v_participant public."matchParticipants";
  v_goal public."matchGoals";
  v_highlight public."roundHighlights";
  v_before jsonb; v_after jsonb; v_item jsonb; v_key text;
  v_home integer; v_away integer; v_hp integer; v_ap integer;
  v_winner bigint; v_next_slot integer; v_field text;
  v_home_entrant bigint; v_away_entrant bigint; v_captains_changed boolean;
  v_final_count integer; v_first_leg boolean; v_second_leg boolean;
  v_previous_context text;
begin
  if auth.uid() is null or not public.is_amigos_admin() then
    raise exception 'Faça login com uma conta administrativa ativa.' using errcode = '42501';
  end if;
  if p_correction is null or p_reason is null or length(btrim(p_reason)) < 5 or length(p_reason) > 1000 then
    raise exception 'Informe o motivo da correção (5 a 1000 caracteres).';
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'object' then raise exception 'Dados de correção inválidos.'; end if;
  for v_key in select jsonb_object_keys(p_changes) loop
    if v_key not in ('blackScore','redScore','homePenaltyScore','awayPenaltyScore','participants','goals','highlights','matchDate','notes','homeEntrantId','awayEntrantId') then
      raise exception 'Campo de correção não permitido: %.', v_key;
    end if;
  end loop;
  select * into v_fixture from public."copaFixtures" where id = p_fixture_id;
  if not found then raise exception 'Confronto não encontrado.'; end if;
  select * into v_tournament from public."copaTournaments" where id = v_fixture."tournamentId" for update;
  -- Always lock tournament -> fixtures -> matches -> dependent rows in ID order.
  perform id from public."copaFixtures" where "tournamentId" = v_tournament.id order by id for update;
  perform id from public.matches where id = p_match_id or "copaFixtureId" in
    (select id from public."copaFixtures" where "tournamentId" = v_tournament.id) order by id for update;
  perform id from public."matchParticipants" where "matchId" = p_match_id order by id for update;
  perform id from public."matchGoals" where "matchId" = p_match_id order by id for update;
  perform id from public."roundHighlights" where "matchId" = p_match_id order by id for update;
  select * into v_fixture from public."copaFixtures" where id = p_fixture_id;
  select * into v_match from public.matches where id = p_match_id;
  if not found then raise exception 'Partida não encontrada.'; end if;
  if v_tournament.status not in ('active','paused','completed') then raise exception 'Esta Copa não permite registrar ou corrigir resultados.'; end if;
  foreach v_key in array array['homeEntrantId','awayEntrantId'] loop
    if p_changes ? v_key and (jsonb_typeof(p_changes->v_key) <> 'number' or (p_changes->>v_key) !~ '^[1-9][0-9]*$') then
      raise exception 'Escolha capitães válidos para os dois times.';
    end if;
  end loop;
  v_home_entrant := case when p_changes ? 'homeEntrantId' then (p_changes->>'homeEntrantId')::bigint else v_fixture."homeEntrantId" end;
  v_away_entrant := case when p_changes ? 'awayEntrantId' then (p_changes->>'awayEntrantId')::bigint else v_fixture."awayEntrantId" end;
  if v_home_entrant is null or v_away_entrant is null or v_home_entrant=v_away_entrant then
    raise exception 'Escolha dois capitães diferentes, um para cada cor.';
  end if;
  if (select count(*) from public."copaEntrants" where "tournamentId"=v_tournament.id and id in (v_home_entrant,v_away_entrant)) <> 2 then
    raise exception 'Os capitães devem pertencer aos classificados desta Copa.';
  end if;
  v_captains_changed := (v_home_entrant,v_away_entrant) is distinct from (v_fixture."homeEntrantId",v_fixture."awayEntrantId");
  if v_match."seasonId" <> v_tournament."seasonId" or (v_match."copaFixtureId" is not null and v_match."copaFixtureId" <> p_fixture_id) then
    raise exception 'Esta partida não pertence ao confronto e à temporada informados.';
  end if;
  if p_correction and (v_fixture.status <> 'completed' or v_match."copaFixtureId" is distinct from p_fixture_id) then
    raise exception 'Somente partidas vinculadas a confrontos concluídos podem ser corrigidas.';
  end if;
  if not p_correction and (v_fixture.status not in ('scheduled','postponed') or v_tournament.status = 'completed') then
    raise exception 'Este confronto já foi concluído ou cancelado. Use Corrigir partida.';
  end if;
  if not p_correction and (p_changes ? 'blackScore' or p_changes ? 'redScore' or p_changes ? 'participants' or p_changes ? 'goals' or p_changes ? 'highlights' or p_changes ? 'matchDate' or p_changes ? 'notes' or p_changes ? 'homeEntrantId' or p_changes ? 'awayEntrantId') then
    raise exception 'O encerramento utiliza os dados já salvos na partida.';
  end if;
  v_before := public.get_copa_match_state(p_fixture_id, p_match_id);
  if p_expected_revision is null or p_expected_revision is distinct from v_before->>'revision' then
    raise exception 'Os dados foram alterados por outro administrador. Reabra a correção antes de salvar.' using errcode = '40001';
  end if;
  if p_changes ? 'matchDate' and (jsonb_typeof(p_changes->'matchDate') <> 'string' or (p_changes->>'matchDate') !~ '^\d{4}-\d{2}-\d{2}$') then raise exception 'Data da partida inválida.'; end if;
  if p_changes ? 'notes' and jsonb_typeof(p_changes->'notes') not in ('string','null') then raise exception 'Observação inválida.'; end if;
  v_previous_context := current_setting('amigos.copa_result_fixture', true);
  perform set_config('amigos.copa_result_fixture', p_fixture_id::text, true);
  foreach v_key in array array['blackScore','redScore','homePenaltyScore','awayPenaltyScore'] loop
    if p_changes ? v_key and (p_changes->v_key <> 'null'::jsonb) and
      (jsonb_typeof(p_changes->v_key) <> 'number' or (p_changes->>v_key) !~ '^[0-9]+$') then
      raise exception 'O placar deve ser um número inteiro não negativo.';
    end if;
  end loop;
  if (p_changes ? 'blackScore' and p_changes->'blackScore' = 'null') or (p_changes ? 'redScore' and p_changes->'redScore' = 'null') then
    raise exception 'Informe os dois placares.';
  end if;
  v_home := case when p_changes ? 'blackScore' then (p_changes->>'blackScore')::integer else v_match."blackScore" end;
  v_away := case when p_changes ? 'redScore' then (p_changes->>'redScore')::integer else v_match."redScore" end;
  v_hp := case when p_changes ? 'homePenaltyScore' then (p_changes->>'homePenaltyScore')::integer else v_fixture."homePenaltyScore" end;
  v_ap := case when p_changes ? 'awayPenaltyScore' then (p_changes->>'awayPenaltyScore')::integer else v_fixture."awayPenaltyScore" end;

  -- Replacement lists are optional. Keep IDs, timestamps and omitted fields of retained rows.
  if p_changes ? 'participants' then
    if jsonb_typeof(p_changes->'participants') <> 'array' then raise exception 'Participantes inválidos.'; end if;
    if (select count(*) <> count(distinct value->>'id') from jsonb_array_elements(p_changes->'participants') where value ? 'id') then
      raise exception 'Participante repetido.';
    end if;
    delete from public."matchParticipants" where "matchId" = p_match_id and id not in
      (select (value->>'id')::bigint from jsonb_array_elements(p_changes->'participants') where value->>'id' is not null);
    -- Vacate only changed player references so valid swaps do not hit immediate unique constraints.
    -- The original IDs/metadata stay in place and all intermediate writes share this transaction.
    update public."matchParticipants" p set "playerId"=null where p."matchId"=p_match_id and exists
      (select 1 from jsonb_array_elements(p_changes->'participants') item where (item->>'id')::bigint=p.id
        and item ? 'playerId' and (item->>'playerId')::bigint is distinct from p."playerId");
    for v_item in select value from jsonb_array_elements(p_changes->'participants') loop
      if jsonb_typeof(v_item) <> 'object' or exists (select 1 from jsonb_object_keys(v_item) k where k not in ('id','playerId','teamColor','guestName','invitedByName','bestVotes','worstVotes')) then
        raise exception 'Campos de participante inválidos.';
      end if;
      v_participant := null;
      if v_item ? 'id' then
        select * into v_participant from public."matchParticipants" where id = (v_item->>'id')::bigint and "matchId" = p_match_id;
        if not found then raise exception 'Participante não pertence a esta partida.'; end if;
      end if;
      v_participant := jsonb_populate_record(v_participant, v_item);
      v_participant."bestVotes" := coalesce(v_participant."bestVotes",0);
      v_participant."worstVotes" := coalesce(v_participant."worstVotes",0);
      if v_participant."playerId" is null then
        v_participant."isGuest" := true;
        if nullif(btrim(v_participant."guestName"),'') is null then raise exception 'Informe o nome de cada convidado.'; end if;
      else
        if not exists (select 1 from public.players where id = v_participant."playerId") then raise exception 'Jogador não encontrado.'; end if;
        if v_participant."isGuest" is null or exists (select 1 from public."matchParticipants" where id = v_participant.id and "playerId" is distinct from v_participant."playerId") then
          select "participantType" = 'guest' into v_participant."isGuest" from public.players where id = v_participant."playerId";
        end if;
      end if;
      if v_participant."teamColor" is null or v_participant."teamColor" not in ('black','red') or v_participant."bestVotes" < 0 or v_participant."worstVotes" < 0 then
        raise exception 'Time ou votos de participante inválidos.';
      end if;
      if v_participant.id is null then
        insert into public."matchParticipants" ("matchId","playerId","teamColor","isGuest","guestName","invitedByName","bestVotes","worstVotes")
          values (p_match_id,v_participant."playerId",v_participant."teamColor",v_participant."isGuest",v_participant."guestName",v_participant."invitedByName",v_participant."bestVotes",v_participant."worstVotes");
      else
        update public."matchParticipants" set "playerId"=v_participant."playerId", "teamColor"=v_participant."teamColor", "isGuest"=v_participant."isGuest", "guestName"=v_participant."guestName", "invitedByName"=v_participant."invitedByName", "bestVotes"=v_participant."bestVotes", "worstVotes"=v_participant."worstVotes"
          where id=v_participant.id and ("playerId","teamColor","isGuest","guestName","invitedByName","bestVotes","worstVotes") is distinct from
            (v_participant."playerId",v_participant."teamColor",v_participant."isGuest",v_participant."guestName",v_participant."invitedByName",v_participant."bestVotes",v_participant."worstVotes");
      end if;
    end loop;
  end if;
  if p_changes ? 'goals' then
    if jsonb_typeof(p_changes->'goals') <> 'array' then raise exception 'Gols inválidos.'; end if;
    if (select count(*) <> count(distinct value->>'id') from jsonb_array_elements(p_changes->'goals') where value ? 'id') then raise exception 'Gol repetido.'; end if;
    delete from public."matchGoals" where "matchId"=p_match_id and id not in
      (select (value->>'id')::bigint from jsonb_array_elements(p_changes->'goals') where value->>'id' is not null);
    update public."matchGoals" g set "playerId"=null where g."matchId"=p_match_id and exists
      (select 1 from jsonb_array_elements(p_changes->'goals') item where (item->>'id')::bigint=g.id
        and item ? 'playerId' and (item->>'playerId')::bigint is distinct from g."playerId");
    for v_item in select value from jsonb_array_elements(p_changes->'goals') loop
      if jsonb_typeof(v_item) <> 'object' or exists (select 1 from jsonb_object_keys(v_item) k where k not in ('id','playerId','teamColor','guestName','quantity')) then raise exception 'Campos de gol inválidos.'; end if;
      v_goal := null;
      if v_item ? 'id' then
        select * into v_goal from public."matchGoals" where id=(v_item->>'id')::bigint and "matchId"=p_match_id;
        if not found then raise exception 'Gol não pertence a esta partida.'; end if;
      end if;
      v_goal := jsonb_populate_record(v_goal,v_item);
      if v_goal.quantity is null or v_goal.quantity <= 0 then raise exception 'Quantidade de gols inválida.'; end if;
      if v_goal.id is null then
        insert into public."matchGoals" ("matchId","playerId","teamColor","guestName",quantity) values (p_match_id,v_goal."playerId",v_goal."teamColor",v_goal."guestName",v_goal.quantity);
      else
        update public."matchGoals" set "playerId"=v_goal."playerId","teamColor"=v_goal."teamColor","guestName"=v_goal."guestName",quantity=v_goal.quantity
          where id=v_goal.id and ("playerId","teamColor","guestName",quantity) is distinct from (v_goal."playerId",v_goal."teamColor",v_goal."guestName",v_goal.quantity);
      end if;
    end loop;
  end if;
  if p_changes ? 'highlights' then
    if jsonb_typeof(p_changes->'highlights') <> 'array' then raise exception 'Destaques inválidos.'; end if;
    if (select count(*) <> count(distinct value->>'kind') from jsonb_array_elements(p_changes->'highlights')) then raise exception 'Destaque repetido.'; end if;
    delete from public."roundHighlights" where "matchId"=p_match_id and kind not in
      (select value->>'kind' from jsonb_array_elements(p_changes->'highlights'));
    for v_item in select value from jsonb_array_elements(p_changes->'highlights') loop
      if jsonb_typeof(v_item) <> 'object' or exists (select 1 from jsonb_object_keys(v_item) k where k not in ('id','kind','playerId')) then raise exception 'Campos de destaque inválidos.'; end if;
      if v_item->>'kind' is null or v_item->>'kind' not in ('best','worst') or v_item->>'playerId' is null then raise exception 'Informe o jogador do destaque.'; end if;
      select * into v_highlight from public."roundHighlights" where "matchId"=p_match_id and kind=v_item->>'kind';
      if v_item ? 'id' and (v_highlight.id is null or v_highlight.id <> (v_item->>'id')::bigint) then raise exception 'Destaque não pertence a esta partida.'; end if;
      if v_highlight.id is null then
        insert into public."roundHighlights" ("matchId",kind,"playerId") values (p_match_id,v_item->>'kind',(v_item->>'playerId')::bigint);
      else
        -- Retain caption, images, keys and identity even when changing the highlighted player.
        update public."roundHighlights" set "playerId"=(v_item->>'playerId')::bigint where id=v_highlight.id and "playerId" is distinct from (v_item->>'playerId')::bigint;
      end if;
    end loop;
  end if;
  if (select count(*) from public."matchParticipants" where "matchId"=p_match_id) < 2 then raise exception 'Escale ao menos duas pessoas.'; end if;
  if exists (select "playerId" from public."matchParticipants" where "matchId"=p_match_id and "playerId" is not null group by "playerId" having count(*) > 1) then raise exception 'Cada jogador pode estar em apenas um time.'; end if;
  -- Validate edited lineups/statistics; retain untouched legacy rows, including incomplete records.
  if (p_changes ? 'participants' or p_changes ? 'goals') and exists (select 1 from public."matchGoals" g where g."matchId"=p_match_id and not exists
    (select 1 from public."matchParticipants" p where p."matchId"=p_match_id and p."teamColor"=g."teamColor" and
      ((g."playerId" is not null and p."playerId"=g."playerId") or (g."playerId" is null and p."playerId" is null and p."guestName"=g."guestName")))) then
    raise exception 'Os gols precisam pertencer a participantes do mesmo time. Corrija os gols ao alterar a escalação.';
  end if;
  if (p_changes ? 'participants' or p_changes ? 'highlights') and exists (select 1 from public."roundHighlights" h where h."matchId"=p_match_id and not exists
    (select 1 from public."matchParticipants" p where p."matchId"=p_match_id and p."playerId"=h."playerId" and not p."isGuest")) then
    raise exception 'Melhor e Pior precisam ser jogadores participantes. Corrija os destaques ao alterar a escalação.';
  end if;
  -- Goals may be incomplete or include own goals in legacy data; do not enforce score totals.
  update public.matches set "blackScore"=v_home,"redScore"=v_away,"countsForStandings"=false,"copaFixtureId"=p_fixture_id,
    "matchDate"=case when p_changes ? 'matchDate' then (p_changes->>'matchDate')::date else v_match."matchDate" end,
    notes=case when p_changes ? 'notes' then p_changes->>'notes' else v_match.notes end
    where id=p_match_id and ("blackScore","redScore","countsForStandings","copaFixtureId","matchDate",notes) is distinct from
      (v_home,v_away,false,p_fixture_id,case when p_changes ? 'matchDate' then (p_changes->>'matchDate')::date else v_match."matchDate" end,case when p_changes ? 'notes' then p_changes->>'notes' else v_match.notes end);
  select count(*) into v_final_count from public."copaFixtures" where "tournamentId"=v_tournament.id and stage='final';
  if v_fixture.stage='final' and v_final_count not in (1,2) then raise exception 'Estrutura da final inválida.'; end if;
  if v_fixture.stage='final' and v_final_count=2 and v_fixture."slotNumber" not in (1,2) then raise exception 'Jogo da final inválido.'; end if;
  v_first_leg := v_fixture.stage='final' and v_final_count=2 and v_fixture."slotNumber"=1;
  v_second_leg := v_fixture.stage='final' and v_final_count=2 and v_fixture."slotNumber"=2;
  if v_first_leg then
    select * into v_second from public."copaFixtures" where "tournamentId"=v_tournament.id and stage='final' and "slotNumber"=2;
    if v_second.status='completed' and (v_home,v_away) is distinct from (v_match."blackScore",v_match."redScore") then
      raise exception 'O Jogo 2 da final já foi concluído. Alterar o placar do Jogo 1 mudaria o agregado; nenhum resultado posterior foi alterado.';
    end if;
    if v_captains_changed then
      if v_second.status='completed' or v_second."winnerEntrantId" is not null or exists (select 1 from public.matches where "copaFixtureId"=v_second.id) then
        raise exception 'O Jogo 2 da final já tem resultado registrado. Não é possível alterar os capitães do Jogo 1; nenhum resultado posterior foi alterado.';
      end if;
      -- Keep the unplayed second leg aligned without touching results or player statistics.
      update public."copaFixtures" set "homeEntrantId"=v_home_entrant,"awayEntrantId"=v_away_entrant
        where id=v_second.id and ("homeEntrantId","awayEntrantId") is distinct from (v_home_entrant,v_away_entrant);
    end if;
    v_winner := null; v_hp := null; v_ap := null;
  else
    if v_second_leg then
      select * into v_first from public."copaFixtures" where "tournamentId"=v_tournament.id and stage='final' and "slotNumber"=1;
      if v_first.status <> 'completed' or v_first."homeEntrantId" is null or v_first."awayEntrantId" is null or
        not ((v_first."homeEntrantId"=v_home_entrant and v_first."awayEntrantId"=v_away_entrant) or
             (v_first."homeEntrantId"=v_away_entrant and v_first."awayEntrantId"=v_home_entrant)) then
        raise exception 'Conclua o Jogo 1 com os mesmos dois finalistas antes de decidir o agregado.';
      end if;
      -- Aggregate by entrant, not by shirt colour: a corrected second leg may reverse colours.
      select v_home+case when v_first."homeEntrantId"=v_home_entrant then "blackScore" else "redScore" end,
             v_away+case when v_first."awayEntrantId"=v_away_entrant then "redScore" else "blackScore" end
        into v_home,v_away from public.matches where "copaFixtureId"=v_first.id;
      if not found then raise exception 'Placar do Jogo 1 não encontrado.'; end if;
    end if;
    if v_home=v_away then
      if v_hp is null or v_ap is null or v_hp=v_ap then raise exception 'No empate, informe pênaltis com vencedor definido (na final, vale o agregado).'; end if;
      v_winner := case when v_hp>v_ap then v_home_entrant else v_away_entrant end;
    else
      v_winner := case when v_home>v_away then v_home_entrant else v_away_entrant end;
      v_hp := null; v_ap := null;
    end if;
  end if;
  if v_winner is distinct from v_fixture."winnerEntrantId" and v_fixture.stage='quarterfinal' then
    v_next_slot := case when v_fixture."slotNumber" in (1,4) then 1 when v_fixture."slotNumber" in (2,3) then 2 end;
    v_field := case when v_fixture."slotNumber" in (1,2) then 'homeEntrantId' else 'awayEntrantId' end;
    select * into v_next from public."copaFixtures" where "tournamentId"=v_tournament.id and stage='semifinal' and "slotNumber"=v_next_slot;
    if not found then raise exception 'Semifinal correspondente não encontrada.'; end if;
    if v_next.status='completed' or exists (select 1 from public.matches where "copaFixtureId"=v_next.id) or exists
      (select 1 from public."copaFixtures" where "tournamentId"=v_tournament.id and stage in ('final','third_place') and (status='completed' or id in (select "copaFixtureId" from public.matches))) then
      raise exception 'A semifinal ou uma fase posterior já tem resultado registrado. Não é possível trocar o classificado das quartas sem invalidar esse resultado.';
    end if;
    if v_next."winnerEntrantId" is not null or (case when v_field='homeEntrantId' then v_next."awayEntrantId" else v_next."homeEntrantId" end)=v_winner then
      raise exception 'A semifinal contém uma classificação incompatível. Revise a chave antes de corrigir.';
    end if;
    execute format('update public."copaFixtures" set %I=$1 where id=$2 and %I is distinct from $1',v_field,v_field) using v_winner,v_next.id;
  elsif v_winner is distinct from v_fixture."winnerEntrantId" and v_fixture.stage='semifinal' then
    if v_final_count not in (1,2) then raise exception 'Final correspondente não encontrada.'; end if;
    v_field := case when v_fixture."slotNumber"=1 then 'homeEntrantId' when v_fixture."slotNumber"=2 then 'awayEntrantId' end;
    if v_field is null then raise exception 'Semifinal inválida.'; end if;
    for v_next in select * from public."copaFixtures" where "tournamentId"=v_tournament.id and stage in ('final','third_place') order by id loop
      if v_next.status='completed' or v_next."winnerEntrantId" is not null or exists (select 1 from public.matches where "copaFixtureId"=v_next.id) then
        raise exception 'Um jogo da final ou uma fase posterior já tem resultado registrado. Não é possível trocar o finalista; nenhum resultado posterior foi alterado.';
      end if;
      if v_next.stage='final' then
        if (case when v_field='homeEntrantId' then v_next."awayEntrantId" else v_next."homeEntrantId" end)=v_winner then raise exception 'A final teria o mesmo capitão nos dois times.'; end if;
        execute format('update public."copaFixtures" set %I=$1 where id=$2 and %I is distinct from $1',v_field,v_field) using v_winner,v_next.id;
      end if;
    end loop;
  end if;
  update public."copaFixtures" set status='completed',"homeEntrantId"=v_home_entrant,"awayEntrantId"=v_away_entrant,
    "winnerEntrantId"=v_winner,"homePenaltyScore"=v_hp,"awayPenaltyScore"=v_ap where id=p_fixture_id and
    (status,"homeEntrantId","awayEntrantId","winnerEntrantId","homePenaltyScore","awayPenaltyScore") is distinct from ('completed',v_home_entrant,v_away_entrant,v_winner,v_hp,v_ap);
  if v_fixture.stage='final' and not v_first_leg and v_winner is not null and v_tournament.status <> 'completed' then
    update public."copaTournaments" set status='completed' where id=v_tournament.id;
  end if;
  v_after := public.get_copa_match_state(p_fixture_id,p_match_id);
  if v_before->'data'=v_after->'data' then raise exception 'Nenhuma alteração foi informada.'; end if;
  insert into public."copaAuditLogs" ("tournamentId",action,reason,"beforeData","afterData","performedBy")
    values (v_tournament.id,case when p_correction then 'match_corrected' else 'fixture_resolved' end,btrim(p_reason),
      jsonb_build_object('fixtureId',p_fixture_id,'matchId',p_match_id,'state',v_before->'data'),
      jsonb_build_object('fixtureId',p_fixture_id,'matchId',p_match_id,'state',v_after->'data','administrator',
        (select jsonb_build_object('userId',auth.uid(),'name',name) from public."adminProfiles" where "userId"=auth.uid() and "isActive")),auth.uid());
  perform set_config('amigos.copa_result_fixture',coalesce(v_previous_context,''),true);
  return jsonb_build_object('fixtureId',p_fixture_id,'matchId',p_match_id,'winnerEntrantId',v_winner,'homeEntrantId',v_home_entrant,'awayEntrantId',v_away_entrant,'revision',v_after->>'revision');
end;
$$;
revoke all on function public.save_copa_match_result(bigint,bigint,text,jsonb,text,boolean) from public, anon;
grant execute on function public.save_copa_match_result(bigint,bigint,text,jsonb,text,boolean) to authenticated;

commit;
