import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../../../../lib/server/supabaseAdmin";

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
    .select("id")
    .eq("id", userId)
    .single();

  if (error || !company) {
    return { error: "Super admin permission required.", status: 403 };
  }

  return { user: auth.user, company, status: 200 };
}

function parseBranchId(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function DELETE(request) {
  // Destroy a single branch structure (branches + service points + criteria mappings for that branch)
  try {
    const adminClient = getSupabaseAdminClient();
    const guard = await ensureSuperAdmin(request, adminClient);
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { searchParams } = new URL(request.url);
    const branchId = parseBranchId(searchParams.get("branch_id"));
    const companyId = guard.company.id;

    if (!branchId) {
      return NextResponse.json({ error: "branch_id query param is required." }, { status: 400 });
    }

    // 1) Delete all collected rating/feedback data for that branch
    {
      const { error: ratingsErr } = await adminClient
        .from("ratings")
        .delete()
        .eq("company_id", companyId)
        .eq("branch_id", branchId);
      if (ratingsErr) throw ratingsErr;
    }
    {
      const { error: feedbackErr } = await adminClient
        .from("feedback")
        .delete()
        .eq("company_id", companyId)
        .eq("branch_id", branchId);
      if (feedbackErr) throw feedbackErr;
    }
    {
      const { error: otherErr } = await adminClient
        .from("other")
        .delete()
        .eq("company_id", companyId)
        .eq("branch_id", branchId);
      if (otherErr) throw otherErr;
    }
    {
      const { error: usersErr } = await adminClient
        .from("users")
        .delete()
        .eq("company_id", companyId)
        .eq("branch_id", branchId);
      if (usersErr) throw usersErr;
    }

    // 2) Fetch service points used by this branch (so we can delete their criteria mappings)
    const { data: branchSummary } = await adminClient.rpc("get_branch_summary", {
      p_company_id: companyId,
      p_branch_id: branchId,
    });

    const summaryObj = Array.isArray(branchSummary) ? branchSummary[0] : branchSummary;
    const servicePoints = summaryObj?.service_points || [];
    const servicePointIds = servicePoints
      .map((sp) => sp?.service_point_id)
      .filter(Boolean);

    // 3) Delete mappings + service points for that branch
    if (servicePointIds.length > 0) {
      const { error: mappingErr } = await adminClient
        .from("ServicePointRatingCriteria")
        .delete()
        .in("service_point_id", servicePointIds);
      if (mappingErr) throw mappingErr;

      const { error: servicePointsErr } = await adminClient
        .from("CompanyServicePoints")
        .delete()
        .in("id", servicePointIds);
      if (servicePointsErr) throw servicePointsErr;
    }

    // 4) Delete the branch itself
    await adminClient.from("Branches").delete().eq("company_id", companyId).eq("id", branchId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Reset/destroy entire company structure (all branches + their service points + criteria mappings)
  try {
    const adminClient = getSupabaseAdminClient();
    const guard = await ensureSuperAdmin(request, adminClient);
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const payload = await request.json().catch(() => ({}));
    const companyId = guard.company.id;

    const mode = payload?.mode || "reset_all";
    if (mode !== "reset_all") {
      return NextResponse.json({ error: "Unsupported mode." }, { status: 400 });
    }

    // 1) Fetch branches so we can destroy each branch's service points
    const { data: branchesSummary, error: branchesErr } = await adminClient.rpc("get_company_branches_summary", {
      p_company_id: companyId,
    });

    if (branchesErr) {
      return NextResponse.json({ error: branchesErr.message }, { status: 500 });
    }

    const branches = branchesSummary || [];
    const branchIds = branches.map((b) => b?.branch_id).filter((v) => v !== null && v !== undefined);

    // 2) Delete all collected rating/feedback data across all branches for this company
    {
      const { error: ratingsErr } = await adminClient
        .from("ratings")
        .delete()
        .eq("company_id", companyId);
      if (ratingsErr) throw ratingsErr;
    }
    {
      const { error: feedbackErr } = await adminClient
        .from("feedback")
        .delete()
        .eq("company_id", companyId);
      if (feedbackErr) throw feedbackErr;
    }
    {
      const { error: otherErr } = await adminClient
        .from("other")
        .delete()
        .eq("company_id", companyId);
      if (otherErr) throw otherErr;
    }
    {
      const { error: usersErr } = await adminClient
        .from("users")
        .delete()
        .eq("company_id", companyId);
      if (usersErr) throw usersErr;
    }

    // 3) Destroy service points + mappings for each branch
    for (const bId of branchIds) {
      const { data: branchSummary } = await adminClient.rpc("get_branch_summary", {
        p_company_id: companyId,
        p_branch_id: bId,
      });

      const summaryObj = Array.isArray(branchSummary) ? branchSummary[0] : branchSummary;
      const servicePoints = summaryObj?.service_points || [];
      const servicePointIds = servicePoints
        .map((sp) => sp?.service_point_id)
        .filter(Boolean);

      if (servicePointIds.length > 0) {
        const { error: mappingErr } = await adminClient
          .from("ServicePointRatingCriteria")
          .delete()
          .in("service_point_id", servicePointIds);
        if (mappingErr) throw mappingErr;

        const { error: servicePointsErr } = await adminClient
          .from("CompanyServicePoints")
          .delete()
          .in("id", servicePointIds);
        if (servicePointsErr) throw servicePointsErr;
      }
    }

    // 4) Delete all branches
    {
      const { error: branchesErr2 } = await adminClient
        .from("Branches")
        .delete()
        .eq("company_id", companyId);
      if (branchesErr2) throw branchesErr2;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

