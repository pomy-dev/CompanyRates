import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../../../../lib/server/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getRequestUser(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) return { error: "Missing bearer token.", status: 401 };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { error: "Missing Supabase public env variables.", status: 500 };
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return { error: "Invalid session.", status: 401 };
  return { user: data.user, status: 200 };
}

async function ensureSuperAdmin(request, adminClient) {
  const auth = await getRequestUser(request);
  if (auth.error) return auth;

  const userId = auth.user.id;
  const { data: company, error } = await adminClient
    .from("Companies")
    .select("id, company_name")
    .eq("id", userId)
    .single();

  if (error || !company) {
    return { error: "Super admin permission required.", status: 403 };
  }

  return { user: auth.user, company, status: 200 };
}

function formatRole(role) {
  if (!role) return "branch_admin";
  return String(role).toLowerCase().trim();
}

export async function GET(request) {
  try {
    const admin = getSupabaseAdminClient();
    const guard = await ensureSuperAdmin(request, admin);

    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const companyId = guard.company.id;
    const allUsers = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const users = data?.users || [];
      allUsers.push(...users);
      hasNext = users.length === 200;
      page += 1;
    }

    const companyAccounts = allUsers
      .filter((u) => {
        if (u.id === companyId) return true; // owner account
        return (
          u.user_metadata?.company_id === companyId &&
          u.user_metadata?.account_type === "staff"
        );
      })
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || "",
        role: u.id === companyId ? "super_admin" : (u.user_metadata?.role || "branch_admin"),
        phone: u.user_metadata?.phone || "",
        branch_id: u.user_metadata?.branch_id || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));

    return NextResponse.json({ data: companyAccounts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = getSupabaseAdminClient();
    const guard = await ensureSuperAdmin(request, admin);

    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const payload = await request.json();
    const email = payload?.email?.trim();
    const password = payload?.password;
    const phone = payload?.phone ? String(payload.phone).trim() : null;
    const fullName = payload?.name?.trim() || "";
    const role = formatRole(payload?.role);
    const branchId = payload?.branch_id ? Number(payload.branch_id) : null;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_id: guard.company.id,
        account_type: "staff",
        phone,
        role,
        branch_id: branchId,
        full_name: fullName,
      },
    });

    if (createError || !created?.user) {
      return NextResponse.json({ error: createError?.message || "Failed to create account." }, { status: 500 });
    }

    // Optional mirror row in existing users table for easier reporting.
    const mirrorPayload = {
      auth_id: created.user.id,
      user_name: fullName || email,
      phone: phone,
      role: role,
      company_id: guard.company.id,
      branch_id: branchId,
    };

    await admin.from("CompanyManagers").insert(mirrorPayload);

    return NextResponse.json({
      data: {
        id: created.user.id,
        email: created.user.email,
        name: fullName,
        phone,
        role,
        branch_id: branchId,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const admin = getSupabaseAdminClient();
    const auth = await getRequestUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const payload = await request.json();
    const targetUserId = payload?.user_id;
    const password = payload?.password;
    const role = payload?.role ? formatRole(payload.role) : null;
    const branchId = payload?.branch_id !== undefined
      ? (payload.branch_id ? Number(payload.branch_id) : null)
      : undefined;
    const fullName = payload?.name?.trim();

    if (!targetUserId) {
      return NextResponse.json({ error: "user_id is required." }, { status: 400 });
    }

    const callerId = auth.user.id;

    // Determine if caller is super admin (company owner account).
    const { data: callerCompany, error: callerCompanyErr } = await admin
      .from("Companies")
      .select("id")
      .eq("id", callerId)
      .single();

    const isSuperAdminCaller = !callerCompanyErr && !!callerCompany?.id;

    // Allow non-super-admin callers to update ONLY their own password.
    if (!isSuperAdminCaller) {
      if (targetUserId !== callerId) {
        return NextResponse.json({ error: "Not allowed." }, { status: 403 });
      }

      // Reject any attempt to update metadata/role/branch from non-super-admin.
      const allowedKeys = new Set(["user_id", "password"]);
      const incomingKeys = Object.keys(payload || {});
      const hasDisallowed = incomingKeys.some((k) => !allowedKeys.has(k));
      if (hasDisallowed) {
        return NextResponse.json(
          { error: "Non-super-admin can only update their password." },
          { status: 400 }
        );
      }

      if (!password) {
        return NextResponse.json({ error: "password is required." }, { status: 400 });
      }

      const { error: updateErr } = await admin.auth.admin.updateUserById(targetUserId, {
        password,
      });
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // From here on: super admin caller
    // Prevent modifying the super admin account's metadata (existing behavior).
    if (targetUserId === callerCompany?.id) {
      // If they are super admin and are trying to update their own password only, allow it.
      const nonPasswordKeys = Object.keys(payload || {}).filter((k) => k !== "user_id" && k !== "password");
      if (!(nonPasswordKeys.length === 0 && password)) {
        return NextResponse.json({ error: "Cannot modify super admin metadata here." }, { status: 400 });
      }
    }

    const { data: userData, error: getErr } = await admin.auth.admin.getUserById(targetUserId);
    if (getErr || !userData?.user) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }
    if (userData.user.user_metadata?.company_id !== callerCompany.id) {
      return NextResponse.json({ error: "User does not belong to your company." }, { status: 403 });
    }

    const metadata = {
      ...(userData.user.user_metadata || {}),
    };
    if (role) metadata.role = role;
    if (branchId !== undefined) metadata.branch_id = branchId;
    if (fullName !== undefined) metadata.full_name = fullName;

    const updates = {
      user_metadata: metadata,
    };
    if (password) updates.password = password;

    const { error: updateErr } = await admin.auth.admin.updateUserById(targetUserId, updates);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = getSupabaseAdminClient();
    const guard = await ensureSuperAdmin(request, admin);
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id");
    if (!targetUserId) {
      return NextResponse.json({ error: "user_id is required." }, { status: 400 });
    }
    if (targetUserId === guard.company.id) {
      return NextResponse.json({ error: "Super admin account cannot be deleted." }, { status: 400 });
    }

    const { data: userData, error: getErr } = await admin.auth.admin.getUserById(targetUserId);
    if (getErr || !userData?.user) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }
    if (userData.user.user_metadata?.company_id !== guard.company.id) {
      return NextResponse.json({ error: "User does not belong to your company." }, { status: 403 });
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(targetUserId);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
