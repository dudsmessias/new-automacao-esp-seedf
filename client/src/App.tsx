import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Register from "@/pages/register";
import Login from "@/pages/login";
import Recover from "@/pages/recover";
import Loading from "@/pages/loading";
import Dashboard from "@/pages/dashboard";
import DashboardResults from "@/pages/dashboard-results";
import EspEditor from "@/pages/esp-editor";
import CriacaoItens from "@/pages/criacao-itens";
import NovaEsp from "@/pages/nova-esp";

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Landing} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/recover" component={Recover} />
      <Route path="/loading" component={Loading} />
      
      {/* Private pages */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/results">
        <ProtectedRoute>
          <DashboardResults />
        </ProtectedRoute>
      </Route>
      <Route path="/esp/:id/:tab?">
        <ProtectedRoute>
          <EspEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/criacao-itens">
        <ProtectedRoute>
          <CriacaoItens />
        </ProtectedRoute>
      </Route>
      <Route path="/nova-esp">
        <ProtectedRoute>
          <NovaEsp />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
