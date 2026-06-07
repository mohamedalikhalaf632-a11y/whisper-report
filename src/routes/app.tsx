import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, roleRow, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;
  if (!roleRow) return <Navigate to="/role-select" />;
  if (roleRow.status !== "active") return <Navigate to="/pending" />;
  // Dashboard is admin-only; others land on complaints
  if (path.startsWith("/app/dashboard") && roleRow.role !== "admin") {
    return <Navigate to="/app/complaints" />;
  }
  if (path === "/app" || path === "/app/") {
    return <Navigate to={roleRow.role === "admin" ? "/app/dashboard" : "/app/complaints"} />;
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}