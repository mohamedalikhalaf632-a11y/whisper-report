import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, UserCog, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/role-select")({
  component: RoleSelect,
});

const ROLES: { key: AppRole; label: string; desc: string; Icon: typeof GraduationCap }[] = [
  { key: "student", label: "طالب", desc: "تقديم شكاوى ومقترحات بشكل مجهول", Icon: GraduationCap },
  { key: "supervisor", label: "مشرف", desc: "متابعة الشكاوى والرد عليها", Icon: UserCog },
  { key: "admin", label: "مسؤول", desc: "إدارة الحسابات والإحصاءات", Icon: ShieldCheck },
];

function RoleSelect() {
  const { user, roleRow, loading, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<AppRole | null>(null);

  if (loading) return <FullLoader />;
  if (!user) return <Navigate to="/auth" />;
  if (roleRow) return <Navigate to={roleRow.status === "active" ? "/app/dashboard" : "/pending"} />;

  const pick = async (role: AppRole) => {
    setBusy(role);
    const { error } = await supabase.from("user_roles").insert({
      user_id: user.id,
      role,
      status: "pending",
    });
    if (error) {
      toast.error("حدث خطأ: " + error.message);
      setBusy(null);
      return;
    }
    toast.success("تم إرسال طلبك. بانتظار موافقة المسؤول.");
    await refreshRole();
    navigate({ to: "/pending", replace: true });
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <h1 className="text-center text-3xl font-bold text-white">اختر دورك في المنصة</h1>
        <p className="mt-2 text-center text-white/80">سيتم إرسال طلبك إلى المسؤول للموافقة</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <Card key={r.key} className="p-6 text-center hover:shadow-elegant transition cursor-pointer">
              <r.Icon className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-3 text-xl font-bold">{r.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
              <Button
                className="mt-4 w-full"
                onClick={() => pick(r.key)}
                disabled={!!busy}
              >
                {busy === r.key ? <Loader2 className="h-4 w-4 animate-spin" /> : "اختيار"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function FullLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}