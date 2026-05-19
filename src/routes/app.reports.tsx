import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/app/reports")({ component: ReportsPage });

const COLORS = ["#1e3a5f", "#3b6fa0", "#5cbdb9", "#c9a84c", "#e85d3a", "#a78bfa"];

function ReportsPage() {
  const { data: attendance } = useQuery({
    queryKey: ["att_30"],
    queryFn: async () => (await supabase.from("attendance_records").select("date,status").gte("date", format(subDays(new Date(), 30), "yyyy-MM-dd"))).data ?? [],
  });
  const { data: profiles } = useQuery({
    queryKey: ["profiles_full"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, department_id, status")).data ?? [],
  });
  const { data: depts } = useQuery({
    queryKey: ["dept_lite"],
    queryFn: async () => (await supabase.from("departments").select("id,name")).data ?? [],
  });
  const { data: leaves } = useQuery({
    queryKey: ["leaves_all_min"],
    queryFn: async () => (await supabase.from("leave_requests").select("status")).data ?? [],
  });

  // Attendance by day
  const byDay: Record<string, number> = {};
  (attendance ?? []).forEach((r: any) => { byDay[r.date] = (byDay[r.date] ?? 0) + 1; });
  const attendanceData = Object.entries(byDay).map(([d, c]) => ({ date: format(new Date(d), "MMM d"), count: c })).slice(-14);

  // Department headcount
  const deptData = (depts ?? []).map((d: any) => ({
    name: d.name,
    value: (profiles ?? []).filter((p: any) => p.department_id === d.id).length,
  })).filter((d: any) => d.value > 0);

  // Leave status
  const leaveCounts = (leaves ?? []).reduce((acc: any, r: any) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {});
  const leaveData = Object.entries(leaveCounts).map(([k, v]) => ({ name: k, value: v }));

  const exportCsv = (rows: any[], name: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; a.click();
  };

  const totalEmp = (profiles ?? []).length;
  const activeEmp = (profiles ?? []).filter((p: any) => p.status === "active").length;

  return (
    <div>
      <PageHeader title="Reports" description="Operational insights across attendance, leave and headcount."
        actions={<Button variant="outline" onClick={() => exportCsv(attendance ?? [], "attendance")}><Download className="mr-1.5 h-4 w-4" />Export attendance</Button>} />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total employees", value: totalEmp },
          { label: "Active", value: activeEmp },
          { label: "Leave requests", value: (leaves ?? []).length },
          { label: "Departments", value: (depts ?? []).length },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold">{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Attendance — last 14 days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b6fa0" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Headcount by department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 font-semibold">Leave requests breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveData} layout="vertical">
                <XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#5cbdb9" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}