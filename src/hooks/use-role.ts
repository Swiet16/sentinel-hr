import { useAuthStore } from "@/store/auth-store";

export function useRole() {
  const role = useAuthStore((s) => s.role);
  return {
    role,
    isSuperAdmin: role === "super_admin",
    isTeamLeader: role === "team_leader",
    isEmployee: role === "employee",
    isManager: role === "super_admin" || role === "team_leader",
  };
}