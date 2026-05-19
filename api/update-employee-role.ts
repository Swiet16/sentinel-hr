import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

type AppRole = "super_admin" | "team_leader" | "employee";

interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: { id: string; user_id: string; role: AppRole; created_at: string };
        Insert: { id?: string; user_id: string; role: AppRole };
      };
    };
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Verify caller is super_admin
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const isSuperAdmin = (roles ?? []).some((r: { role: AppRole }) => r.role === "super_admin");
  if (!isSuperAdmin) {
    return res.status(403).json({ error: "Only super admins can update roles" });
  }

  const { targetUserId, newRole } = req.body;

  if (!targetUserId || !newRole || !["employee", "team_leader"].includes(newRole)) {
    return res.status(400).json({ error: "Invalid targetUserId or newRole" });
  }

  // Use admin client to modify roles
  const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  // Delete existing employee/team_leader roles
  const { error: deleteError } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", targetUserId)
    .in("role", ["employee", "team_leader"]);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  // Insert new role
  const { error: insertError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: targetUserId, role: newRole });

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  return res.status(200).json({ success: true });
}
