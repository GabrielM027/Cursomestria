import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import AccessGate from "./components/AccessGate";
import Home from "./pages/Home";
import StudyArea from "./pages/StudyArea";
import ModulePage from "./pages/ModulePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentPending from "./pages/PaymentPending";
import PaymentFailure from "./pages/PaymentFailure";

function Router() {
  return (
    <Switch>
      {/* Rotas Públicas */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/cadastro" component={Signup} />
      
      {/* Rotas de Pagamento */}
      <Route path="/sucesso" component={PaymentSuccess} />
      <Route path="/pendente" component={PaymentPending} />
      <Route path="/falha" component={PaymentFailure} />
      
      {/* Rotas Protegidas - Requerem Login */}
      <Route path="/checkout">
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      </Route>
      
      {/* Rotas Protegidas - Requerem Login + Matrícula Ativa */}
      <Route path="/estudos">
        <ProtectedRoute>
          <AccessGate>
            <StudyArea />
          </AccessGate>
        </ProtectedRoute>
      </Route>
      
      <Route path="/modulo/:slug">
        <ProtectedRoute>
          <AccessGate>
            <ModulePage />
          </AccessGate>
        </ProtectedRoute>
      </Route>
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sidebar />
            <div className="pt-14">
              <Router />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
