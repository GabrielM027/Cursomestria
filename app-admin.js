let session=null,isAdmin=false,adminPeople=[],adminEntries=[],adminMatches=[];
let teamLookupResult=null,teamLookupTimer=null,teamLookupSeq=0;

function setStatus(id,msg,type=''){
  const el=$(id);if(!el)return;el.textContent=msg;el.className=`status ${type}`;
}
function saveSession(s){session=s;if(s)localStorage.setItem('amigos_session',JSON.stringify(s));else localStorage.removeItem('amigos_session')}
function loadSession(){try{const s=JSON.parse(localStorage.getItem('amigos_session')||'null');if(s?.access_token)session=s}catch{}}
async function auth(endpoint,body){
  const res=await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`,{method:'POST',headers:baseHeaders(),body:JSON.stringify(body)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.msg||data.error_description||data.message||'Falha na autenticação');
  return data;
}

$('#openAdmin').onclick=()=>$('#adminDrawer').classList.add('open');
$('#closeAdmin').onclick=()=>$('#adminDrawer').classList.remove('open');
$('#adminDrawer').onclick=e=>{if(e.target===$('#adminDrawer'))$('#adminDrawer').classList.remove('open')};
$$('#adminTabs button').forEach(btn=>btn.onclick=()=>showAdminPane(btn.dataset.pane));
function showAdminPane(pane){
  $$('#adminTabs button').forEach(b=>b.classList.toggle('active',b.dataset.pane===pane));
  $$('.adminPane').forEach(p=>p.classList.toggle('active',p.id===pane));
}

function resetTeamLookup(){
  teamLookupResult=null;
  $('#teamBadgePreview').innerHTML='⚽';
  $('#teamLookupTitle').textContent='Digite o nome do time ou seleção';
  $('#teamLookupMeta').textContent='O escudo será procurado automaticamente.';
  $('#teamLookup').classList.remove('found','error','loading');
}
$('#playerType').onchange=()=>{
  const guest=$('#playerType').value==='guest';
  $('#selectionFields').classList.toggle('hidden',guest);
  if(guest)resetTeamLookup();
};

async function checkAdmin(){
  if(!session?.access_token)return false;
  try{
    const u=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`}});
    if(!u.ok)throw new Error('Sessão expirada');
    const user=await u.json();
    const rows=await rest(`admins?user_id=eq.${user.id}&select=user_id`,{token:session.access_token});
    isAdmin=!!rows?.length;
    if(!isAdmin)throw new Error('Esta conta não é administradora.');
    $('#adminArea').classList.remove('hidden');
    $('#signupBtn').classList.add('hidden');
    $('#loginBtn').classList.add('hidden');
    $('#logoutBtn').classList.remove('hidden');
    setStatus('#authStatus',`Administrador conectado: ${user.email}`,'ok');
    await loadAdminData();
    return true;
  }catch(e){
    isAdmin=false;$('#adminArea').classList.add('hidden');setStatus('#authStatus',e.message,'err');return false;
  }
}
$('#loginBtn').onclick=async()=>{
  try{setStatus('#authStatus','Entrando...');const data=await auth('token?grant_type=password',{email:$('#authEmail').value.trim(),password:$('#authPassword').value});saveSession(data);await checkAdmin()}
  catch(e){setStatus('#authStatus',e.message,'err')}
};
$('#signupBtn').onclick=async()=>{
  try{
    const email=$('#authEmail').value.trim(),password=$('#authPassword').value;
    if(!email||password.length<6)throw new Error('Informe e-mail e senha com pelo menos 6 caracteres.');
    setStatus('#authStatus','Criando administrador...');
    const data=await auth('signup',{email,password,data:{name:'Administrador Amigos F.C.'}});
    if(data.access_token){saveSession(data);await checkAdmin()}
    else setStatus('#authStatus','Conta criada. Se receber confirmação por e-mail, confirme e depois entre.','ok');
  }catch(e){setStatus('#authStatus',e.message,'err')}
};
$('#logoutBtn').onclick=()=>{
  saveSession(null);isAdmin=false;$('#adminArea').classList.add('hidden');$('#logoutBtn').classList.add('hidden');$('#loginBtn').classList.remove('hidden');$('#signupBtn').classList.remove('hidden');setStatus('#authStatus','Sessão encerrada.');
};

async function uploadFile(bucket,file,prefix){
  if(!file)return null;
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
  const path=`${prefix}/${Date.now()}-${safe}`;
  const res=await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
  if(!res.ok)throw new Error(await res.text());
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

const TEAM_ALIASES={
  'brasil':'Brazil','alemanha':'Germany','espanha':'Spain','inglaterra':'England','franca':'France','italia':'Italy','holanda':'Netherlands','paises baixos':'Netherlands','marrocos':'Morocco','belgica':'Belgium','croacia':'Croatia','japao':'Japan','coreia do sul':'South Korea','estados unidos':'United States','uruguai':'Uruguay','suica':'Switzerland','suecia':'Sweden','dinamarca':'Denmark','polonia':'Poland','equador':'Ecuador','paraguai':'Paraguay','servia':'Serbia','turquia':'Turkey','grecia':'Greece','egito':'Egypt','camaroes':'Cameroon','argelia':'Algeria','costa do marfim':'Ivory Coast','arabia saudita':'Saudi Arabia','bayern de munique':'Bayern Munich','internazionale':'Inter Milan','inter de milao':'Inter Milan'
};
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()}
function setTeamLookupState(state,title,meta,badge){
  const box=$('#teamLookup');box.classList.remove('found','error','loading');if(state)box.classList.add(state);
  $('#teamLookupTitle').textContent=title;$('#teamLookupMeta').textContent=meta||'';
  $('#teamBadgePreview').innerHTML=badge?`<img src="${esc(badge)}" alt="">`:'⚽';
}
async function lookupTeam(raw,force=false){
  const typed=String(raw||'').trim();if(typed.length<3){resetTeamLookup();return null}
  const currentSeq=++teamLookupSeq;setTeamLookupState('loading','Procurando escudo...',typed,null);
  const query=TEAM_ALIASES[norm(typed)]||typed;
  try{
    const res=await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(query)}`);
    if(!res.ok)throw new Error('Busca indisponível');
    const data=await res.json();if(currentSeq!==teamLookupSeq&&!force)return teamLookupResult;
    const teams=(data?.teams||[]).filter(t=>String(t.strSport||'').toLowerCase()==='soccer');
    const team=teams[0]||data?.teams?.[0];
    if(!team){teamLookupResult=null;setTeamLookupState('error','Escudo não encontrado','O jogador pode ser salvo mesmo assim.',null);return null}
    teamLookupResult={typed_name:typed,api_name:team.strTeam||typed,badge_url:team.strBadge||team.strTeamBadge||null,external_team_id:team.idTeam||null,identity_kind:(String(team.strLeague||'').toLowerCase().includes('world cup')||String(team.strLeague||'').toLowerCase().includes('nations'))?'selection':'team'};
    setTeamLookupState('found',team.strTeam||typed,[team.strLeague,team.strCountry].filter(Boolean).join(' • ')||'Escudo encontrado',teamLookupResult.badge_url);
    return teamLookupResult;
  }catch(e){
    teamLookupResult=null;setTeamLookupState('error','Não foi possível buscar agora','Você ainda pode salvar o jogador.',null);return null;
  }
}
$('#selectionName').oninput=()=>{clearTimeout(teamLookupTimer);teamLookupResult=null;const value=$('#selectionName').value;teamLookupTimer=setTimeout(()=>lookupTeam(value),850)};
$('#selectionName').onblur=()=>{const value=$('#selectionName').value.trim();if(value.length>=3&&(!teamLookupResult||teamLookupResult.typed_name!==value))lookupTeam(value)};

function entryMap(){return Object.fromEntries(adminEntries.map(e=>[e.person_id,e]))}
function renderAdminPlayers(){
  const em=entryMap();
  $('#adminPlayers').innerHTML=adminPeople.length?adminPeople.map(p=>{const e=em[p.id];return `<div class="minirow">${avatarHtml(p,e||{})}<div class="grow"><b>${esc(p.name)}</b><div class="small">${p.type==='fixed'?`${esc(e?.selection_name||'Sem time/seleção')} • fixo`:'Convidado'}</div></div><button class="btn" onclick="togglePlayer('${p.id}',${!p.active})">${p.active?'Desativar':'Ativar'}</button></div>`}).join(''):'<div class="empty">Nenhum jogador.</div>';
}

function activeMatchPeople(){return adminPeople.filter(p=>p.active)}
function teamCheckboxHtml(p,team){
  const cls=team==='black'?'black-team-check':'red-team-check';
  return `<label class="minirow" style="margin-bottom:6px;padding:9px;cursor:pointer"><input type="checkbox" class="team-check ${cls}" data-id="${p.id}" style="width:auto"><div class="grow"><b>${esc(p.name)}</b><div class="small">${p.type==='guest'?'Convidado':'Fixo'}</div></div></label>`;
}
function renderMatchTeamSelectors(){
  const people=activeMatchPeople();
  $('#blackTeamPicker').innerHTML=people.length?people.map(p=>teamCheckboxHtml(p,'black')).join(''):'<div class="empty compact">Sem jogadores.</div>';
  $('#redTeamPicker').innerHTML=people.length?people.map(p=>teamCheckboxHtml(p,'red')).join(''):'<div class="empty compact">Sem jogadores.</div>';
  $$('.team-check').forEach(ch=>ch.onchange=()=>handleTeamToggle(ch));
  updateTeamCounts();
  renderGoalInputs();
}
function handleTeamToggle(ch){
  const id=ch.dataset.id;
  if(ch.checked){
    const other=ch.classList.contains('black-team-check')?$(`.red-team-check[data-id="${id}"]`):$(`.black-team-check[data-id="${id}"]`);
    if(other)other.checked=false;
  }
  updateTeamCounts();
  renderGoalInputs();
}
function selectedIds(team){return $$(`.${team}-team-check:checked`).map(ch=>ch.dataset.id)}
function updateTeamCounts(){
  const b=selectedIds('black').length,r=selectedIds('red').length;
  $('#blackCount').textContent=`${b} ${b===1?'jogador':'jogadores'}`;
  $('#redCount').textContent=`${r} ${r===1?'jogador':'jogadores'}`;
}
function currentGoalValues(){
  const vals={};$$('.mp-goals').forEach(x=>vals[x.dataset.id]=+x.value||0);return vals;
}
function renderGoalInputs(preset=null){
  const values={...currentGoalValues(),...(preset||{})};
  const black=selectedIds('black'),red=selectedIds('red');
  const all=[...black.map(id=>({id,team:'black'})),...red.map(id=>({id,team:'red'}))];
  if(!all.length){$('#matchGoalsPicker').className='empty compact';$('#matchGoalsPicker').innerHTML='Selecione os jogadores dos times primeiro.';return}
  const pmap=Object.fromEntries(adminPeople.map(p=>[p.id,p]));
  $('#matchGoalsPicker').className='';
  $('#matchGoalsPicker').innerHTML=all.map(x=>{const p=pmap[x.id];return `<div class="minirow"><div class="grow"><b>${esc(p?.name||'Jogador')}</b><div class="small">${x.team==='black'?'⚫ Time Preto':'🔴 Time Vermelho'}</div></div><label style="width:84px">Gols<input class="mp-goals" data-id="${x.id}" type="number" min="0" value="${values[x.id]||0}"></label></div>`}).join('');
}

function renderAdminMatches(rows){
  adminMatches=rows;
  $('#adminMatches').innerHTML=rows.length?rows.map(m=>`<div class="minirow"><div class="grow"><b>${brDate(m.played_on)} • ⚫ ${m.black_score} × ${m.red_score} 🔴</b><div class="small">${m.status==='published'?'Publicada':'Rascunho'}${m.best_person_id||m.worst_person_id?' • destaques lançados':''}</div></div><button class="btn" onclick="editMatch('${m.id}')">Jogo</button><button class="btn gold" onclick="openHighlights('${m.id}')">Melhor/Pior</button><button class="btn danger" onclick="deleteMatch('${m.id}')">Excluir</button></div>`).join(''):'<div class="empty">Nenhuma partida.</div>';
  const matchOpts='<option value="">Selecione uma partida</option>'+rows.map(m=>`<option value="${m.id}">${brDate(m.played_on)} • ⚫ ${m.black_score}x${m.red_score} 🔴</option>`).join('');
  $('#highlightMatch').innerHTML=matchOpts;
  $('#galleryMatch').innerHTML='<option value="">Sem vincular</option>'+rows.map(m=>`<option value="${m.id}">${brDate(m.played_on)} • ${m.black_score}x${m.red_score}</option>`).join('');
}
function renderAdminGallery(rows){
  $('#adminGallery').innerHTML=rows.length?rows.map(i=>`<div class="minirow"><div class="grow"><b>${i.type==='photo'?'📷 Foto':'🎥 Vídeo'}</b><div class="small">${esc(i.caption||'Sem legenda')}</div></div><button class="btn danger" onclick="deleteGallery('${i.id}')">Excluir</button></div>`).join(''):'<div class="empty">Nenhuma mídia.</div>';
}
async function loadAdminData(){
  if(!isAdmin||!activeSeason)return;
  const [people,entries,matches,gallery]=await Promise.all([
    rest('people?select=*&order=name.asc',{token:session.access_token}),
    rest(`season_entries?season_id=eq.${activeSeason.id}&select=*`,{token:session.access_token}),
    rest(`matches?season_id=eq.${activeSeason.id}&select=*&order=played_on.desc`,{token:session.access_token}),
    rest('gallery_items?select=*&order=created_at.desc',{token:session.access_token})
  ]);
  adminPeople=people;adminEntries=entries;
  renderAdminPlayers();renderMatchTeamSelectors();renderAdminMatches(matches);renderAdminGallery(gallery);
}

$('#savePlayerBtn').onclick=async()=>{
  try{
    setStatus('#playerStatus','Salvando...');
    const name=$('#playerName').value.trim(),type=$('#playerType').value;
    if(!name)throw new Error('Informe o nome.');
    const selection=$('#selectionName').value.trim();
    if(type==='fixed'&&!selection)throw new Error('Jogador fixo precisa de um time ou seleção.');
    let identity=null;
    if(type==='fixed')identity=(!teamLookupResult||teamLookupResult.typed_name!==selection)?await lookupTeam(selection,true):teamLookupResult;
    const photo=await uploadFile('player-photos',$('#playerPhoto').files[0],type);
    const created=await rest('people?select=*',{method:'POST',body:{name,type,photo_url:photo,active:true},prefer:'return=representation',token:session.access_token});
    const p=created[0];
    if(type==='fixed')await rest('season_entries',{method:'POST',body:{season_id:activeSeason.id,person_id:p.id,selection_name:selection,flag_emoji:'⚽',badge_url:identity?.badge_url||null,external_team_id:identity?.external_team_id||null,identity_kind:identity?.identity_kind||null,active:true},token:session.access_token});
    $('#playerName').value='';$('#selectionName').value='';$('#playerPhoto').value='';resetTeamLookup();
    setStatus('#playerStatus',identity?.badge_url?'Jogador salvo com escudo automático.':'Jogador salvo. O escudo não foi encontrado, mas pode ser atualizado depois.','ok');
    await loadAdminData();await loadPublicData();
  }catch(e){setStatus('#playerStatus',e.message,'err')}
};
window.togglePlayer=async(id,active)=>{
  try{await rest(`people?id=eq.${id}`,{method:'PATCH',body:{active},token:session.access_token});await loadAdminData();await loadPublicData()}
  catch(e){alert(e.message)}
};

function clearMatchForm(){
  $('#editMatchId').value='';$('#matchDate').value='';$('#blackScore').value=0;$('#redScore').value=0;$('#matchStatus').value='published';
  $$('.team-check').forEach(x=>x.checked=false);updateTeamCounts();renderGoalInputs();setStatus('#matchSaveStatus','');
}
$('#clearMatchBtn').onclick=clearMatchForm;
$('#saveMatchBtn').onclick=async()=>{
  let createdId=null;
  try{
    setStatus('#matchSaveStatus','Salvando...');
    const played_on=$('#matchDate').value;if(!played_on)throw new Error('Informe a data.');
    const blackIds=selectedIds('black'),redIds=selectedIds('red');
    if(!blackIds.length)throw new Error('Selecione pelo menos um jogador no Time Preto.');
    if(!redIds.length)throw new Error('Selecione pelo menos um jogador no Time Vermelho.');
    const players=[...blackIds.map(person_id=>({person_id,team:'black'})),...redIds.map(person_id=>({person_id,team:'red'}))];
    const goals=[];$$('.mp-goals').forEach(el=>{const q=+el.value||0;if(q>0)goals.push({scorer_person_id:el.dataset.id,quantity:q})});
    let id=$('#editMatchId').value;
    const payload={season_id:activeSeason.id,played_on,black_score:+$('#blackScore').value||0,red_score:+$('#redScore').value||0,status:$('#matchStatus').value};
    if(!id){
      const r=await rest('matches?select=*',{method:'POST',body:payload,prefer:'return=representation',token:session.access_token});id=r[0].id;createdId=id;
    }else{
      await rest(`matches?id=eq.${id}`,{method:'PATCH',body:payload,token:session.access_token});
      await rest(`match_players?match_id=eq.${id}`,{method:'DELETE',token:session.access_token});
      await rest(`goals?match_id=eq.${id}`,{method:'DELETE',token:session.access_token});
    }
    await rest('match_players',{method:'POST',body:players.map(p=>({...p,match_id:id})),token:session.access_token});
    if(goals.length)await rest('goals',{method:'POST',body:goals.map(g=>({...g,match_id:id})),token:session.access_token});
    clearMatchForm();setStatus('#matchSaveStatus','Partida salva. Agora, quando quiser, lance melhor e pior na aba separada.','ok');
    await loadAdminData();await loadPublicData();
  }catch(e){
    if(createdId){try{await rest(`matches?id=eq.${createdId}`,{method:'DELETE',token:session.access_token})}catch{}}
    setStatus('#matchSaveStatus',e.message,'err');
  }
};
window.editMatch=async id=>{
  try{
    const [mr,mps,gs]=await Promise.all([
      rest(`matches?id=eq.${id}&select=*`,{token:session.access_token}),
      rest(`match_players?match_id=eq.${id}&select=*`,{token:session.access_token}),
      rest(`goals?match_id=eq.${id}&select=*`,{token:session.access_token})
    ]);
    const m=mr[0];
    $('#editMatchId').value=id;$('#matchDate').value=m.played_on;$('#blackScore').value=m.black_score;$('#redScore').value=m.red_score;$('#matchStatus').value=m.status;
    $$('.team-check').forEach(x=>x.checked=false);
    mps.forEach(x=>{const ch=$(`.${x.team}-team-check[data-id="${x.person_id}"]`);if(ch)ch.checked=true});
    updateTeamCounts();
    const goalMap=Object.fromEntries(gs.map(g=>[g.scorer_person_id,g.quantity]));renderGoalInputs(goalMap);
    showAdminPane('matchPane');
  }catch(e){alert(e.message)}
};
window.deleteMatch=async id=>{
  if(!confirm('Excluir esta partida? Os pontos e gols dela sairão dos rankings.'))return;
  try{await rest(`matches?id=eq.${id}`,{method:'DELETE',token:session.access_token});await loadAdminData();await loadPublicData()}
  catch(e){alert(e.message)}
};

function clearHighlightForm(){
  $('#highlightFields').classList.add('hidden');$('#bestPlayer').innerHTML='';$('#worstPlayer').innerHTML='';$('#bestCaption').value='';$('#worstCaption').value='';$('#bestPhoto').value='';$('#worstPhoto').value='';setStatus('#highlightStatus','');
}
$('#highlightMatch').onchange=async()=>{const id=$('#highlightMatch').value;if(!id){clearHighlightForm();return}await loadHighlightMatch(id)};
async function loadHighlightMatch(id){
  try{
    setStatus('#highlightStatus','Carregando...');
    const [mr,mps]=await Promise.all([rest(`matches?id=eq.${id}&select=*`,{token:session.access_token}),rest(`match_players?match_id=eq.${id}&select=*`,{token:session.access_token})]);
    const m=mr[0];if(!m)throw new Error('Partida não encontrada.');
    const participantIds=new Set(mps.map(x=>x.person_id));const participants=adminPeople.filter(p=>participantIds.has(p.id));
    const opts='<option value="">Selecione</option>'+participants.map(p=>`<option value="${p.id}">${esc(p.name)}${p.type==='guest'?' (convidado)':''}</option>`).join('');
    $('#bestPlayer').innerHTML=opts;$('#worstPlayer').innerHTML=opts;$('#bestPlayer').value=m.best_person_id||'';$('#worstPlayer').value=m.worst_person_id||'';$('#bestCaption').value=m.best_caption||'';$('#worstCaption').value=m.worst_caption||'';$('#bestPhoto').value='';$('#worstPhoto').value='';$('#highlightFields').classList.remove('hidden');
    setStatus('#highlightStatus',participants.length?'Escolha o melhor e o pior entre quem participou.':'Esta partida ainda não tem jogadores lançados.',participants.length?'':'err');
  }catch(e){clearHighlightForm();setStatus('#highlightStatus',e.message,'err')}
}
window.openHighlights=async id=>{showAdminPane('highlightsPane');$('#highlightMatch').value=id;await loadHighlightMatch(id)};
$('#saveHighlightsBtn').onclick=async()=>{
  try{
    const id=$('#highlightMatch').value;if(!id)throw new Error('Selecione uma partida.');
    const best=$('#bestPlayer').value,worst=$('#worstPlayer').value;if(!best||!worst)throw new Error('Selecione o melhor e o pior da rodada.');if(best===worst)throw new Error('Melhor e pior precisam ser jogadores diferentes.');
    setStatus('#highlightStatus','Salvando destaques...');
    const payload={best_person_id:best,worst_person_id:worst,best_caption:$('#bestCaption').value.trim()||null,worst_caption:$('#worstCaption').value.trim()||null};
    const bp=$('#bestPhoto').files[0],wp=$('#worstPhoto').files[0];if(bp)payload.best_photo_url=await uploadFile('match-media',bp,`match-${id}/best`);if(wp)payload.worst_photo_url=await uploadFile('match-media',wp,`match-${id}/worst`);
    await rest(`matches?id=eq.${id}`,{method:'PATCH',body:payload,token:session.access_token});
    setStatus('#highlightStatus','Melhor e pior publicados. Rankings e feed atualizados.','ok');await loadAdminData();await loadPublicData();$('#highlightMatch').value=id;await loadHighlightMatch(id);setStatus('#highlightStatus','Melhor e pior publicados. Rankings e feed atualizados.','ok');
  }catch(e){setStatus('#highlightStatus',e.message,'err')}
};

$('#saveGalleryBtn').onclick=async()=>{
  try{
    setStatus('#galleryStatus','Enviando...');const file=$('#galleryFile').files[0];if(!file)throw new Error('Escolha uma foto ou vídeo.');
    const type=file.type.startsWith('video/')?'video':'photo';const url=await uploadFile('match-media',file,'gallery');
    await rest('gallery_items',{method:'POST',body:{match_id:$('#galleryMatch').value||null,type,media_url:url,caption:$('#galleryCaption').value.trim()||null,published:true},token:session.access_token});
    $('#galleryFile').value='';$('#galleryCaption').value='';setStatus('#galleryStatus','Mídia publicada.','ok');await loadAdminData();await loadPublicData();
  }catch(e){setStatus('#galleryStatus',e.message,'err')}
};
window.deleteGallery=async id=>{
  if(!confirm('Excluir esta mídia da galeria?'))return;
  try{await rest(`gallery_items?id=eq.${id}`,{method:'DELETE',token:session.access_token});await loadAdminData();await loadPublicData()}
  catch(e){alert(e.message)}
};

resetTeamLookup();
loadSession();
setTimeout(checkAdmin,500);