import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/app/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const { data: items } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", userId!).order("created_at", { ascending: false })).data ?? [],
    enabled: !!userId,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div>
      <PageHeader title="Notifications" description="Your alerts and system messages."
        actions={<Button variant="outline" onClick={() => markAll.mutate()}><CheckCheck className="mr-1.5 h-4 w-4" />Mark all read</Button>} />

      {!items || items.length === 0 ? (
        <EmptyState title="You're all caught up" description="No notifications right now." />
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => (
            <Card key={n.id} className={`flex items-start gap-4 p-4 ${!n.read_at ? "border-primary/30 bg-primary/5" : ""}`}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Bell className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{n.title}</h4>
                  <Badge variant="outline" className="capitalize">{n.type}</Badge>
                  {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM d, HH:mm")}</p>
              </div>
              {!n.read_at && <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>Mark read</Button>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}