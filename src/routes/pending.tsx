import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";
import { useAuth, ROLE_LABEL } from "@/lib/auth-context";

export const Route = createFileRoute("/pending")({
  component: Pending,
});

function Pending() {
  const { user, roleRow, loading, signOut } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" />;
  if (!roleRow) return <Navigate to="/role-select" />;
  if (roleRow.status === "active") return <Navigate to="/app/dashboard" />;

  const rejected = roleRow.status === "rejected";
  const suspended = roleRow.status === "suspended";

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">
          {rejected ? "تم رفض طلبك" : suspended ? "تم إيقاف حسابك" : "حسابك بانتظار موافقة المسؤول"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {rejected
            ? "لقد رفض المسؤول طلب تسجيلك. للاستفسار، يرجى التواصل مع الإدارة."
            : suspended
            ? "تم إيقاف حسابك من قبل الإدارة."
            : "سيتم إعلامك عند تفعيل حسابك. يمكنك تسجيل الخروج والعودة لاحقًا."}
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          الدور المطلوب: <span className="font-bold text-foreground">{ROLE_LABEL[roleRow.role]}</span>
        </div>
        <Button onClick={signOut} variant="outline" className="mt-6 w-full" asChild>
          <Link to="/">تسجيل الخروج</Link>
        </Button>
      </Card>
    </div>
  );
}