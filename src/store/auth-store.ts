import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "team_leader" | "employee";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  roleLoading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setRole: (role: AppRole | null) => void;
  setRoleLoading: (v: boolean) => void;
  setInitialized: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  roleLoading: false,
  initialized: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setRole: (role) => set({ role }),
  setRoleLoading: (roleLoading) => set({ roleLoading }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () => set({ session: null, user: null, role: null }),
}));