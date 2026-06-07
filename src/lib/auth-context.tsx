import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "student" | "supervisor" | "admin";
export type AccountStatus = "pending" | "active" | "suspended" | "rejected";

export interface UserRoleRow {
  role: AppRole;
  status: AccountStatus;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roleRow: UserRoleRow | null;
  loading: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roleRow, setRoleRow] = useState<UserRoleRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (uid: string | null) => {
    if (!uid) {
      setRoleRow(null);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role,status")
      .eq("user_id", uid)
      .maybeSingle();
    setRoleRow(data as UserRoleRow | null);
  };

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s);
      void loadRole(s?.user.id ?? null).then(() => setLoading(false));
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      void loadRole(data.session?.user.id ?? null).then(() => setLoading(false));
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshRole = async () => {
    await loadRole(session?.user.id ?? null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoleRow(null);
  };

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        roleRow,
        loading,
        refreshRole,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_LABEL: Record<AppRole, string> = {
  student: "طالب",
  supervisor: "مشرف",
  admin: "مسؤول",
};

export const STATUS_LABEL: Record<AccountStatus, string> = {
  pending: "بانتظار الموافقة",
  active: "نشط",
  suspended: "موقوف",
  rejected: "مرفوض",
};