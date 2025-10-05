import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Organizations from "./pages/Organizations";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Welcome from "./pages/onboarding/Welcome";
import ProfileSetup from "./pages/onboarding/ProfileSetup";
import WorkspaceSetup from "./pages/onboarding/WorkspaceSetup";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/onboarding/welcome" element={
              <ProtectedRoute>
                <Welcome />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/profile" element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/workspace" element={
              <ProtectedRoute>
                <WorkspaceSetup />
              </ProtectedRoute>
            } />
            
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/organizations" element={<Organizations />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/help" element={<Help />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
