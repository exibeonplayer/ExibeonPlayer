import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MasterRoute from "@/components/MasterRoute";
import { useLicenseChecker } from "@/hooks/useLicenseChecker";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Conteudos from "./pages/Conteudos";
import Playlists from "./pages/Playlists";
import Players from "./pages/Players";
import Relatorios from "./pages/Relatorios";
import Licencas from "./pages/Licencas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Inicializar verificação automática de licenças
  useLicenseChecker();

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/conteudos" element={
              <ProtectedRoute>
                <Conteudos />
              </ProtectedRoute>
            } />
            <Route path="/playlists" element={
              <ProtectedRoute>
                <Playlists />
              </ProtectedRoute>
            } />
            <Route path="/players" element={
              <ProtectedRoute>
                <Players />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/licencas" element={
              <MasterRoute>
                <Licencas />
              </MasterRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
