import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  PalmtreeIcon,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  Bell,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";

const main = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, exact: true },
  { title: "Employees", url: "/app/employees", icon: Users },
  { title: "Departments", url: "/app/departments", icon: Building2 },
  { title: "Attendance", url: "/app/attendance", icon: Clock },
  { title: "Shifts", url: "/app/shifts", icon: CalendarDays },
];

const ops = [
  { title: "Leaves", url: "/app/leaves", icon: PalmtreeIcon },
  { title: "Payroll", url: "/app/payroll", icon: Wallet },
  { title: "Reports", url: "/app/reports", icon: BarChart3 },
];

const system = [
  { title: "Notifications", url: "/app/notifications", icon: Bell },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const role = useAuthStore((s) => s.role);

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-sidebar-foreground">Pulse</div>
              <div className="text-[11px] text-sidebar-foreground/60">Workforce OS</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <Section label="Workspace" items={main} isActive={isActive} collapsed={collapsed} />
        <Section label="Operations" items={ops} isActive={isActive} collapsed={collapsed} />
        <Section label="System" items={system} isActive={isActive} collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        {!collapsed && (
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs">
            <div className="text-sidebar-foreground/70">Signed in as</div>
            <div className="mt-0.5 font-medium capitalize text-sidebar-foreground">
              {role ? role.replace("_", " ") : "—"}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function Section({
  label,
  items,
  isActive,
  collapsed,
}: {
  label: string;
  items: { title: string; url: string; icon: typeof LayoutDashboard; exact?: boolean }[];
  isActive: (u: string, e?: boolean) => boolean;
  collapsed: boolean;
}) {
  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}