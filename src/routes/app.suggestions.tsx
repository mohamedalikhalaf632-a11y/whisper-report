import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Send, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/suggestions")({ component: Suggestions });

function Suggestions() {
  const { roleRow, user } = useAuth();
  const role = roleRow!.role;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const { data } = useQuery({
    queryKey: ["suggestions"],
    queryFn: async () => (await supabase.from("suggestions").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("suggestions").insert({ student_id: user!.id, ...form });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم إرسال المقترح"); setOpen(false); setForm({ title: "", description: "" }); qc.invalidateQueries({ queryKey: ["suggestions"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المقترحات</h1>
          <p className="text-muted-foreground mt-1">{role === "student" ? "مقترحاتك (مجهولة الهوية)" : "جميع المقترحات - الهوية محمية"}</p>
        </div>
        {role === "student" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" /> مقترح جديد</Button></DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إضافة مقترح</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>الوصف</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <Button className="w-full" disabled={!form.title || !form.description || m.isPending} onClick={() => m.mutate()}>
                  <Send className="ml-2 h-4 w-4" /> إرسال
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).length === 0 && <Card className="p-8 text-center text-muted-foreground md:col-span-2">لا توجد مقترحات</Card>}
        {(data ?? []).map((s: any) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-warning shrink-0 mt-1" />
              <div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{s.description}</p>
                <div className="text-xs text-muted-foreground mt-2">{new Date(s.created_at).toLocaleDateString("ar-EG")}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}