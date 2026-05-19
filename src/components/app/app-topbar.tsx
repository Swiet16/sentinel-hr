import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Moon, Search, Sun, User } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

function useCrumb() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0 || parts[0] !== "app") return "Dashboard";
  if (parts.length === 1) return "Dashboard";
  return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
}

export function AppTopbar() {
  const { theme, toggle } = useThemeStore();
  const { user, role } = useAuthStore();
  const navigate = useNavigate();
  const crumb = useCrumb();

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth/login" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl">
      <SidebarTrigger className="-ml-1" />
      <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
        <span>Pulse</span>
        <span className="text-border">/</span>
        <span className="font-medium text-foreground">{crumb}</span>
      </div>
      <div className="relative ml-auto hidden w-72 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search employees, shifts…" className="pl-9" />
      </div>
      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full p-1 transition hover:bg-muted">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="text-sm font-medium">{user?.email}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="capitalize">{role?.replace("_", " ") ?? "user"}</Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
            <User className="mr-2 h-4 w-4" /> Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}