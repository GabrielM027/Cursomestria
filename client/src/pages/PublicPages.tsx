import ClubShell, { ClubCrest } from "@/components/ClubShell";
import { trpc } from "@/lib/trpc";
import { CalendarDays, ChevronRight, CircleUserRound, Flame, Image as ImageIcon, Play, Sparkles, Trophy } from "lucide-react";
import { Link } from "wouter";
import type { ReactNode } from "react";

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

function RankingItems({ rows, kind = "points" }: { rows: Array<{ id: number; name: string; avatarUrl: string | null; entityName?: string | null; entityBadgeUrl?: string | null; points?: number; goals?: number; count?: number }>; kind?: "points" | "goals" | "count" }) {
  if (!rows.length) return <Empty title="Ainda sem ranking">Assim que as partidas e os destaques forem lançados, a classificação aparece aqui.</Empty>;
  return <div className="ranking-list">{rows.map((row, index) => {
    const value = kind === "points" ? row.points ?? 0 : kind === "goals" ? row.goals ?? 0 : row.count ?? 0;
    const unit = kind === "points" ? "Pontos" : kind === "goals" ? "Gols" : "Vezes";
    return <div className="ranking-item" key={row.id}><div className="ranking-position">{index + 1}º</div><div className="ranking-person"><PlayerAvatar player={row} /><div><div className="person-name">{row.name}</div>{row.entityName && <div className="person-team">{row.entityName}</div>}</div></div><div className="ranking-score">{value}<small>{unit}</small></div></div>;
  })}</div>;
}

function Highlights({ data }: { data: NonNullable<ClubData> }) {
  if (!data.feed.length) return <Empty title="O próximo domingo já está na mira">Quando o apito final soar, o melhor, o pior e toda a resenha ganham lugar no mural do AMIGOS.</Empty>;
  return <div className="feed-grid">{data.feed.map((item: any) => <article className="resenha-card" key={item.id}><div className={`resenha-card__visual${item.imageUrl ? "" : " resenha-card__visual--fallback"}`}>{item.imageUrl ? <img src={item.imageUrl} alt={`Destaque da rodada: ${item.player.name}`} /> : <Sparkles />}<span className={`resenha-pill ${item.kind === "best" ? "resenha-pill--best" : "resenha-pill--worst"}`}>{item.kind === "best" ? "Melhor da rodada" : "Pior da rodada"}</span></div><div className="resenha-card__body"><div className="resenha-card__meta">{formatDate(item.matchDate)}</div><h3 className="resenha-card__name">{item.player.name}</h3><p>{item.caption || "A resenha desta rodada ficou registrada na história do AMIGOS F.C."}</p></div></article>)}</div>;
}

function FeedPerson({ person, title, metric, icon }: { person: any; title: string; metric: string; icon: ReactNode }) {
  if (!person) return <article className="feed-person-card feed-person-card--empty"><div className="feed-person-card__icon">{icon}</div><div><span>{title}</span><h3>A bola vai rolar</h3><p>O primeiro resultado da temporada decide quem assume este quadro.</p></div></article>;
  const value = metric === "pontos" ? person.points : person.goals;
  return <article className="feed-person-card"><div className="feed-person-card__photo">{person.avatarUrl ? <img src={person.avatarUrl} alt={person.name} /> : <span>{person.name.slice(0, 1).toUpperCase()}</span>}{person.entityBadgeUrl && <img className="feed-person-card__badge" src={person.entityBadgeUrl} alt="" />}</div><div className="feed-person-card__copy"><span>{icon} {title}</span><h3>{person.name}</h3><p>{person.entityName || "AMIGOS F.C."}</p></div><strong>{value}<small>{metric}</small></strong></article>;
}

function MatchStory({ match }: { match: any }) {
  const headline = match.goalDifference === 0 ? "Equilíbrio até o fim" : match.totalGoals >= 8 ? "Chuva de gols" : "Placar que deu assunto";
  return <article className="match-story"><div className="match-story__top"><span>{headline}</span><time>{formatDate(match.matchDate)}</time></div><div className="match-story__score"><span>Preto</span><strong>{match.blackScore}<i>×</i>{match.redScore}</strong><span>Vermelho</span></div><p>{match.notes || `${match.totalGoals} gols em uma partida que entrou para a história da temporada.`}</p></article>;
}

function GalleryPreview({ items }: { items: any[] }) {
  if (!items.length) return <Empty title="Câmera esperando a resenha" icon={<ImageIcon />}>Quando entrarem fotos e vídeos, os momentos do domingo aparecem aqui.</Empty>;
  return <div className="home-gallery-grid">{items.map(item => <article className="home-gallery-item" key={item.id}>{item.mediaType === "image" ? <img src={item.mediaUrl} alt={item.caption || "Memória da pelada"} /> : <video src={item.mediaUrl} preload="metadata" muted />}{item.mediaType === "video" && <span className="home-gallery-play"><Play size={16} /></span>}<div><p>{item.caption || "Memória do AMIGOS F.C."}</p><time>{formatDate(item.capturedAt)}</time></div></article>)}</div>;
}

export function Home() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell>
    <section className="hero"><div className="club-container hero-grid"><div className="hero-copy"><span className="eyebrow"><Sparkles /> A casa da pelada</span><h1>Todo domingo.<strong>Toda história.</strong></h1><p>Jogo pegado, amizade de verdade e histórias que continuam depois do apito final. Aqui, cada rodada ganha lugar na memória do AMIGOS F.C.</p><div className="hero-actions"><Link className="action-button action-button--primary" href="/ranking">Ver rankings <ChevronRight size={20} /></Link><Link className="action-button action-button--ghost" href="/partidas">Histórico de partidas <CalendarDays size={19} /></Link></div></div><div className="hero-crest"><div className="hero-crest__disc"><ClubCrest /></div><span className="hero-crest__tag">AMIGOS F.C. · DESDE 2011</span></div></div></section>
    <section className="home-pulse"><div className="club-container"><div className="home-pulse__heading"><div><p className="section-label">Feed da pelada</p><h2>O domingo em <em>movimento</em></h2></div><p>Acompanhe quem vem mandando no campeonato, quem está fazendo gol e o que virou assunto na resenha.</p></div><div className="home-pulse__stats"><div><strong>{data.home.stats.matches}</strong><span>partidas oficiais</span></div><div><strong>{data.home.stats.goals}</strong><span>gols registrados</span></div>{data.home.latestMatch && <div><strong>{data.home.latestMatch.blackScore} × {data.home.latestMatch.redScore}</strong><span>último placar</span></div>}</div><div className="home-leaders"><FeedPerson person={data.home.leader} title="Líder do campeonato" metric="pontos" icon={<Trophy size={15} />} /><FeedPerson person={data.home.leadingScorer} title="Artilheiro da temporada" metric="gols" icon={<Flame size={15} />} /></div></div></section>
    <section className="section section--dark"><div className="club-container"><div className="section-heading"><div><p className="section-label">Personagens da rodada</p><h2 className="section-title">Melhor, pior e <span>resenha</span></h2></div><p className="section-copy">Quem brilhou, quem sofreu e as histórias que dão vida à pelada domingo após domingo.</p></div><Highlights data={data} /></div></section>
    <section className="section home-stories"><div className="club-container"><div className="home-split"><div><div className="section-heading home-split__heading"><div><p className="section-label">Partidas em foco</p><h2 className="section-title">Jogos que deram <span>o que falar</span></h2></div><Link className="home-text-link" href="/partidas">Ver todas <ChevronRight size={16} /></Link></div><div className="match-stories">{data.home.featuredMatches.length ? data.home.featuredMatches.map((match: any) => <MatchStory key={match.id} match={match} />) : <Empty title="Primeiro clássico a caminho" icon={<Flame />}>Os jogos mais marcantes da temporada vão ganhar destaque neste espaço.</Empty>}</div></div><aside className="home-gallery-preview"><div className="section-heading home-split__heading"><div><p className="section-label">Memórias recentes</p><h2 className="section-title">Da <span>galeria</span></h2></div><Link className="home-text-link" href="/galeria">Abrir galeria <ChevronRight size={16} /></Link></div><GalleryPreview items={data.home.galleryPreview} /></aside></div></div></section>
  </ClubShell>;
}

export function RankingPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Quadro de honra" title="Ranking da pelada">Classificação, artilharia e os personagens de cada domingo reunidos em um só lugar.</PageHero><section className="section"><div className="club-container"><div className="ranking-columns"><section className="data-card"><div className="data-card__title">Pontos corridos</div><RankingItems rows={data.standings} /></section><section className="data-card"><div className="data-card__title">Melhores da pelada</div><RankingItems rows={data.honorRankings.best} kind="count" /></section><section className="data-card"><div className="data-card__title">Piores da pelada</div><RankingItems rows={data.honorRankings.worst} kind="count" /></section></div><section className="data-card ranking-scorers-card"><div className="data-card__title">Artilharia da temporada</div><RankingItems rows={data.scorers} kind="goals" /></section></div></section></ClubShell>;
}

export function ScorersPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Artilharia" title="Quem balança a rede">Gol é gol. Cada bola na rede fica registrada na artilharia da temporada.</PageHero><section className="section"><div className="club-container"><section className="data-card"><div className="data-card__title">Artilheiros da temporada</div><RankingItems rows={data.scorers} kind="goals" /></section></div></section></ClubShell>;
}

export function MatchesPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Domingo a domingo" title="Histórico de partidas">Placar, escalação, gols e destaques: a história de cada jogo fica guardada por aqui.</PageHero><section className="section"><div className="club-container"><div className="match-list">{data.matches.length ? data.matches.map(match => { const black = match.participants.filter(item => item.teamColor === "black"); const red = match.participants.filter(item => item.teamColor === "red"); return <details className="match-card" key={match.id}><summary><div className="match-team">Time Preto<time className="match-date">{formatDate(match.matchDate)}</time></div><div className="match-score"><span>{match.blackScore}</span><span>×</span><span>{match.redScore}</span></div><div className="match-team match-team--right">Time Vermelho<time className="match-date">Abrir partida</time></div></summary><div className="match-detail"><div><h3>Time Preto</h3><ul>{black.map(item => <li key={item.id}>{item.player.name}<span>{item.isGuest ? "Convidado" : "Fixo"}</span></li>)}</ul><h3>Gols</h3><ul>{match.goals.filter(goal => goal.teamColor === "black").length ? match.goals.filter(goal => goal.teamColor === "black").map(goal => <li key={goal.id}>{goal.player.name}<span>{goal.quantity} gol{goal.quantity > 1 ? "s" : ""}</span></li>) : <li>Sem gols lançados</li>}</ul></div><div><h3>Time Vermelho</h3><ul>{red.map(item => <li key={item.id}>{item.player.name}<span>{item.isGuest ? "Convidado" : "Fixo"}</span></li>)}</ul><h3>Gols</h3><ul>{match.goals.filter(goal => goal.teamColor === "red").length ? match.goals.filter(goal => goal.teamColor === "red").map(goal => <li key={goal.id}>{goal.player.name}<span>{goal.quantity} gol{goal.quantity > 1 ? "s" : ""}</span></li>) : <li>Sem gols lançados</li>}</ul></div></div></details>; }) : <Empty title="Primeiro apito a caminho">O histórico vai aparecer quando a primeira partida for registrada.</Empty>}</div></div></section></ClubShell>;
}

export function GalleryPage() {
  const { data, isLoading } = trpc.club.publicData.useQuery();
  if (isLoading || !data) return <Loading />;
  return <ClubShell><PageHero label="Memória do AMIGOS" title="Galeria">Fotos, vídeos e resenhas para deixar cada domingo guardado para sempre.</PageHero><section className="section"><div className="club-container">{data.gallery.length ? <div className="gallery-grid">{data.gallery.map(item => <article className="gallery-card" key={item.id}><div className="gallery-card__media">{item.mediaType === "image" ? <img src={item.mediaUrl} alt={item.caption || "Memória da pelada"} /> : <video src={item.mediaUrl} controls preload="metadata" />}</div><div className="gallery-card__body"><p>{item.caption || "Memória registrada no AMIGOS F.C."}</p><time>{formatDate(item.capturedAt)}</time></div></article>)}</div> : <Empty title="A galeria espera a resenha" icon={<ImageIcon />}>As fotos e os vídeos dos domingos vão morar aqui.</Empty>}</div></section></ClubShell>;
}
