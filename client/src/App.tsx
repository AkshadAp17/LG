import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authService } from "./lib/auth";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Lawyers from "@/pages/lawyers";
import FindLawyers from "@/pages/find-lawyers";
import CaseRequests from "@/pages/case-requests";
import Cases from "@/pages/cases";
import Calendar from "@/pages/calendar";
import Messages from "@/pages/messages";
import Documents from "@/pages/documents";
import Layout from "@/components/Layout";

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
      <Route path="/signup" component={Signup} />
      
      <Route path="/">
        {authService.isAuthenticated() ? (
          <Redirect to="/dashboard" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/lawyers">
        <ProtectedRoute>
          <Layout>
            <Lawyers />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/find-lawyers">
        <ProtectedRoute>
          <Layout>
            <FindLawyers />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/case-requests">
        <ProtectedRoute>
          <Layout>
            <CaseRequests />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/cases">
        <ProtectedRoute>
          <Layout>
            <Cases />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/calendar">
        <ProtectedRoute>
          <Layout>
            <Calendar />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/messages">
        <ProtectedRoute>
          <Layout>
            <Messages />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/documents">
        <ProtectedRoute>
          <Layout>
            <Documents />
          </Layout>
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
