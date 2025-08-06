import { supabase } from './supabaseService';

export const fetchCompanyDepartments = async (company_id) => {
  const { data, error } = await supabase
    .from('service_point_criteria_view')
    .select("*")
    .eq("company_id", company_id);

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  return data;
};

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
    console.error('Error finding service point request:', servicePointError.message);
    throw servicePointError;
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

  console.log('Grouped data for company:', data);

  return data;
}