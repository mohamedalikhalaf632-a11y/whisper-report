import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/complaints/$id")({ component: ComplaintDetail });

const STATUSES = [
  { v: "pending", l: "بانتظار المراجعة" },
  { v: "under_review", l: "قيد المراجعة" },
  { v: "resolved", l: "تم الحل" },
  { v: "rejected", l: "مرفوض" },
];

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { roleRow, user } = useAuth();
  const role = roleRow!.role;
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");

  const { data: complaint } = useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => (await supabase.from("complaints").select("*").eq("id", id).single()).data,
  });
  const { data: replies } = useQuery({
    queryKey: ["replies", id],
    queryFn: async () => (await supabase.from("replies").select("*").eq("complaint_id", id).order("created_at")).data ?? [],
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("replies").insert({
        complaint_id: id, author_id: user!.id, author_role: role, message: msg,
      });
      if (error) throw error;
    },
    onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["replies", id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("complaints").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم تحديث الحالة"); qc.invalidateQueries({ queryKey: ["complaint", id] }); },
  });

  if (!complaint) return <div>جاري التحميل...</div>;

  const bubbleColor = (r: string) =>
    r === "supervisor" ? "bg-info/15 border-info/40 text-info-foreground" :
    r === "admin" ? "bg-primary/20 border-primary/50" :
    "bg-muted border-border";
  const roleLabel = (r: string) =>
    ({ student: "رد الطالب", supervisor: "رد المشرف", admin: "رد المدير" } as any)[r];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/app/complaints" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" /> العودة للشكاوى
      </Link>

      <Card className="p-6">
        <h1 className="text-2xl font-bold">{complaint.title}</h1>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Badge variant="outline">{complaint.custom_category || complaint.category}</Badge>
          <Badge>{STATUSES.find((s) => s.v === complaint.status)?.l}</Badge>
        </div>
        <p className="mt-4 text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>

        {(role === "supervisor" || role === "admin") && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2">
            <span className="text-sm">تغيير الحالة:</span>
            <Select value={complaint.status} onValueChange={(v) => updateStatus.mutate(v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-3">الردود</h2>
        <div className="space-y-3">
          {(replies ?? []).map((r: any) => (
            <div key={r.id} className={`rounded-xl border p-4 ${bubbleColor(r.author_role)}`}>
              <div className="text-xs font-bold mb-1">{roleLabel(r.author_role)}</div>
              <div className="whitespace-pre-wrap">{r.message}</div>
              <div className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString("ar-EG")}</div>
            </div>
          ))}
          {(replies ?? []).length === 0 && <div className="text-sm text-muted-foreground">لا توجد ردود بعد</div>}
        </div>

        <div className="mt-4 space-y-2">
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="اكتب ردك..." rows={3} />
          <Button disabled={!msg.trim() || sendReply.isPending} onClick={() => sendReply.mutate()}>
            <Send className="ml-2 h-4 w-4" /> إرسال
          </Button>
        </div>
      </div>
    </div>
  );
}