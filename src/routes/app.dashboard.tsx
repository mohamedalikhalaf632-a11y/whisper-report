import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { MessageSquareWarning, Lightbulb, CheckCircle2, Clock, Users, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

const CATEGORY_LABEL: Record<string, string> = {
  teachers: "المعلمون", labs: "المختبرات", internet: "الإنترنت", schedule: "الجدول",
  facilities: "المرافق", administration: "الإدارة", exams: "الاختبارات", other: "أخرى",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار المراجعة", under_review: "قيد المراجعة", resolved: "تم الحل", rejected: "مرفوض",
};

function Stat({ icon: Icon, label, value, color = "text-primary" }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-bold">{value}</div>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </Card>
  );
}

function Dashboard() {
  const { roleRow, user } = useAuth();
  const role = roleRow!.role;

  const { data } = useQuery({
    queryKey: ["dashboard", role, user?.id],
    queryFn: async () => {
      const [complaints, suggestions, users] = await Promise.all([
        supabase.from("complaints").select("id,category,status,created_at"),
        supabase.from("suggestions").select("id,created_at"),
        role === "admin" ? supabase.from("user_roles").select("role,status") : Promise.resolve({ data: [] as any[] }),
      ]);
      return {
        complaints: (complaints.data ?? []) as any[],
        suggestions: (suggestions.data ?? []) as any[],
        users: (users as any).data ?? [],
      };
    },
  });

  const c = data?.complaints ?? [];
  const s = data?.suggestions ?? [];
  const total = c.length;
  const resolved = c.filter((x) => x.status === "resolved").length;
  const pending = c.filter((x) => x.status === "pending").length;

  const byCategory = Object.entries(
    c.reduce((acc: Record<string, number>, x) => ((acc[x.category] = (acc[x.category] || 0) + 1), acc), {})
  ).map(([k, v]) => ({ name: CATEGORY_LABEL[k] ?? k, value: v }));

  const byMonth = Object.entries(
    c.reduce((acc: Record<string, number>, x) => {
      const m = new Date(x.created_at).toLocaleDateString("ar-EG", { month: "short" });
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
  const weakest = byCategory.sort((a, b) => (b.value as number) - (a.value as number))[0];

  const PALETTE = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  const colors = ["#4f46e5", "#7c3aed", "#3b82f6", "#a855f7", "#06b6d4", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">اللوحة الرئيسية</h1>
        <p className="mt-1 text-muted-foreground">نظرة عامة على نشاط المنصة</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat icon={MessageSquareWarning} label="إجمالي الشكاوى" value={total} />
        <Stat icon={Lightbulb} label="إجمالي المقترحات" value={s.length} color="text-warning" />
        <Stat icon={CheckCircle2} label="شكاوى محلولة" value={resolved} color="text-success" />
        <Stat icon={Clock} label="بانتظار المراجعة" value={pending} color="text-info" />
      </div>

      {role === "admin" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Stat icon={Users} label="إجمالي المستخدمين" value={data?.users.length ?? 0} />
          <Stat icon={GraduationCap} label="الطلاب" value={data?.users.filter((u: any) => u.role === "student").length ?? 0} />
          <Stat icon={Users} label="المشرفون" value={data?.users.filter((u: any) => u.role === "supervisor").length ?? 0} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold mb-4">الشكاوى حسب الفئة</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                {byCategory.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-4">الشكاوى حسب الشهر</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold mb-4">توزيع الشكاوى - عرض شريطي</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">معدل الحل</div>
          <div className="mt-2 text-4xl font-bold">{resolutionRate}%</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">أضعف منطقة (الأكثر شكاوى)</div>
          <div className="mt-2 text-2xl font-bold">{weakest?.name ?? "—"}</div>
        </Card>
      </div>
    </div>
  );
}