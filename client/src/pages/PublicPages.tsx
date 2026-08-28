import ClubShell, { ClubCrest } from "@/components/ClubShell";
import { trpc } from "@/lib/trpc";
import { groupHighlightsBySunday, visibleRankingRows } from "@/lib/amigosData";
import { sponsorAt, sponsorSlots, usesFilledSponsorCard } from "@/lib/sponsors";
import { CalendarDays, ChevronRight, CircleUserRound, Flame, Image as ImageIcon, Play, Sparkles, Trophy } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState, type ReactNode } from "react";

type ClubData = any;

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function Loading() { return <ClubShell><section className="section"><div className="club-container"><div className="empty-state"><Trophy /><strong>Carregando a história</strong></div></div></section></ClubShell>; }

function Empty({ title, children, icon = <CalendarDays /> }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return <div className="empty-state">{icon}<div><strong>{title}</strong><p>{children}</p></div></div>;
}

function PageHero({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return <section className="page-hero"><div className="club-container"><span className="section-label">{label}</span><h1>{title}</h1><p>{children}</p></div></section>;
}

function PlayerAvatar({ player }: { player: { avatarUrl: string | null; name: string; entityBadgeUrl?: string | null; entityName?: string | null } }) {
  return <span className="player-avatar-stack"><span className="person-avatar">{player.avatarUrl ? <img src={player.avatarUrl} alt="" /> : player.name.slice(0, 1).toUpperCase()}</span>{player.entityBadgeUrl && <span className="player-symbol" title={player.entityName || "Time ou seleção"}><img src={player.entityBadgeUrl} alt="" /></span>}</span>;
}

function RankingItems({ rows, kind = "points" }: { rows: Array<{ id: number; name: string; position?: string | null; avatarUrl: string | null; entityName?: string | null; entityBadgeUrl?: string | null; points?: number; goals?: number; count?: number; votes?: number }>; kind?: "points" | "goals" | "count" }) {
  const [showAll, setShowAll] = useState(false);
  if (!rows.length) return <Empty title="Ainda sem ranking">Assim que as partidas e os destaques forem lançados, a classificação aparece aqui.</Empty>;
  const visibleRows = visibleRankingRows(rows, showAll);
  return <div className="ranking-list">{visibleRows.map((row, index) => {
    const value = kind === "points" ? row.points ?? 0 : kind === "goals" ? row.goals ?? 0 : row.count ?? 0;
    const unit = kind === "points" ? "Pontos" : kind === "goals" ? "Gols" : "Vezes";
    return <div className="ranking-item" key={row.id}><div className="ranking-position">{index + 1}º</div><div className="ranking-person"><PlayerAvatar player={row} /><div><div className="person-name">{row.name}</div>{row.position && <div className="person-position">{row.position}</div>}{row.entityName && <div className="person-team">{row.entityName}</div>}</div></div><div className="ranking-score">{value}<small>{unit}</small>{kind === "count" && <small className="ranking-votes">{row.votes ?? 0} votos</small>}</div></div>;
  })}{rows.length > 8 && <button type="button" className="ranking-show-more" onClick={() => setShowAll(current => !current)}>{showAll ? "Mostrar somente os 8 primeiros" : `Ver todos os ${rows.length} jogadores`}<ChevronRight size={16} className={showAll ? "ranking-show-more__icon ranking-show-more__icon--up" : "ranking-show-more__icon"} /></button>}</div>;
}

function RankingCardTitle({ label, title }: { label: string; title: string }) {
  return <div className="data-card__title"><span>{label}</span><strong>{title}</strong></div>;
}

function Highlights({ items }: { items: any[] }) {
  if (!items.length) return <Empty title="O próximo domingo já está na mira">Quando o apito final soar, a Bola Cheia, a Bola Murcha e toda a resenha ganham lugar no mural do AMIGOS.</Empty>;
  return <div className="feed-grid">{items.map((item: any) => <article className="resenha-card" key={item.id}><div className={`resenha-card__visual${item.imageUrl ? "" : " resenha-card__visual--fallback"}`}>{item.imageUrl ? <img src={item.imageUrl} alt={`Destaque da rodada: ${item.player.name}`} /> : <Sparkles />}<span className={`resenha-pill ${item.kind === "best" ? "resenha-pill--best" : "resenha-pill--worst"}`}>{item.kind === "best" ? "Bola Cheia da rodada" : "Bola Murcha da rodada"}</span></div><div className="resenha-card__body"><div className="resenha-card__meta">{formatDate(item.matchDate)}</div><h3 className="resenha-card__name">{item.player.name}</h3>{item.player.position && <div className="resenha-card__position">{item.player.position}</div>}<p>{item.caption || "A resenha desta rodada ficou registrada na história do AMIGOS F.C."}</p></div></article>)}</div>;
}

function FeedPerson({ person, title, metric, icon }: { person: any; title: string; metric: string; icon: ReactNode }) {
  if (!person) return <article className="feed-person-card feed-person-card--empty"><div className="feed-person-card__icon">{icon}</div><div><span>{title}</span><h3>A bola vai rolar</h3><p>O primeiro resultado da temporada decide quem assume este quadro.</p></div></article>;
  const value = metric === "pontos" ? person.points : person.goals;
  return <article className="feed-person-card"><div className="feed-person-card__photo">{person.avatarUrl ? <img src={person.avatarUrl} alt={person.name} /> : <span>{person.name.slice(0, 1).toUpperCase()}</span>}{person.entityBadgeUrl && <img className="feed-person-card__badge" src={person.entityBadgeUrl} alt="" />}</div><div className="feed-person-card__copy"><span>{icon} {title}</span><h3>{person.name}</h3><p>{[person.position, person.entityName].filter(Boolean).join(" · ") || "AMIGOS F.C."}</p></div><strong>{value}<small>{metric}</small></strong></article>;
}

function MatchStory({ match }: { match: any }) {
  const headline = match.goalDifference === 0 ? "Equilíbrio até o fim" : match.totalGoals >= 8 ? "Chuva de gols" : "Placar que deu assunto";
  return <article className="match-story"><div className="match-story__top"><span>{headline}</span><time>{formatDate(match.matchDate)}</time></div><div className="match-story__score"><span>Preto</span><strong>{match.blackScore}<i>×</i>{match.redScore}</strong><span>Vermelho</span></div><p>{match.notes || `${match.totalGoals} gols em uma partida que entrou para a história da temporada.`}</p></article>;
}

function GalleryPreview({ items }: { items: any[] }) {
  if (!items.length) return <Empty title="Câmera esperando a resenha" icon={<ImageIcon />}>Quando entrarem fotos e vídeos, os momentos do domingo aparecem aqui.</Empty>;
  return <div className="home-gallery-grid">{items.map(item => <article className="home-gallery-item" key={item.id}>{item.mediaType === "image" ? <img src={item.mediaUrl} alt={item.caption || "Memória da pelada"} /> : <video src={item.mediaUrl} preload="metadata" muted />}{item.mediaType === "video" && <span className="home-gallery-play"><Play size={16} /></span>}<div><p>{item.caption || "Memória do AMIGOS F.C."}</p><time>{formatDate(item.capturedAt)}</time></div></article>)}</div>;
}

function copaStageLabel(stage: string) { return ({ quarterfinal: "Quartas de final", semifinal: "Semifinais", final: "Final · 2 jogos", third_place: "3º lugar" } as Record<string, string>)[stage] || stage; }
function copaName(entrant: any) { return entrant?.player?.name || entrant?.playerNameSnapshot || "A definir"; }
function CopaFace({ entrant }: { entrant: any }) { const player = entrant?.player; const name = copaName(entrant); return <div className="copa-face">{player?.avatarUrl || entrant?.avatarUrlSnapshot ? <img src={player?.avatarUrl || entrant.avatarUrlSnapshot} alt={name} /> : <span>{name.slice(0, 1).toUpperCase()}</span>}{(player?.entityBadgeUrl || entrant?.entityBadgeUrlSnapshot) && <img className="copa-face__badge" src={player?.entityBadgeUrl || entrant.entityBadgeUrlSnapshot} alt="" />}</div>; }
function CopaHome({ copa }: { copa: any }) { const fixtures = copa.fixtures || []; const nextFixture = fixtures.filter((fixture: any) => fixture.status !== "completed" && fixture.home && fixture.away).sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate))[0]; const stages = ["quarterfinal", "semifinal", "final"]; return <section className="copa-home"><div className="club-container"><div className="copa-home__intro"><div><span className="eyebrow"><Trophy size={15} /> Modo Copa em andamento</span><h1>{copa.title}<strong>O mata-mata começou.</strong></h1><p>{copa.status === "paused" ? "A Copa está pausada pela organização. O chaveamento e a pelada continuam guardados com segurança." : "A pelada segue viva. Pontos corridos estão congelados, mas gols, saldo, destaques e votos continuam fazendo história."}</p></div><div className="copa-home__seal"><Trophy size={42} /><small>8 classificados<br />1 campeão</small></div></div>{nextFixture ? <article className="copa-next-match"><div className="copa-next-match__meta"><span>Próximo domingo</span><time>{formatDate(nextFixture.scheduledDate)}</time><small>{copaStageLabel(nextFixture.stage)} · Jogo {nextFixture.slotNumber}</small></div><div className="copa-next-match__teams"><div><CopaFace entrant={nextFixture.home} /><strong>{copaName(nextFixture.home)}</strong><small>{nextFixture.home.player?.entityName || nextFixture.home.entityNameSnapshot || "AMIGOS F.C."}</small></div><b>×</b><div><CopaFace entrant={nextFixture.away} /><strong>{copaName(nextFixture.away)}</strong><small>{nextFixture.away.player?.entityName || nextFixture.away.entityNameSnapshot || "AMIGOS F.C."}</small></div></div><p>Os capitães escolhem seus times entre quem estiver na pelada. Empate vale decisão nos pênaltis.</p></article> : <article className="copa-next-match copa-next-match--waiting"><Trophy size={27} /><strong>{copa.status === "paused" ? "Copa pausada" : "Aguardando definição do próximo confronto"}</strong><p>A organização atualiza a chave assim que cada jogo for confirmado.</p></article>}<div className="copa-bracket"><div className="copa-bracket__heading"><div><span className="section-label">Caminho da taça</span><h2>Chaveamento da <em>Copa</em></h2></div><span>{copa.status === "paused" ? "Pausada" : "Ao vivo"}</span></div><div className="copa-bracket__stages">{stages.map(stage => <section key={stage}><h3>{copaStageLabel(stage)}</h3><div>{fixtures.filter((fixture: any) => fixture.stage === stage).sort((a: any, b: any) => a.slotNumber - b.slotNumber).map((fixture: any) => <article className={`copa-bracket-match copa-bracket-match--${fixture.status}`} key={fixture.id}><time>{formatDate(fixture.scheduledDate)}</time><div className={fixture.winnerEntrantId === fixture.homeEntrantId ? "winner" : ""}><span>{copaName(fixture.home)}</span><b>{fixture.status === "completed" && fixture.match ? fixture.match.blackScore : ""}</b></div><div className={fixture.winnerEntrantId === fixture.awayEntrantId ? "winner" : ""}><span>{copaName(fixture.away)}</span><b>{fixture.status === "completed" && fixture.match ? fixture.match.redScore : ""}</b></div>{fixture.status === "completed" && fixture.match?.blackScore === fixture.match?.redScore && <small>Pênaltis: {fixture.homePenaltyScore} × {fixture.awayPenaltyScore}</small>}</article>)}</div></section>)}</div></div></div></section>; }

function SponsorsMarquee({ sponsors }: { sponsors: any[] }) {
  const registered = sponsors.filter(sponsor => sponsor.isActive);
  const fallback = sponsorSlots.map((name, index) => ({ id: `placeholder-${index}`, name, logoUrl: null, displayScale: 1, offsetX: 0, offsetY: 0, fitMode: "cover" }));
  const visibleSponsors = registered.length ? registered : fallback;
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => { setActiveIndex(0); const timer = window.setInterval(() => setActiveIndex(index => (index + 1) % visibleSponsors.length), 3800); return () => window.clearInterval(timer); }, [visibleSponsors.length]);
  const sponsor = sponsorAt(visibleSponsors, activeIndex)!;
  const fillsCard = Boolean(sponsor.logoUrl && usesFilledSponsorCard(sponsor.name));
  const fitMode = sponsor.fitMode === "contain" ? "contain" : "cover";
  return <section className="sponsors-marquee sponsors-marquee--featured" aria-label="Patrocinadores oficiais do AMIGOS F.C."><div className="club-container sponsors-marquee__inner"><div className="sponsors-marquee__copy"><span>Patrocinadores oficiais</span><strong>Quem fortalece a resenha<br />joga junto com a gente.</strong></div><div className="sponsors-marquee__spotlight"><div className={`sponsors-marquee__item sponsors-marquee__item--spotlight${sponsor.logoUrl ? " sponsors-marquee__item--logo" : ""}${fillsCard ? " sponsors-marquee__item--full-card" : ""} sponsors-marquee__item--${fitMode}`} style={{ "--sponsor-scale": String(sponsor.displayScale ?? 1), "--sponsor-offset-x": `${Number(sponsor.offsetX ?? 0)}%`, "--sponsor-offset-y": `${Number(sponsor.offsetY ?? 0)}%` } as React.CSSProperties} key={sponsor.id}>{sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} /> : sponsor.name}</div><div className="sponsors-marquee__dots" aria-hidden="true">{visibleSponsors.map((item, index) => <i className={index === activeIndex ? "active" : ""} key={item.id} />)}</div></div></div></section>;
}

export function Home() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  const latestRound = groupHighlightsBySunday(data.feed)[0]?.items ?? [];
  return <ClubShell>
    {data.home.copa ? <CopaHome copa={data.home.copa} /> : <section className="hero hero--minimal"><SponsorsMarquee sponsors={data.sponsors || []} /><div className="club-container hero-grid hero-grid--minimal"><div className="hero-crest hero-crest--minimal"><div className="hero-crest__disc"><ClubCrest /></div></div></div></section>}
    <section className="home-pulse"><div className="club-container"><div className="home-pulse__heading"><div><p className="section-label">{data.home.copa ? "A pelada continua" : "Feed da pelada"}</p><h2>{data.home.copa ? <>Muito além da <em>Copa</em></> : <>O domingo em <em>movimento</em></>}</h2></div><p>{data.home.copa ? "Enquanto os capitães disputam a chave, toda a pelada segue registrando gols, saldo, votos e resenha." : "Acompanhe quem vem mandando no campeonato, quem está fazendo gol e o que virou assunto na resenha."}</p></div><div className="home-leaders"><FeedPerson person={data.home.leader} title="Líder do campeonato" metric="pontos" icon={<Trophy size={15} />} /><FeedPerson person={data.home.leadingScorer} title="Artilheiro da temporada" metric="gols" icon={<Flame size={15} />} /></div></div></section>
    <section className="section section--dark"><div className="club-container"><div className="section-heading"><div><p className="section-label">Personagens da última rodada</p><h2 className="section-title">Bola Cheia, Murcha e <span>resenha</span></h2></div><div className="section-heading__aside"><p className="section-copy">Somente os destaques do último domingo. O histórico completo fica na aba Bola Cheia/Murcha.</p><Link className="home-text-link" href="/destaques">Ver histórico <ChevronRight size={16} /></Link></div></div><Highlights items={latestRound} /></div></section>
    <section className="section home-stories"><div className="club-container"><div className="home-split"><div><div className="section-heading home-split__heading"><div><p className="section-label">Partidas em foco</p><h2 className="section-title">Jogos que deram <span>o que falar</span></h2></div><Link className="home-text-link" href="/partidas">Ver todas <ChevronRight size={16} /></Link></div><div className="match-stories">{data.home.featuredMatches.length ? data.home.featuredMatches.map((match: any) => <MatchStory key={match.id} match={match} />) : <Empty title="Primeiro clássico a caminho" icon={<Flame />}>Os jogos mais marcantes da temporada vão ganhar destaque neste espaço.</Empty>}</div></div><aside className="home-gallery-preview"><div className="section-heading home-split__heading"><div><p className="section-label">Memórias recentes</p><h2 className="section-title">Da <span>galeria</span></h2></div><Link className="home-text-link" href="/galeria">Abrir galeria <ChevronRight size={16} /></Link></div><GalleryPreview items={data.home.galleryPreview} /></aside></div></div></section>
  </ClubShell>;
}

export function RankingPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Classificação e gols" title="Ranking da pelada">Acompanhe os pontos corridos e quem mais balança a rede na temporada.</PageHero><section className="section"><div className="club-container"><div className="ranking-columns ranking-columns--main"><section className="data-card"><RankingCardTitle label="Classificação geral" title="Pontos Corridos" /><RankingItems rows={data.standings} /></section><section className="data-card"><RankingCardTitle label="Gols da temporada" title="Artilharia" /><RankingItems rows={data.scorers} kind="goals" /></section></div></div></section></ClubShell>;
}

export function StandingsPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Classificação geral" title="Pontos Corridos">Acompanhe quem está na frente da temporada pelo desempenho em cada domingo.</PageHero><section className="section"><div className="club-container"><section className="data-card"><RankingCardTitle label="Classificação geral" title="Pontos Corridos" /><RankingItems rows={data.standings} /></section></div></section></ClubShell>;
}

export function CopaPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell>{data.home.copa ? <CopaHome copa={data.home.copa} /> : <><PageHero label="Modo Copa" title="Copa do AMIGOS">Os oito melhores dos Pontos Corridos entram no mata-mata em busca da taça.</PageHero><section className="section section--dark"><div className="club-container"><Empty title="A Copa ainda não começou" icon={<Trophy />}>Quando a organização iniciar a Copa, o chaveamento e os próximos confrontos aparecerão aqui.</Empty></div></section></>}</ClubShell>;
}

function SelectionPlayer({ slot }: { slot: any }) {
  const player = slot.player;
  return <article className={`selection-slot selection-slot--${slot.role}-${slot.slot}`} style={{ left: `${slot.fieldX}%`, top: `${slot.fieldY}%` }}><span className="selection-slot__role">{slot.label}</span>{player ? <><div className="selection-slot__avatar">{player.avatarUrl ? <img src={player.avatarUrl} alt={player.name} /> : <span>{player.name.slice(0, 1).toUpperCase()}</span>}{player.entityBadgeUrl && <img className="selection-slot__badge" src={player.entityBadgeUrl} alt="" />}</div><strong>{player.name}</strong><small>{player.votes} votos de Bola Cheia</small></> : <><div className="selection-slot__avatar selection-slot__avatar--empty"><CircleUserRound size={18} /></div><strong>A definir</strong><small>Aguardando votos</small></>}</article>;
}

export function SelectionOfYearPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  const filledSlots = data.selectionOfYear.filter((slot: any) => slot.player).length;
  return <ClubShell><PageHero label="Society · 7 na linha + goleiro" title="Seleção do Ano">Os mais votados como Bola Cheia assumem suas posições no campo. A organização define a formação e a escalação se atualiza a cada partida.</PageHero><section className="section section--dark"><div className="club-container"><div className="selection-year__intro"><div><p className="section-label">Escalação atual</p><h2 className="section-title">Os melhores no <span>campo</span></h2></div></div><div className="selection-field" aria-label="Campo society com a Seleção do Ano"><div className="selection-field__half"></div><div className="selection-field__circle"></div><div className="selection-field__goal selection-field__goal--top"></div><div className="selection-field__goal selection-field__goal--bottom"></div>{data.selectionOfYear.map((slot: any) => <SelectionPlayer key={`${slot.role}-${slot.slot}`} slot={slot} />)}</div><p className="selection-year__status">{filledSlots ? `${filledSlots} de 8 posições já têm líder por votos de Bola Cheia.` : "A seleção vai começar a se formar assim que os votos de Bola Cheia forem lançados."}</p></div></section></ClubShell>;
}

export function HighlightsPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  const rounds = groupHighlightsBySunday(data.feed);
  const [latestRound, ...previousRounds] = rounds;
  return <ClubShell><PageHero label="Personagens de cada domingo" title="Bola Cheia e Murcha">A última rodada em destaque e a classificação de quem mais se destacou na temporada.</PageHero><section className="section section--dark"><div className="club-container">{latestRound ? <section className="highlight-history__round"><div className="highlight-history__date"><span>Último domingo</span><strong>{formatDate(latestRound.date)}</strong></div><Highlights items={latestRound.items} /></section> : <Empty title="A história vai começar">Quando a primeira rodada tiver Bola Cheia e Bola Murcha lançadas, os destaques aparecem aqui.</Empty>}<section className="honor-rankings"><div className="section-heading honor-rankings__heading"><div><p className="section-label">Classificação dos destaques</p><h2 className="section-title">Quem está sendo <span>Bola Cheia e Murcha</span></h2></div><p className="section-copy">As vezes escolhidas e o total de votos recebidos por cada jogador na temporada.</p></div><div className="honor-rankings__grid"><section className="data-card"><RankingCardTitle label="Destaques positivos" title="Bola Cheia" /><RankingItems rows={data.honorRankings.best} kind="count" /></section><section className="data-card"><RankingCardTitle label="Destaques negativos" title="Bola Murcha" /><RankingItems rows={data.honorRankings.worst} kind="count" /></section></div></section>{previousRounds.length > 0 && <section className="highlight-history"><div className="section-heading highlight-history__heading"><div><p className="section-label">Rodadas anteriores</p><h2 className="section-title">Escolha um <span>domingo</span></h2></div></div><div className="highlight-history__archive">{previousRounds.map(round => <details key={round.date}><summary><span>Domingo da rodada</span><strong>{formatDate(round.date)}</strong><ChevronRight size={19} /></summary><div><Highlights items={round.items} /></div></details>)}</div></section>}</div></section></ClubShell>;
}

export function ScorersPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Artilharia" title="Quem balança a rede">Gol é gol. Cada bola na rede fica registrada na artilharia da temporada.</PageHero><section className="section"><div className="club-container"><section className="data-card"><RankingCardTitle label="Gols da temporada" title="Artilharia" /><RankingItems rows={data.scorers} kind="goals" /></section></div></section></ClubShell>;
}

export function MatchesPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Domingo a domingo" title="Histórico de partidas">Placar, escalação, gols e destaques: a história de cada jogo fica guardada por aqui.</PageHero><section className="section"><div className="club-container"><div className="match-list">{data.matches.length ? data.matches.map(match => { const black = match.participants.filter(item => item.teamColor === "black"); const red = match.participants.filter(item => item.teamColor === "red"); return <details className="match-card" key={match.id}><summary><div className="match-team">Time Preto<time className="match-date">{formatDate(match.matchDate)}</time></div><div className="match-score"><span>{match.blackScore}</span><span>×</span><span>{match.redScore}</span></div><div className="match-team match-team--right">Time Vermelho<time className="match-date">Abrir partida</time></div></summary><div className="match-detail"><div><h3>Time Preto</h3><ul>{black.map(item => <li key={item.id}>{item.displayName}<span>{item.isGuest ? `Convidado${item.invitedByName ? ` · ${item.invitedByName}` : ""}` : "Fixo"}</span></li>)}</ul><h3>Gols</h3><ul>{match.goals.filter(goal => goal.teamColor === "black").length ? match.goals.filter(goal => goal.teamColor === "black").map(goal => <li key={goal.id}>{goal.displayName}<span>{goal.quantity} gol{goal.quantity > 1 ? "s" : ""}</span></li>) : <li>Sem gols lançados</li>}</ul></div><div><h3>Time Vermelho</h3><ul>{red.map(item => <li key={item.id}>{item.displayName}<span>{item.isGuest ? `Convidado${item.invitedByName ? ` · ${item.invitedByName}` : ""}` : "Fixo"}</span></li>)}</ul><h3>Gols</h3><ul>{match.goals.filter(goal => goal.teamColor === "red").length ? match.goals.filter(goal => goal.teamColor === "red").map(goal => <li key={goal.id}>{goal.displayName}<span>{goal.quantity} gol{goal.quantity > 1 ? "s" : ""}</span></li>) : <li>Sem gols lançados</li>}</ul></div></div></details>; }) : <Empty title="Primeiro apito a caminho">O histórico vai aparecer quando a primeira partida for registrada.</Empty>}</div></div></section></ClubShell>;
}

export function GalleryPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Memória do AMIGOS" title="Galeria">Fotos, vídeos e resenhas para deixar cada domingo guardado para sempre.</PageHero><section className="section"><div className="club-container">{data.gallery.length ? <div className="gallery-grid">{data.gallery.map(item => <article className="gallery-card" key={item.id}><div className="gallery-card__media">{item.mediaType === "image" ? <img src={item.mediaUrl} alt={item.caption || "Memória da pelada"} /> : <video src={item.mediaUrl} controls preload="metadata" />}</div><div className="gallery-card__body"><p>{item.caption || "Memória registrada no AMIGOS F.C."}</p><time>{formatDate(item.capturedAt)}</time></div></article>)}</div> : <Empty title="A galeria espera a resenha" icon={<ImageIcon />}>As fotos e os vídeos dos domingos vão morar aqui.</Empty>}</div></section></ClubShell>;
}
