import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useRole } from "@/hooks/use-role";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from "date-fns";

export const Route = createFileRoute("/app/leaves")({ component: LeavesPage });

function LeavesPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const { isManager } = useRole();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: types } = useQuery({
    queryKey: ["leave_types"],
    queryFn: async () => (await supabase.from("leave_types").select("*")).data ?? [],
  });
  const { data: mine } = useQuery({
    queryKey: ["leave_mine", userId],
    queryFn: async () => (await supabase.from("leave_requests").select("*").eq("user_id", userId!).order("created_at", { ascending: false })).data ?? [],
    enabled: !!userId,
  });
  const { data: all } = useQuery({
    queryKey: ["leave_all"],
    queryFn: async () => {
      const { data } = await supabase.from("leave_requests").select("*").order("created_at", { ascending: false });
      const { data: p } = await supabase.from("profiles").select("user_id, full_name");
      return (data ?? []).map((r: any) => ({ ...r, full_name: p?.find((x: any) => x.user_id === r.user_id)?.full_name ?? "—" }));
    },
    enabled: isManager,
  });

  const request = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("leave_requests").insert({ ...p, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Request submitted"); qc.invalidateQueries({ queryKey: ["leave_mine"] }); qc.invalidateQueries({ queryKey: ["leave_all"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leave_requests").update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["leave_all"] }); qc.invalidateQueries({ queryKey: ["leave_mine"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const typeName = (id: string) => types?.find((t: any) => t.id === id)?.name ?? "—";
  const statusBadge = (s: string) => {
    const variant = s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";
    return <Badge variant={variant as any} className="capitalize">{s}</Badge>;
  };

  const balances = (types ?? []).map((t: any) => {
    const used = (mine ?? [])
      .filter((r: any) => r.leave_type_id === t.id && r.status === "approved")
      .reduce((sum: number, r: any) => sum + (differenceInCalendarDays(new Date(r.end_date), new Date(r.start_date)) + 1), 0);
    return { ...t, used, remaining: t.default_balance - used };
  });

  return (
    <div>
      <PageHeader title="Leaves" description="Request time off and approve team leave."
        actions={<Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Request leave</Button>} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {balances.map((b: any) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} /><span className="text-sm font-medium">{b.name}</span></div>
            <div className="mt-2 text-2xl font-semibold">{b.remaining}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {b.default_balance} days</span></div>
            <div className="text-xs text-muted-foreground">Used: {b.used}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My requests</TabsTrigger>
          {isManager && <TabsTrigger value="approve">Approval queue</TabsTrigger>}
        </TabsList>
        <TabsContent value="mine" className="mt-4">
          <Card>
            {!mine || mine.length === 0 ? <EmptyState title="No leave requests yet" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {mine.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{typeName(r.leave_type_id)}</TableCell>
                      <TableCell>{format(new Date(r.start_date), "MMM d")}</TableCell>
                      <TableCell>{format(new Date(r.end_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-muted-foreground">{r.reason ?? "—"}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
        {isManager && (
          <TabsContent value="approve" className="mt-4">
            <Card>
              {!all || all.filter((r: any) => r.status === "pending").length === 0 ? <EmptyState title="Nothing to approve" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Dates</TableHead><TableHead>Reason</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {all.filter((r: any) => r.status === "pending").map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.full_name}</TableCell>
                        <TableCell>{typeName(r.leave_type_id)}</TableCell>
                        <TableCell>{format(new Date(r.start_date), "MMM d")} – {format(new Date(r.end_date), "MMM d")}</TableCell>
                        <TableCell className="max-w-[260px] truncate text-muted-foreground">{r.reason ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="sm" onClick={() => review.mutate({ id: r.id, status: "approved" })}><Check className="mr-1 h-4 w-4" />Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => review.mutate({ id: r.id, status: "rejected" })}><X className="mr-1 h-4 w-4" />Reject</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Request leave</SheetTitle></SheetHeader>
          <form className="mt-6 space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            request.mutate({
              leave_type_id: f.get("leave_type_id"),
              start_date: f.get("start_date"),
              end_date: f.get("end_date"),
              reason: f.get("reason") || null,
            });
          }}>
            <div className="space-y-1.5"><Label>Type</Label>
              <Select name="leave_type_id" required>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(types ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start</Label><Input type="date" name="start_date" required /></div>
              <div className="space-y-1.5"><Label>End</Label><Input type="date" name="end_date" required /></div>
            </div>
            <div className="space-y-1.5"><Label>Reason</Label><Textarea name="reason" placeholder="Optional" /></div>
            <SheetFooter><Button type="submit" disabled={request.isPending}>{request.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}