
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";

// Página temporária para rotas ainda não implementadas
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex-1 p-8 md:ml-64">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p>Esta página será implementada em breve.</p>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/agenda" element={<PlaceholderPage title="Agenda" />} />
              <Route path="/clientes" element={<PlaceholderPage title="Clientes" />} />
              <Route path="/servicos" element={<PlaceholderPage title="Serviços" />} />
              <Route path="/estoque" element={<PlaceholderPage title="Estoque" />} />
              <Route path="/financas" element={<PlaceholderPage title="Finanças" />} />
              <Route path="/pagamentos" element={<PlaceholderPage title="Pagamentos" />} />
              <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" />} />
              <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
