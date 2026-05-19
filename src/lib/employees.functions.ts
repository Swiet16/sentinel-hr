import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const inviteEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  baseSalary: z.number().min(0).max(100000000).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  role: z.enum(["employee", "team_leader"]).default("employee"),
});

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inviteEmployeeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roleError) {
      throw new Error(roleError.message);
    }

    const isSuperAdmin = (roles ?? []).some((entry) => entry.role === "super_admin");
    if (!isSuperAdmin) {
      throw new Error("Only super admins can add employees");
    }

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const alreadyExists = existingUser.users.some(
      (user) => user.email?.toLowerCase() === data.email.toLowerCase(),
    );

    if (alreadyExists) {
      throw new Error("A user with this email already exists");
    }

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (createError || !createdUser.user) {
      throw new Error(createError?.message ?? "Failed to create employee user");
    }

    const newUserId = createdUser.user.id;

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
      throw new Error(profileError.message);
    }

    if (data.role !== "employee") {
      const { error: roleInsertError } = await supabaseAdmin.from("user_roles").insert({
        user_id: newUserId,
        role: data.role,
      });

      if (roleInsertError) {
        throw new Error(roleInsertError.message);
      }
    }

    return { userId: newUserId };
  });
