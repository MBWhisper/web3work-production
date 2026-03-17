import { Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import Jobs from "@/pages/Jobs";
import PostJob from "@/pages/PostJob";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Checkout from "@/pages/Checkout";

function AppContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Switch>
        {/* Auth pages — no navbar */}
        <Route path="/login" component={() => <AuthPage mode="login" />} />
        <Route path="/register" component={() => <AuthPage mode="register" />} />

        {/* All other pages with navbar */}
        <Route>
          <Navbar />
          <main>
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/jobs" component={Jobs} />
              <Route path="/jobs/:id" component={Jobs} />
              <Route path="/post-job" component={PostJob} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/dashboard/:tab" component={Dashboard} />
              <Route path="/admin" component={Admin} />
              <Route path="/checkout/subscription" component={Checkout} />
              {/* Default: show landing page (handles validator loading at root) */}
              <Route component={Landing} />
            </Switch>
          </main>
        </Route>
      </Switch>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
