import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MessageSquareHeart, BarChart3, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "صوت صامت — منصة الشكاوى والمقترحات " },
      { name: "description", content: "منصة آمنة تتيح للطلاب تقديم الشكاوى والمقترحات بشكل مجهول إلى المشرفين والإدارة." },
      { property: "og:title", content: "صوت صامت" },
      { property: "og:description", content: "منصة آمنة لتقديم الشكاوى والمقترحات بشكل مجهول." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen gradient-hero text-white">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-xl font-bold">
          <ShieldCheck className="h-7 w-7" />
          <span>صوت صامت</span>
        </div>
        <Link to="/auth">
          <Button variant="secondary" className="font-semibold">تسجيل الدخول</Button>
        </Link>
      </header>

      <main className="container mx-auto px-6 pb-24 pt-12">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            صوتك مسموع.
            <br />
            <span className="bg-gradient-to-l from-white to-white/60 bg-clip-text text-transparent">
              هويتك محمية.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
            منصة تعليمية تتيح للطلاب تقديم الشكاوى والمقترحات بشكل مجهول تمامًا.
            لا يستطيع أي مشرف أو مسؤول رؤية هويتك.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold text-base shadow-elegant">
                ابدأ الآن
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-24 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { icon: Lock, title: "خصوصية كاملة", desc: "الشكاوى تظهر مجهولة الهوية للمشرفين والإدارة." },
            { icon: MessageSquareHeart, title: "تواصل مباشر", desc: "تابع ردود المشرفين والإدارة على شكواك." },
            { icon: BarChart3, title: "إحصاءات للإدارة", desc: "لوحة تحليلية متقدمة لفهم نقاط الضعف وتحسين البيئة." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <f.icon className="h-8 w-8 text-white" />
              <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-white/70">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
