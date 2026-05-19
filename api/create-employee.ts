import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Database type subset for the server function
type AppRole = "super_admin" | "team_leader" | "employee";

interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: { id: string; user_id: string; role: AppRole; created_at: string };
        Insert: { id?: string; user_id: string; role: AppRole; created_at?: string };
      };
      profiles: {
        Row: {
          id: string; user_id: string; full_name: string | null; phone: string | null;
          avatar_url: string | null; status: string; department_id: string | null;
          job_title: string | null; base_salary: number | null; created_at: string; updated_at: string;
        };
        Update: {
          full_name?: string | null; phone?: string | null; job_title?: string | null;
          base_salary?: number | null; department_id?: string | null; status?: string;
        };
      };
    };
  };
}

const inviteEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  departmentId: z.union([z.string().uuid(), z.literal("")]).nullable().optional().transform(v => v === "" ? null : v),
  baseSalary: z.number().min(0).max(100000000).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  role: z.enum(["employee", "team_leader"]).default("employee"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[API] Missing Supabase environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Verify auth token
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  // Create authenticated Supabase client
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  // Verify the user's token
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  const userId = userData.user.id;

  // Check if the caller is a super_admin
  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (roleError) {
    return res.status(500).json({ error: roleError.message });
  }

  const isSuperAdmin = (roles ?? []).some((entry: { role: AppRole }) => entry.role === "super_admin");
  if (!isSuperAdmin) {
    return res.status(403).json({ error: "Only super admins can add employees" });
  }

  // Validate input
  let data;
  try {
    data = inviteEmployeeSchema.parse(req.body);
  } catch (validationError) {
    return res.status(400).json({ error: "Invalid input", details: validationError });
  }

  // Create admin client for user creation
  const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  // Check if email already exists
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const alreadyExists = existingUser.users.some(
    (user) => user.email?.toLowerCase() === data.email.toLowerCase(),
  );

  if (alreadyExists) {
    return res.status(409).json({ error: "A user with this email already exists" });
  }

  // Create auth user
  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.fullName },
  });

  if (createError || !createdUser.user) {
    return res.status(500).json({ error: createError?.message ?? "Failed to create employee user" });
  }

  const newUserId = createdUser.user.id;

  // Update the auto-created profile
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: data.fullName,
      phone: data.phone?.trim() || null,
      job_title: data.jobTitle?.trim() || null,
      department_id: data.departmentId ?? null,
      base_salary: data.baseSalary ?? 0,
      status: data.status,
    })
    .eq("user_id", newUserId);

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  // Update role: delete the auto-created "employee" role row first,
  // then insert the correct role if it's not "employee".
  if (data.role !== "employee") {
    const { error: roleDeleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", newUserId)
      .eq("role", "employee");

    if (roleDeleteError) {
      return res.status(500).json({ error: roleDeleteError.message });
    }

    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: data.role });

    if (roleInsertError) {
      return res.status(500).json({ error: roleInsertError.message });
    }
  }

  return res.status(201).json({ userId: newUserId });
}
