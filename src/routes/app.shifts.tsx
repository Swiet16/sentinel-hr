import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarDays, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/shifts")({ component: ShiftsPage });

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function ShiftsPage() {
  const { isManager } = useRole();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: shifts } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => (await supabase.from("shifts").select("*").order("start_time")).data ?? [],
  });
  const { data: assignments } = useQuery({
    queryKey: ["shift_assignments"],
    queryFn: async () => (await supabase.from("shift_assignments").select("*")).data ?? [],
  });
  const { data: profiles } = useQuery({
    queryKey: ["profiles_min"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, full_name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("shifts").insert(p);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Shift created"); qc.invalidateQueries({ queryKey: ["shifts"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["shifts"] }); },
  });
  const assign = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("shift_assignments").insert(p);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Assigned"); qc.invalidateQueries({ queryKey: ["shift_assignments"] }); setAssignOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignedCount = (sid: string) => (assignments ?? []).filter((a: any) => a.shift_id === sid).length;

  return (
    <div>
      <PageHeader
        title="Shifts"
        description="Define schedules and assign employees."
        actions={isManager && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAssignOpen(true)}>Assign employee</Button>
            <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> New shift</Button>
          </div>
        )}
      />

      {!shifts || shifts.length === 0 ? (
        <EmptyState title="No shifts defined" description="Create your first shift to start scheduling." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shifts.map((s: any) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: s.color }}>
                  <CalendarDays className="h-5 w-5" />
                </div>
                {isManager && (
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete shift?")) remove.mutate(s.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{s.name}</h3>
              <p className="text-sm text-muted-foreground">{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}</p>
              <div className="mt-3 flex gap-1">
                {DAYS.map((d, i) => (
                  <div key={i} className={`grid h-7 w-7 place-items-center rounded-md text-xs font-medium ${
                    (s.days ?? []).includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>{d}</div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Assigned</span>
                <Badge variant="secondary">{assignedCount(s.id)}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>New shift</SheetTitle></SheetHeader>
          <ShiftForm onSubmit={(v) => create.mutate(v)} pending={create.isPending} />
        </SheetContent>
      </Sheet>

      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Assign employee to shift</SheetTitle></SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              assign.mutate({
                user_id: f.get("user_id"),
                shift_id: f.get("shift_id"),
                start_date: f.get("start_date"),
                end_date: f.get("end_date") || null,
              });
            }}
          >
            <div className="space-y-1.5"><Label>Employee</Label>
              <Select name="user_id" required>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(profiles ?? []).map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Shift</Label>
              <Select name="shift_id" required>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(shifts ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Start date</Label><Input type="date" name="start_date" required /></div>
            <div className="space-y-1.5"><Label>End date (optional)</Label><Input type="date" name="end_date" /></div>
            <SheetFooter><Button type="submit" disabled={assign.isPending}>{assign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Assign</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ShiftForm({ onSubmit, pending }: { onSubmit: (v: any) => void; pending: boolean }) {
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const toggle = (i: number) => setDays((d) => d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort());
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSubmit({
          name: f.get("name"),
          start_time: f.get("start_time"),
          end_time: f.get("end_time"),
          color: f.get("color"),
          days,
        });
      }}
    >
      <div className="space-y-1.5"><Label>Name</Label><Input name="name" required placeholder="Morning shift" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Start</Label><Input type="time" name="start_time" required defaultValue="09:00" /></div>
        <div className="space-y-1.5"><Label>End</Label><Input type="time" name="end_time" required defaultValue="17:00" /></div>
      </div>
      <div className="space-y-1.5"><Label>Color</Label><Input type="color" name="color" defaultValue="#3b82f6" className="h-10 w-20" /></div>
      <div className="space-y-2">
        <Label>Days</Label>
        <div className="flex gap-1">
          {DAYS.map((d, i) => (
            <button key={i} type="button" onClick={() => toggle(i)} className={`grid h-9 w-9 place-items-center rounded-md text-xs font-medium ${
              days.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{d}</button>
          ))}
        </div>
      </div>
      <SheetFooter><Button type="submit" disabled={pending}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create</Button></SheetFooter>
    </form>
  );
}