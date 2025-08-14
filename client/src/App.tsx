import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authService } from "./lib/auth";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";

import Dashboard from "@/pages/dashboard";
import Lawyers from "@/pages/lawyers";
import FindLawyers from "@/pages/find-lawyers";
import CaseRequests from "@/pages/case-requests";
import Cases from "@/pages/cases";
import Calendar from "@/pages/calendar";
import Messages from "@/pages/messages";
import Documents from "@/pages/documents";
import Settings from "@/pages/settings";
import ModernLayout from "@/components/ModernLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/signup">
        <Redirect to="/login" />
      </Route>
      
      <Route path="/">
        {authService.isAuthenticated() ? (
          <Redirect to="/dashboard" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <ModernLayout>
            <Dashboard />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/lawyers">
        <ProtectedRoute>
          <ModernLayout>
            <Lawyers />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/find-lawyers">
        <ProtectedRoute>
          <ModernLayout>
            <FindLawyers />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/case-requests">
        <ProtectedRoute>
          <ModernLayout>
            <CaseRequests />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/cases">
        <ProtectedRoute>
          <ModernLayout>
            <Cases />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/calendar">
        <ProtectedRoute>
          <ModernLayout>
            <Calendar />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/messages">
        <ProtectedRoute>
          <ModernLayout>
            <Messages />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/documents">
        <ProtectedRoute>
          <ModernLayout>
            <Documents />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <ModernLayout>
            <Settings />
          </ModernLayout>
        </ProtectedRoute>
      </Route>

      <Route>
        <div className="min-h-screen flex items-center justify-center bg-legal-gray">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-legal-blue mb-4">404</h1>
            <p className="text-gray-600">Page not found</p>
          </div>
        </div>
      </Route>
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
