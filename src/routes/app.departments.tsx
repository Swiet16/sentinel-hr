import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/departments")({
  component: DepartmentsPage,
});

type Dept = { id: string; name: string; code: string | null; description: string | null; manager_id: string | null };

function DepartmentsPage() {
  const { isSuperAdmin } = useRole();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dept | null>(null);

  const { data: depts, isLoading } = useQuery({
    queryKey: ["departments_full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data as Dept[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles_min"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, department_id");
      return data ?? [];
    },
  });

  const headcount = (id: string) => (profiles ?? []).filter((p: any) => p.department_id === id).length;
  const managerName = (uid: string | null) =>
    uid ? (profiles ?? []).find((p: any) => p.user_id === uid)?.full_name ?? "—" : "—";

  const save = useMutation({
    mutationFn: async (payload: Partial<Dept>) => {
      if (editing) {
        const { error } = await supabase.from("departments").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("departments").insert({
          name: payload.name!, code: payload.code, description: payload.description, manager_id: payload.manager_id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["departments_full"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      setOpen(false); setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["departments_full"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Organize teams and assign managers."
        actions={isSuperAdmin && (
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> New department
          </Button>
        )}
      />
      {isLoading ? (
        <div className="grid place-items-center p-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !depts || depts.length === 0 ? (
        <EmptyState title="No departments yet" description="Create your first department to start organizing employees." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {depts.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
                {isSuperAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete department?")) remove.mutate(d.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{d.name}</h3>
              {d.code && <p className="text-xs uppercase tracking-wider text-muted-foreground">{d.code}</p>}
              {d.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{d.description}</p>}
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Manager</span><span className="font-medium">{managerName(d.manager_id)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Headcount</span><span className="font-medium">{headcount(d.id)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>{editing ? "Edit" : "New"} department</SheetTitle></SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              save.mutate({
                name: String(f.get("name") ?? ""),
                code: String(f.get("code") ?? "") || null,
                description: String(f.get("description") ?? "") || null,
                manager_id: (f.get("manager_id") as string) || null,
              });
            }}
          >
            <div className="space-y-1.5"><Label>Name</Label><Input name="name" required defaultValue={editing?.name ?? ""} /></div>
            <div className="space-y-1.5"><Label>Code</Label><Input name="code" defaultValue={editing?.code ?? ""} placeholder="e.g. ENG" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea name="description" defaultValue={editing?.description ?? ""} /></div>
            <div className="space-y-1.5">
              <Label>Manager</Label>
              <Select name="manager_id" defaultValue={editing?.manager_id ?? ""}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {(profiles ?? []).map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name ?? "Unnamed"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <SheetFooter>
              <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}