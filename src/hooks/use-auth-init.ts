import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore, type AppRole } from "@/store/auth-store";

export function useAuthInit() {
  const { setSession, setRole, setRoleLoading, setInitialized, reset } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function fetchRole(userId: string) {
      setRoleLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (cancelled) return;
      if (error || !data?.length) {
        setRole(null);
      } else {
        const order: Record<AppRole, number> = { super_admin: 1, team_leader: 2, employee: 3 };
        const sorted = (data as { role: AppRole }[]).sort((a, b) => order[a.role] - order[b.role]);
        setRole(sorted[0].role);
      }
      setRoleLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // defer to avoid blocking auth callback
        setTimeout(() => fetchRole(session.user.id), 0);
      } else {
        reset();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setInitialized(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}