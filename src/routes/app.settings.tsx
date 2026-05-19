import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useRole } from "@/hooks/use-role";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const { isSuperAdmin } = useRole();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["my_profile", userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("user_id", userId!).maybeSingle()).data,
    enabled: !!userId,
  });
  const { data: company } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => (await supabase.from("company_settings").select("*").limit(1).maybeSingle()).data,
  });
  const { data: allRoles } = useQuery({
    queryKey: ["all_roles"],
    queryFn: async () => {
      const { data: r } = await supabase.from("user_roles").select("*");
      const { data: p } = await supabase.from("profiles").select("user_id, full_name");
      return (r ?? []).map((x: any) => ({ ...x, full_name: p?.find((q: any) => q.user_id === x.user_id)?.full_name ?? "—" }));
    },
    enabled: isSuperAdmin,
  });

  const saveProfile = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("profiles").update(p).eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["my_profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveCompany = useMutation({
    mutationFn: async (p: any) => {
      if (!company?.id) throw new Error("No company settings row");
      const { error } = await supabase.from("company_settings").update(p).eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Company saved"); qc.invalidateQueries({ queryKey: ["company_settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setRole = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: string }) => {
      await supabase.from("user_roles").delete().eq("user_id", user_id);
      const { error } = await supabase.from("user_roles").insert({ user_id, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["all_roles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Settings" description="Personal profile, company configuration and roles." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">My profile</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="company">Company</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="roles">Roles</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="p-6">
            {profile && (
              <form className="grid max-w-xl gap-4" onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                saveProfile.mutate({ full_name: f.get("full_name"), phone: f.get("phone") });
              }}>
                <div className="space-y-1.5"><Label>Full name</Label><Input name="full_name" defaultValue={profile.full_name ?? ""} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input name="phone" defaultValue={profile.phone ?? ""} /></div>
                <div><Button type="submit" disabled={saveProfile.isPending}>{saveProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></div>
              </form>
            )}
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="company" className="mt-4">
            <Card className="p-6">
              {company && (
                <form className="grid max-w-xl gap-4" onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  saveCompany.mutate({
                    company_name: f.get("company_name"),
                    timezone: f.get("timezone"),
                    logo_url: f.get("logo_url") || null,
                  });
                }}>
                  <div className="space-y-1.5"><Label>Company name</Label><Input name="company_name" defaultValue={company.company_name} /></div>
                  <div className="space-y-1.5"><Label>Timezone</Label><Input name="timezone" defaultValue={company.timezone} /></div>
                  <div className="space-y-1.5"><Label>Logo URL</Label><Input name="logo_url" defaultValue={company.logo_url ?? ""} /></div>
                  <div><Button type="submit" disabled={saveCompany.isPending}>{saveCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></div>
                </form>
              )}
            </Card>
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="roles" className="mt-4">
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Current role</TableHead><TableHead>Change</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(allRoles ?? []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.full_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{r.role.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <Select defaultValue={r.role} onValueChange={(v) => setRole.mutate({ user_id: r.user_id, role: v })}>
                          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">Super admin</SelectItem>
                            <SelectItem value="team_leader">Team leader</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}