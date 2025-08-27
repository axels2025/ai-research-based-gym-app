import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/AuthGuard";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import { Workout } from "./pages/Workout";
import ProgramOverview from "./pages/ProgramOverview";
import PreWorkout from "./pages/PreWorkout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Onboarding } from "./pages/Onboarding";
import { ResearchBasedDemo } from "./components/ResearchBasedDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Onboarding route (requires auth but not completed onboarding) */}
            <Route 
              path="/onboarding" 
              element={
                <RequireAuth>
                  <Onboarding />
                </RequireAuth>
              } 
            />
            
            {/* Protected routes (requires auth AND completed onboarding) */}
            <Route 
              path="/" 
              element={
                <RequireAuth>
                  <RequireOnboarding>
                    <Navigation />
                    <Index />
                  </RequireOnboarding>
                </RequireAuth>
              } 
            />
            <Route 
              path="/workout" 
              element={
                <RequireAuth>
                  <RequireOnboarding>
                    <Navigation />
                    <Workout />
                  </RequireOnboarding>
                </RequireAuth>
              } 
            />
            <Route 
              path="/program-overview" 
              element={
                <RequireAuth>
                  <RequireOnboarding>
                    <Navigation />
                    <ProgramOverview />
                  </RequireOnboarding>
                </RequireAuth>
              } 
            />
            <Route 
              path="/pre-workout" 
              element={
                <RequireAuth>
                  <RequireOnboarding>
                    <Navigation />
                    <PreWorkout />
                  </RequireOnboarding>
                </RequireAuth>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <RequireAuth>
                  <RequireOnboarding>
                    <Profile />
                  </RequireOnboarding>
                </RequireAuth>
              } 
            />
            <Route 
              path="/research-demo" 
              element={
                <RequireAuth>
                  <RequireOnboarding>
                    <Navigation />
                    <ResearchBasedDemo />
                  </RequireOnboarding>
                </RequireAuth>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
