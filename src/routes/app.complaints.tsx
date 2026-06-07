import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/complaints")({ component: Complaints });

const CATEGORIES = [
  { v: "teachers", l: "المعلمون" }, { v: "labs", l: "المختبرات" },
  { v: "internet", l: "الإنترنت" }, { v: "schedule", l: "الجدول" },
  { v: "facilities", l: "المرافق" }, { v: "administration", l: "الإدارة" },
  { v: "exams", l: "الاختبارات" }, { v: "other", l: "أخرى" },
];
const STATUSES = [
  { v: "pending", l: "بانتظار المراجعة", c: "bg-warning/20 text-warning-foreground" },
  { v: "under_review", l: "قيد المراجعة", c: "bg-info/20 text-info" },
  { v: "resolved", l: "تم الحل", c: "bg-success/20 text-success" },
  { v: "rejected", l: "مرفوض", c: "bg-destructive/20 text-destructive" },
];
const catLabel = (v: string) => CATEGORIES.find((c) => c.v === v)?.l ?? v;
const statusLabel = (v: string) => STATUSES.find((s) => s.v === v)?.l ?? v;
const statusColor = (v: string) => STATUSES.find((s) => s.v === v)?.c ?? "";

function Complaints() {
  const { roleRow, user } = useAuth();
  const role = roleRow!.role;
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const { data } = useQuery({
    queryKey: ["complaints", role],
    queryFn: async () => {
      const select = role === "student" ? "id,title,category,custom_category,status,created_at" : "id,title,description,category,custom_category,status,created_at";
      const { data } = await supabase.from("complaints").select(select).order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const filtered = (data ?? []).filter((c) =>
    (catFilter === "all" || c.category === catFilter) &&
    (search === "" || c.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">الشكاوى</h1>
          <p className="text-muted-foreground mt-1">
            {role === "student" ? "شكاواك المقدمة (مجهولة الهوية)" : "جميع الشكاوى - الهوية محمية"}
          </p>
        </div>
        {role === "student" && <NewComplaintDialog onCreated={() => qc.invalidateQueries({ queryKey: ["complaints"] })} userId={user!.id} />}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالعنوان..." className="pr-10" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفئات</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <Card className="p-8 text-center text-muted-foreground">لا توجد شكاوى</Card>}
        {filtered.map((c) => (
          <Link key={c.id} to="/app/complaints/$id" params={{ id: c.id }}>
            <Card className="p-5 hover:shadow-elegant transition cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{c.title}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline">{c.custom_category || catLabel(c.category)}</Badge>
                    <Badge className={statusColor(c.status)}>{statusLabel(c.status)}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function NewComplaintDialog({ onCreated, userId }: { onCreated: () => void; userId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "teachers", custom_category: "" });
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("complaints").insert({
        student_id: userId,
        title: form.title,
        description: form.description,
        category: form.category as any,
        custom_category: form.category === "other" ? form.custom_category : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال الشكوى بنجاح (مجهولة الهوية)");
      setOpen(false);
      setForm({ title: "", description: "", category: "teachers", custom_category: "" });
      onCreated();
    },
    onError: (e: any) => toast.error("خطأ: " + e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" /> شكوى جديدة</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader><DialogTitle>تقديم شكوى جديدة</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>الوصف</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>الفئة</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.category === "other" && (
            <div><Label>فئة مخصصة</Label><Input value={form.custom_category} onChange={(e) => setForm({ ...form, custom_category: e.target.value })} /></div>
          )}
          <Button className="w-full" disabled={!form.title || !form.description || m.isPending} onClick={() => m.mutate()}>
            <Send className="ml-2 h-4 w-4" /> إرسال
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}