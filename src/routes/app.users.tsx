import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABEL, STATUS_LABEL } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Pause, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/users")({ component: Users });

function Users() {
  const { roleRow, user } = useAuth();
  const qc = useQueryClient();
  if (roleRow?.role !== "admin") return <Navigate to="/app/dashboard" />;

  const { data } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const [roles, profiles] = await Promise.all([
        supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,full_name,email,avatar_url"),
      ]);
      const pmap = new Map<string, any>((profiles.data ?? []).map((p) => [p.id, p]));
      return (roles.data ?? []).map((r: any) => ({ ...r, profile: pmap.get(r.user_id) }));
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const { error } = await supabase.from("user_roles")
        .update({ status, approved_at: status === "active" ? new Date().toISOString() : null, approved_by: user!.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم تحديث الحساب"); qc.invalidateQueries({ queryKey: ["all-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const pending = (data ?? []).filter((u: any) => u.status === "pending");
  const others = (data ?? []).filter((u: any) => u.status !== "pending");

  const Row = ({ u }: any) => (
    <Card className="p-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="font-bold">{u.profile?.full_name || u.profile?.email || u.user_id.slice(0, 8)}</div>
        <div className="text-xs text-muted-foreground">{u.profile?.email}</div>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{ROLE_LABEL[u.role as keyof typeof ROLE_LABEL]}</Badge>
          <Badge>{STATUS_LABEL[u.status as keyof typeof STATUS_LABEL]}</Badge>
        </div>
      </div>
      <div className="flex gap-2">
        {u.status === "pending" && <>
          <Button size="sm" onClick={() => update.mutate({ id: u.id, status: "active" })}><Check className="ml-1 h-4 w-4" /> موافقة</Button>
          <Button size="sm" variant="destructive" onClick={() => update.mutate({ id: u.id, status: "rejected" })}><X className="ml-1 h-4 w-4" /> رفض</Button>
        </>}
        {u.status === "active" && u.user_id !== user!.id && (
          <Button size="sm" variant="outline" onClick={() => update.mutate({ id: u.id, status: "suspended" })}><Pause className="ml-1 h-4 w-4" /> إيقاف</Button>
        )}
        {u.status === "suspended" && (
          <Button size="sm" onClick={() => update.mutate({ id: u.id, status: "active" })}><Play className="ml-1 h-4 w-4" /> تفعيل</Button>
        )}
        {u.status === "rejected" && (
          <Button size="sm" onClick={() => update.mutate({ id: u.id, status: "active" })}><Check className="ml-1 h-4 w-4" /> موافقة</Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
      <div>
        <h2 className="text-xl font-bold mb-3">طلبات بانتظار الموافقة ({pending.length})</h2>
        <div className="space-y-2">
          {pending.length === 0 && <Card className="p-6 text-center text-muted-foreground">لا توجد طلبات معلقة</Card>}
          {pending.map((u: any) => <Row key={u.id} u={u} />)}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-3">جميع المستخدمين</h2>
        <div className="space-y-2">{others.map((u: any) => <Row key={u.id} u={u} />)}</div>
      </div>
    </div>
  );
}