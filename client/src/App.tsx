import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminPage from "@/pages/AdminPage";
import { CopaPage, GalleryPage, HighlightsPage, Home, MatchesPage, ScorersPage, SelectionOfYearPage, StandingsPage } from "@/pages/PublicPages";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/pontos-corridos" component={StandingsPage} />
    <Route path="/copa" component={CopaPage} />
    <Route path="/artilheiros" component={ScorersPage} />
    <Route path="/ranking"><Redirect to="/pontos-corridos" /></Route>
    <Route path="/selecao-do-ano" component={SelectionOfYearPage} />
    <Route path="/destaques" component={HighlightsPage} />
    <Route path="/artilharia"><Redirect to="/artilheiros" /></Route>
    <Route path="/partidas" component={MatchesPage} />
    <Route path="/galeria" component={GalleryPage} />
    <Route path="/painel" component={AdminPage} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster position="top-center" richColors closeButton duration={5500} toastOptions={{ classNames: { toast: "amigos-toast", title: "amigos-toast__title", description: "amigos-toast__description" } }} /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
