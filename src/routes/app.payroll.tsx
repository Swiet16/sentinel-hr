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
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

export const Route = createFileRoute("/app/payroll")({ component: PayrollPage });

function PayrollPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const { isSuperAdmin } = useRole();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: runs } = useQuery({
    queryKey: ["payroll_runs"],
    queryFn: async () => (await supabase.from("payroll_runs").select("*").order("period_end", { ascending: false })).data ?? [],
    enabled: isSuperAdmin,
  });
  const { data: myslips } = useQuery({
    queryKey: ["my_payslips", userId],
    queryFn: async () => (await supabase.from("payslips").select("*").eq("user_id", userId!).order("period_end", { ascending: false })).data ?? [],
    enabled: !!userId,
  });
  const { data: allslips } = useQuery({
    queryKey: ["all_payslips"],
    queryFn: async () => {
      const { data } = await supabase.from("payslips").select("*").order("period_end", { ascending: false });
      const { data: p } = await supabase.from("profiles").select("user_id, full_name");
      return (data ?? []).map((r: any) => ({ ...r, full_name: p?.find((x: any) => x.user_id === r.user_id)?.full_name ?? "—" }));
    },
    enabled: isSuperAdmin,
  });

  const runPayroll = useMutation({
    mutationFn: async ({ start, end }: { start: string; end: string }) => {
      const { data: run, error: rerr } = await supabase.from("payroll_runs").insert({
        period_start: start, period_end: end, status: "completed", created_by: userId,
      }).select().single();
      if (rerr) throw rerr;
      const { data: profiles } = await supabase.from("profiles").select("user_id, base_salary").eq("status", "active");
      const slips = (profiles ?? []).map((p: any) => ({
        run_id: run.id, user_id: p.user_id, period_start: start, period_end: end,
        base_salary: Number(p.base_salary ?? 0), overtime: 0, deductions: 0,
        net_pay: Number(p.base_salary ?? 0),
      }));
      if (slips.length) {
        const { error } = await supabase.from("payslips").insert(slips);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Payroll run completed");
      qc.invalidateQueries({ queryKey: ["payroll_runs"] });
      qc.invalidateQueries({ queryKey: ["all_payslips"] });
      qc.invalidateQueries({ queryKey: ["my_payslips"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

  return (
    <div>
      <PageHeader title="Payroll" description="Run payroll and view payslips."
        actions={isSuperAdmin && <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> New payroll run</Button>} />

      {isSuperAdmin && (
        <Card className="mb-6">
          <div className="border-b p-4"><h3 className="font-semibold">Payroll runs</h3></div>
          {!runs || runs.length === 0 ? <EmptyState title="No payroll runs yet" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
              <TableBody>
                {runs.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{format(new Date(r.period_start), "MMM d")} – {format(new Date(r.period_end), "MMM d, yyyy")}</TableCell>
                    <TableCell><Badge variant="default" className="capitalize">{r.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(r.created_at), "MMM d, HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      <Card>
        <div className="border-b p-4"><h3 className="font-semibold">{isSuperAdmin ? "All payslips" : "My payslips"}</h3></div>
        {(() => {
          const list = isSuperAdmin ? allslips : myslips;
          if (!list || list.length === 0) return <EmptyState title="No payslips yet" description={isSuperAdmin ? "Run payroll to generate payslips." : "Your payslips will appear here once payroll runs."} />;
          return (
            <Table>
              <TableHeader><TableRow>
                {isSuperAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Period</TableHead><TableHead>Base</TableHead><TableHead>Overtime</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {list.map((s: any) => (
                  <TableRow key={s.id}>
                    {isSuperAdmin && <TableCell className="font-medium">{s.full_name}</TableCell>}
                    <TableCell>{format(new Date(s.period_start), "MMM d")} – {format(new Date(s.period_end), "MMM d, yyyy")}</TableCell>
                    <TableCell>{fmt(Number(s.base_salary))}</TableCell>
                    <TableCell className="text-emerald-600">{fmt(Number(s.overtime))}</TableCell>
                    <TableCell className="text-destructive">{fmt(Number(s.deductions))}</TableCell>
                    <TableCell className="font-semibold">{fmt(Number(s.net_pay))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          );
        })()}
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Run payroll</SheetTitle></SheetHeader>
          <form className="mt-6 space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            runPayroll.mutate({ start: String(f.get("start")), end: String(f.get("end")) });
          }}>
            <p className="text-sm text-muted-foreground">Generates a payslip for every active employee using their current base salary.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Period start</Label><Input type="date" name="start" required defaultValue={format(startOfMonth(new Date()), "yyyy-MM-dd")} /></div>
              <div className="space-y-1.5"><Label>Period end</Label><Input type="date" name="end" required defaultValue={format(endOfMonth(new Date()), "yyyy-MM-dd")} /></div>
            </div>
            <SheetFooter><Button type="submit" disabled={runPayroll.isPending}>{runPayroll.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Run</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}