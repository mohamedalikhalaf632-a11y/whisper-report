import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, MessageSquareWarning, Lightbulb, User, Users, LogOut, ShieldCheck } from "lucide-react";
import { useAuth, ROLE_LABEL } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { roleRow, user, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (!roleRow) return null;

  const items = [
    ...(roleRow.role === "admin"
      ? [{ to: "/app/dashboard", icon: LayoutDashboard, label: "اللوحة الرئيسية" }]
      : []),
    { to: "/app/complaints", icon: MessageSquareWarning, label: "الشكاوى" },
    { to: "/app/suggestions", icon: Lightbulb, label: "المقترحات" },
    ...(roleRow.role === "admin" ? [{ to: "/app/users", icon: Users, label: "إدارة المستخدمين" }] : []),
    { to: "/app/profile", icon: User, label: "الملف الشخصي" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen flex w-full bg-background" dir="rtl">
      <aside className="w-64 border-l bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>صوت صامت</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {ROLE_LABEL[roleRow.role]} · {user?.email}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const active = path === it.to || path.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground font-semibold shadow-elegant"
                    : "hover:bg-sidebar-accent"
                }`}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}