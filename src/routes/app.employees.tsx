import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createEmployee } from "@/lib/employees.functions";
import { useRole } from "@/hooks/use-role";
import { useAuthStore } from "@/store/auth-store";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/employees")({
  component: EmployeesPage,
});

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  department_id: string | null;
  job_title: string | null;
  base_salary: number | null;
};

function EmployeesPage() {
  const { isSuperAdmin, isManager } = useRole();
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const createEmployeeFn = useServerFn(createEmployee);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [formDepartmentId, setFormDepartmentId] = useState<string>("unassigned");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [formRole, setFormRole] = useState<"employee" | "team_leader">("employee");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id,name");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["user_roles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) return [];
      return data;
    },
  });

  const visible = (profiles ?? [])
    .filter((p) => (isManager ? true : p.user_id === userId))
    .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
    .filter((p) => (deptFilter === "all" ? true : p.department_id === deptFilter))
    .filter((p) =>
      q ? (p.full_name ?? "").toLowerCase().includes(q.toLowerCase()) : true
    );

  const save = useMutation({
    mutationFn: async (payload: Partial<Profile>) => {
      if (!editing) throw new Error("No row");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: payload.full_name,
          phone: payload.phone,
          job_title: payload.job_title,
          base_salary: payload.base_salary,
          department_id: payload.department_id,
          status: payload.status ?? "active",
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee updated");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      jobTitle?: string;
      departmentId?: string | null;
      baseSalary?: number;
      status: "active" | "inactive";
      role: "employee" | "team_leader";
    }) => {
      await createEmployeeFn({
        data: payload,
      });
    },
    onSuccess: () => {
      toast.success("Employee added");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["user_roles_all"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deptName = (id: string | null) =>
    departments?.find((d: any) => d.id === id)?.name ?? "—";
  const roleOf = (uid: string) =>
    (roles as any[])?.find((r) => r.user_id === uid)?.role ?? "employee";

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage your workforce, profiles and assignments."
        actions={
          isSuperAdmin && (
            <Button onClick={() => { setMode("create"); setEditing(null); setFormDepartmentId("unassigned"); setFormStatus("active"); setFormRole("employee"); setOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Add employee
            </Button>
          )
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments?.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center p-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : visible.length === 0 ? (
          <EmptyState title="No employees found" description="Adjust your filters or invite new team members." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job title</TableHead>
                <TableHead>Status</TableHead>
                {isSuperAdmin && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8"><AvatarFallback>{(p.full_name ?? "?").slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium">{p.full_name ?? "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground">{p.phone ?? ""}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{roleOf(p.user_id).replace("_"," ")}</Badge></TableCell>
                  <TableCell>{deptName(p.department_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.job_title ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "default" : "outline"}>{p.status}</Badge>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Sheet open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setEditing(null);
          setMode("edit");
          setFormDepartmentId("unassigned");
          setFormStatus("active");
          setFormRole("employee");
        }
      }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>{mode === "create" ? "Add employee" : "Edit employee"}</SheetTitle></SheetHeader>
          {(mode === "create" || editing) && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (mode === "create") {
                  create.mutate({
                    email: String(f.get("email") ?? "").trim(),
                    password: String(f.get("password") ?? ""),
                    fullName: String(f.get("full_name") ?? "").trim(),
                    phone: String(f.get("phone") ?? "").trim() || undefined,
                    jobTitle: String(f.get("job_title") ?? "").trim() || undefined,
                    baseSalary: Number(f.get("base_salary") ?? 0),
                    departmentId: formDepartmentId === "unassigned" ? null : formDepartmentId,
                    status: formStatus,
                    role: formRole,
                  });
                  return;
                }

                save.mutate({
                  full_name: String(f.get("full_name") ?? ""),
                  phone: String(f.get("phone") ?? ""),
                  job_title: String(f.get("job_title") ?? ""),
                  base_salary: Number(f.get("base_salary") ?? 0),
                  department_id: formDepartmentId === "unassigned" ? null : formDepartmentId,
                  status: formStatus,
                });
              }}
            >
              {mode === "create" && (
                <>
                  <Field label="Work email"><Input name="email" type="email" required placeholder="name@company.com" /></Field>
                  <Field label="Temporary password"><Input name="password" type="password" minLength={8} required placeholder="At least 8 characters" /></Field>
                </>
              )}
              <Field label="Full name"><Input name="full_name" required defaultValue={editing?.full_name ?? ""} /></Field>
              <Field label="Phone"><Input name="phone" defaultValue={editing?.phone ?? ""} /></Field>
              <Field label="Job title"><Input name="job_title" defaultValue={editing?.job_title ?? ""} /></Field>
              <Field label="Base salary"><Input type="number" step="0.01" min="0" name="base_salary" defaultValue={String(editing?.base_salary ?? 0)} /></Field>
              <Field label="Department">
                <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {departments?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              {mode === "create" && (
                <Field label="Role">
                  <Select value={formRole} onValueChange={(value) => setFormRole(value as "employee" | "team_leader")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="team_leader">Team leader</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field label="Status">
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as "active" | "inactive")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <SheetFooter>
                <Button type="submit" disabled={save.isPending || create.isPending}>
                  {(save.isPending || create.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {mode === "create" ? "Add employee" : "Save"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}