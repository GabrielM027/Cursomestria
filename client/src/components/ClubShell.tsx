import { ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { ReactNode } from "react";

const crestUrl = "/assets/amigos-fc-escudo.jpg";
const links = [
  ["/", "Início"],
  ["/ranking", "Ranking"],
  ["/destaques", "Melhor/Pior"],
  ["/partidas", "Partidas"],
  ["/galeria", "Galeria"],
] as const;

export function ClubCrest({ className = "" }: { className?: string }) {
  return <img className={className} src={crestUrl} alt="Escudo do AMIGOS F.C." />;
}

export default function ClubShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="club-app">
      <header className="club-header">
        <div className="club-container">
          <div className="club-header__top">
            <Link href="/" className="brand" aria-label="Página inicial do AMIGOS F.C.">
              <span className="brand__mark"><ClubCrest /></span>
              <span>
                <span className="brand__name">AMIGOS</span>
                <span className="brand__sub">Futebol Clube</span>
              </span>
            </Link>
            <Link href="/painel" className="panel-button"><ShieldCheck size={18} /><span>Painel</span></Link>
          </div>
          <nav className="club-nav" aria-label="Navegação principal">
            {links.map(([href, label]) => <Link key={href} href={href} className={location === href ? "active" : ""}>{label}</Link>)}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="club-footer"><div className="club-container"><span>AMIGOS F.C. — Desde 2011</span><span>Todo domingo. Toda história.</span></div></footer>
    </div>
  );
}
