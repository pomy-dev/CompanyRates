import id from 'zod/v4/locales/id.cjs';
import { supabase } from './supabaseService';

export const insertServicePoint = async (companyId, servicePoint) => {
  const { data, error } = await supabase
    .from('CompanyServicePoints')
    .insert({
      company_id: companyId,
      servicepoint: servicePoint?.name,
      department: servicePoint?.department,
      isActive: servicePoint?.isActive
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating service point request:', error.message);
    throw error;
  }

  return data;
}

//create rating critea using supabase emthods :
export const createRatingCriteria = async (criteriaList) => {
  // Ensure the input is a valid JSONB array
  const formattedList = criteriaList?.map((item) => ({
    title: item.title?.toLowerCase() || null,
    isRequired: item.isRequired ?? true
  }));

  const { data, error } = await supabase.rpc("upsert_rating_criteria_bulk", {
    p_criteria_list: formattedList,
  });

  if (error) console.error(error);
  else console.log(`returned criteria picked: ${data}`);

  return data
};

export const createServicePoint_RatingCriteria = async (hybridData) => {
  const { data, error } = await supabase
    .from('ServicePointRatingCriteria')
    .upsert(hybridData, {
      onConflict: ['service_point_id', 'rating_criteria_id'],
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    console.error('Error creating servicePoint with Criteria request:', error.message);
    throw error;
  }

  return data;
};

export const getCompanyServicePointCriteria = async (companyId) => {
  const { data, error } = await supabase
    .from('Companies')
    .select(`
      *,
      CompanyServicePoints (
        *,
        ServicePointRatingCriteria (
          RatingCriteria:rating_criteria_id (
            id,
            title
          )
        )
      )
    `)
    .eq('id', companyId)
    .single()

  if (error) {
    console.error('Error finding service point request:', error.message);
    throw error;
  }

  return data;
};

export const insertNewBranch = async (companyId, branchData) => {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const formatBranchInput = {
    company_id: companyId?.trim(),
    branch_name: branchData.branchName,
    branch_code: branchData.branchCode,
    location: branchData.location,
    address: branchData.address,
    contact_phone: branchData.contactPhone,
    contact_email: branchData.contactEmail,
    manager_name: branchData.manager,
    branch_type: branchData.branchType,
    service_points: branchData.servicePoints
      ?.map((sp) =>
        sp.criteria.map((c) => ({
          service_point_id: sp.id,
          rating_criteria_id: c.id,
        }))
      )
      .flat()
  };

  // Log the input for debugging
  console.log('Branch Input for RPC:', formatBranchInput);

  // Use the formatted input in the RPC call
  const { data, error } = await supabase.rpc(
    "create_branch_with_service_points",
    { p_input: formatBranchInput }
  );

  if (error) {
    console.error('Error inserting into branches table:', error);
    throw error;
  }

  return data;
};

export const fetchBranches = async (companyId) => {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  // Retrieve branches' services points and criteria
  const { data, error } = await supabase
    .rpc('get_company_branches_summary', { p_company_id: companyId });

  if (error) {
    console.error('Error fetching branches grouped data:', error.message);
    return;
  }

  // console.log('Company Branches + Service Points + Criteria:', data);

  return data;
}

export const fetchBranchSummary = async (companyId, branchId) => {
  if (!companyId || !branchId) {
    throw new Error('Something went, Company/Branch Id is missing');
  }

  // Retrieve branches' services points and criteria
  const { data, error } = await supabase
    .rpc('get_branch_summary', { p_company_id: companyId, p_branch_id: parseInt(branchId) });

  if (error) {
    console.error('Error fetching branch summary data:', error.message);
    return;
  }

  return data[0];
}

export const getBranchByBarCode = async (branchCode, companyId) => {
  if (!companyId || !branchCode) return;

  const { data, error } = await supabase
    .from('Branches')
    .select('id, branch_code, branch_name')
    .eq('company_id', companyId)
    .eq('branch_code', branchCode)
    .single();

  if (error) {
    console.error('Error fetching branch data:', error.message);
    return;
  }

  // console.log('Branch By Branch Code', data);

  return data;
}

export const getRatingsByCriteriaIds = async (criteriaIds, branchId) => {
  if (!criteriaIds || criteriaIds.length === 0) return [];

  // 3. Fetch all ratings in one query filtered by company + branch
  const { data, error } = await supabase
    .from("ratings")
    .select("rating_criteria_id, score")
    .eq("branch_id", branchId)
    .in("rating_criteria_id", criteriaIds);

  if (error) {
    console.error("Error fetching ratings:", error);
    return;
  }

  return data;
}

export const getRatings = async (companyId, branchId) => {
  if (!branchId) return [];

  const { data, error } = await supabase
    .from("ratings")
    .select(`
      id,
      service_point,
      score,
      created_at,
      criteria:rating_criteria_id (
        id,
        title
      ),
      user:user_id (
        id,
        name,
        phone
      )
    `)
    .eq("company_id", companyId)
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ratings:", error.message);
    return [];
  }

  // Group by service_point + user.id + created_at (rating episode)
  const ratingEpisodes = data.reduce((acc, curr) => {
    const key = `${curr.service_point}-${curr.user?.id}-${curr.created_at.split("T")[0]}-${curr.created_at}`;
    if (!acc[key]) {
      acc[key] = {
        id: curr.id,
        created_at: curr.created_at,
        service_point: curr.service_point,
        user: {
          id: curr.user?.id,
          full_name: curr.user?.name,
          phone_number: curr.user?.phone
        },
        criteria: [],
        totalScore: 0,
        count: 0
      };
    }

    acc[key].criteria.push({
      id: curr?.criteria?.id,
      name: curr?.criteria?.title,
      score: curr.score
    });

    if (curr.score !== null) {
      acc[key].totalScore += curr.score;
      acc[key].count += 1;
    }

    return acc;
  }, {});

  // Convert to array and calculate average
  const result = Object.values(ratingEpisodes).map(ep => ({
    id: ep.id,
    service_point: ep.service_point,
    user: ep.user,
    criteria: ep.criteria,
    averageScore: ep.count ? (ep.totalScore / ep.count)?.toFixed(2) : 0,
    created_at: ep.created_at
  }));

  return result || [];
}