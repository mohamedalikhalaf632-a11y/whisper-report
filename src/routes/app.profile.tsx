import { createFileRoute } from "@tanstack/react-router";
import { useAuth, ROLE_LABEL, STATUS_LABEL } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/app/profile")({ component: Profile });

function Profile() {
  const { user, roleRow } = useAuth();
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">الملف الشخصي</h1>
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-lg">{user?.user_metadata?.full_name || user?.user_metadata?.name || "—"}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-muted-foreground">الدور</div><div className="font-bold mt-1">{ROLE_LABEL[roleRow!.role]}</div></div>
          <div><div className="text-muted-foreground">الحالة</div><div className="font-bold mt-1">{STATUS_LABEL[roleRow!.status]}</div></div>
        </div>
      </Card>
    </div>
  );
}