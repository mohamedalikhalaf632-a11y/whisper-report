import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [busy, setBusy] = useState(false);
  const { user, roleRow, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!roleRow) {
      navigate({ to: "/role-select", replace: true });
    } else if (roleRow.status !== "active") {
      navigate({ to: "/pending", replace: true });
    } else {
      navigate({
        to: roleRow.role === "admin" ? "/app/dashboard" : "/app/complaints",
        replace: true,
      });
    }
  }, [loading, user, roleRow, navigate]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" },
    });
    if (error) {
      toast.error("فشل تسجيل الدخول: " + error.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">مرحبًا بك في صوت صامت</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سجّل الدخول بحساب Google للمتابعة
          </p>
          <Button
            onClick={signIn}
            disabled={busy}
            size="lg"
            className="mt-6 w-full font-semibold"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "تسجيل الدخول عبر Google"}
          </Button>
          <p className="mt-6 text-xs text-muted-foreground">
            بعد التسجيل، يحتاج حسابك إلى موافقة المسؤول للوصول إلى المنصة.
          </p>
        </div>
      </Card>
    </div>
  );
}