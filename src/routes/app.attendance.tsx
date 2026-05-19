import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useRole } from "@/hooks/use-role";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, LogIn, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNowStrict } from "date-fns";

export const Route = createFileRoute("/app/attendance")({ component: AttendancePage });

function AttendancePage() {
  const userId = useAuthStore((s) => s.user?.id);
  const { isManager } = useRole();
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayRow } = useQuery({
    queryKey: ["att_today", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase.from("attendance_records").select("*").eq("user_id", userId).eq("date", today).maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: history } = useQuery({
    queryKey: ["att_history", userId],
    queryFn: async () => {
      const { data } = await supabase.from("attendance_records").select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(30);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const { data: teamToday } = useQuery({
    queryKey: ["att_team", today],
    queryFn: async () => {
      const { data: a } = await supabase.from("attendance_records").select("*").eq("date", today).order("check_in", { ascending: false });
      const { data: p } = await supabase.from("profiles").select("user_id, full_name");
      return (a ?? []).map((r: any) => ({ ...r, full_name: p?.find((x: any) => x.user_id === r.user_id)?.full_name ?? "—" }));
    },
    enabled: isManager,
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("attendance_records").upsert(
        { user_id: userId!, date: today, check_in: new Date().toISOString(), status: "present" },
        { onConflict: "user_id,date" },
      );
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Checked in"); qc.invalidateQueries({ queryKey: ["att_today"] }); qc.invalidateQueries({ queryKey: ["att_history"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      if (!todayRow) throw new Error("Check in first");
      const { error } = await supabase.from("attendance_records").update({ check_out: new Date().toISOString() }).eq("id", todayRow.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Checked out"); qc.invalidateQueries({ queryKey: ["att_today"] }); qc.invalidateQueries({ queryKey: ["att_history"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const hours = (i?: string | null, o?: string | null) => {
    if (!i) return "—";
    const end = o ? new Date(o) : new Date();
    const ms = end.getTime() - new Date(i).getTime();
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div>
      <PageHeader title="Attendance" description="Live check-in, today's roster and your history." />

      <Card className="mb-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</div>
              <div className="text-2xl font-semibold">
                {todayRow?.check_in
                  ? todayRow.check_out
                    ? `Done — ${hours(todayRow.check_in, todayRow.check_out)}`
                    : `Working ${formatDistanceToNowStrict(new Date(todayRow.check_in))}`
                  : "Not checked in"}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => checkIn.mutate()} disabled={!!todayRow?.check_in || checkIn.isPending}>
              {checkIn.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} Check in
            </Button>
            <Button variant="secondary" onClick={() => checkOut.mutate()} disabled={!todayRow?.check_in || !!todayRow?.check_out || checkOut.isPending}>
              {checkOut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />} Check out
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="me">
        <TabsList>
          <TabsTrigger value="me">My history</TabsTrigger>
          {isManager && <TabsTrigger value="team">Team today</TabsTrigger>}
        </TabsList>
        <TabsContent value="me" className="mt-4">
          <Card>
            {!history || history.length === 0 ? (
              <EmptyState title="No records yet" description="Your check-ins will appear here." />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Check in</TableHead><TableHead>Check out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {history.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{format(new Date(r.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{r.check_in ? format(new Date(r.check_in), "HH:mm") : "—"}</TableCell>
                      <TableCell>{r.check_out ? format(new Date(r.check_out), "HH:mm") : "—"}</TableCell>
                      <TableCell>{hours(r.check_in, r.check_out)}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
        {isManager && (
          <TabsContent value="team" className="mt-4">
            <Card>
              {!teamToday || teamToday.length === 0 ? (
                <EmptyState title="No team activity today" />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Check in</TableHead><TableHead>Check out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {teamToday.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.full_name}</TableCell>
                        <TableCell>{r.check_in ? format(new Date(r.check_in), "HH:mm") : "—"}</TableCell>
                        <TableCell>{r.check_out ? format(new Date(r.check_out), "HH:mm") : "—"}</TableCell>
                        <TableCell>{hours(r.check_in, r.check_out)}</TableCell>
                        <TableCell><Badge variant={r.check_out ? "outline" : "default"}>{r.check_out ? "Done" : "Working"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}