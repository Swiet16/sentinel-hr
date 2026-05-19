import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Plane,
  TrendingUp,
  Activity,
  Plus,
  CalendarPlus,
  ClipboardCheck,
  Building2,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

const weekData = [
  { day: "Mon", present: 232, late: 14, absent: 6 },
  { day: "Tue", present: 241, late: 9, absent: 4 },
  { day: "Wed", present: 248, late: 12, absent: 4 },
  { day: "Thu", present: 236, late: 16, absent: 8 },
  { day: "Fri", present: 228, late: 18, absent: 9 },
  { day: "Sat", present: 102, late: 4, absent: 3 },
  { day: "Sun", present: 24, late: 1, absent: 1 },
];

const monthBars = Array.from({ length: 12 }, (_, i) => ({
  m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i],
  hours: 1400 + Math.round(Math.sin(i / 1.5) * 280 + Math.random() * 120),
}));

function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const [{ count: profiles }, { count: depts }, { data: recent }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("departments").select("*", { count: "exact", head: true }),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(8),
      ]);
      return {
        totalEmployees: profiles ?? 0,
        totalDepartments: depts ?? 0,
        recent: recent ?? [],
      };
    },
  });
}

function DashboardPage() {
  const { user, role } = useAuthStore();
  const { data } = useDashboardData();

  const totalEmployees = data?.totalEmployees ?? 0;
  const present = Math.max(0, Math.round(totalEmployees * 0.86));
  const late = Math.max(0, Math.round(totalEmployees * 0.06));
  const absent = Math.max(0, totalEmployees - present - late);
  const onLeave = Math.max(0, Math.round(totalEmployees * 0.04));

  const deptDonut = [
    { name: "Engineering", value: 38 },
    { name: "Design", value: 16 },
    { name: "Operations", value: 22 },
    { name: "Sales", value: 18 },
    { name: "HR", value: 6 },
  ];
  const donutColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Good {greeting()}, {user?.email?.split("@")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening across your workforce today.
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          <Activity className="mr-1.5 h-3 w-3 text-success" />
          {role?.replace("_", " ") ?? "user"} session active
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total employees" value={totalEmployees} icon={Users} tone="primary" delta="All time" delay={0} />
        <KpiCard label="Present today" value={present} icon={UserCheck} tone="success" delta="86% of workforce" delay={0.05} />
        <KpiCard label="Late today" value={late} icon={Clock} tone="warning" delta="6% of workforce" delay={0.1} />
        <KpiCard label="Absent today" value={absent} icon={UserX} tone="destructive" delta="Unapproved" delay={0.15} />
        <KpiCard label="On leave" value={onLeave} icon={Plane} tone="accent" delta="Approved" delay={0.2} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="p-5 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
              <div>
                <CardTitle className="text-base">Weekly attendance</CardTitle>
                <p className="text-xs text-muted-foreground">Present vs late vs absent</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" /> +4.2%
              </Badge>
            </CardHeader>
            <CardContent className="h-[280px] p-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="present" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gP)" />
                  <Area type="monotone" dataKey="late" stroke="var(--warning)" strokeWidth={2} fill="url(#gL)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="h-full p-5 shadow-soft">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base">Departments</CardTitle>
              <p className="text-xs text-muted-foreground">Headcount distribution</p>
            </CardHeader>
            <CardContent className="h-[280px] p-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptDonut} dataKey="value" innerRadius={56} outerRadius={84} paddingAngle={3} stroke="none">
                    {deptDonut.map((_, i) => (
                      <Cell key={i} fill={donutColors[i % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lower row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="p-5 shadow-soft">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base">Monthly work hours</CardTitle>
              <p className="text-xs text-muted-foreground">Total clocked hours across teams</p>
            </CardHeader>
            <CardContent className="h-[240px] p-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthBars} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={36} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="hours" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="p-5 shadow-soft">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base">Recent activity</CardTitle>
              <p className="text-xs text-muted-foreground">Latest workspace events</p>
            </CardHeader>
            <CardContent className="space-y-3 p-0">
              {(data?.recent?.length ?? 0) === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No activity yet. As your team uses Pulse, events will stream in here.
                </div>
              )}
              {data?.recent?.map((r) => (
                <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.entity ?? "system"} • {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction icon={Plus} label="Add employee" to="/app/employees" tint="primary" />
        <QuickAction icon={ClipboardCheck} label="Mark attendance" to="/app/attendance" tint="success" />
        <QuickAction icon={CalendarPlus} label="Create shift" to="/app/shifts" tint="accent" />
        <QuickAction icon={Building2} label="New department" to="/app/departments" tint="warning" />
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
  tint,
}: {
  icon: typeof Plus;
  label: string;
  to: string;
  tint: "primary" | "success" | "accent" | "warning";
}) {
  const tints: Record<string, string> = {
    primary: "from-primary/15 to-primary/0 text-primary",
    success: "from-success/20 to-success/0 text-success",
    accent: "from-accent/20 to-accent/0 text-accent",
    warning: "from-warning/20 to-warning/0 text-warning",
  };
  return (
    <Link to={to}>
      <Card className="group relative cursor-pointer overflow-hidden p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
        <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tints[tint]} opacity-60 blur-2xl transition group-hover:opacity-90`} />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Quick action</div>
            <div className="mt-1 text-lg font-semibold">{label}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}