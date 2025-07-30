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
  const formattedList = criteriaList.map((item) => ({
    title: item.title?.toLowerCase() || null,
    isRequired: item.isRequired ?? true,
    companyId: item.companyId || null,
    servicePointId: item.servicePointId || null,
  }));

  let { data, error } = await supabase.rpc("upsert_rating_criteria_bulk", {
    p_criteria_list: formattedList,
  });

  if (error) console.error(error);
  else console.log(data);
  return data
};

export const createServicePoint_RatingCriteria = async (hybridData) => {
  const { data, error } = await supabase
    .from('ServicePointRatingCriteria')
    .upsert(hybridData, {
      onConflict: ['service_point_id', 'rating_criteria_id'], // Specify the unique constraint columns
      ignoreDuplicates: true, // Skip duplicate insertions without updating
    })
    .select();

  if (error) {
    console.error('Error creating servicePoint with Criteria request:', error.message);
    throw error;
  }

  return data;
};

/**
 * Inserts new entries into the 'other' table.
 * 
 * @param {Object} branchData - The data to be inserted.
 * @param {string} branchData.branchName - The new branch name for the entry.
 * @param {number} branchData.branchCode - branch code for the entry.
 * @param {string} branchData.branchType - The branchType the entry.
 * @param {string} branchData.address - branch physical address to the entry.
 * @param {string} branchData.location - state, city or town of the branch.
 * @param {string} branchData.contactEmail - The email of the branch.
 * @param {string} branchData.contactPhone - The phone of the branch.
 * @param {boolean} branchData.isActive - active service point.
 * @param {string} branchData.manager - The manager name of the branch.
 * @param {Object[]} branchData.servicePoints - The selected servicePoints of the branch[].
 * 
 * @returns {Promise<Object>} - The result of the insert operation, including data or error.
 */
export const insertNewBranch = async (branchData) => {
  const { data, error } = await supabase
    .from('Branches')
    .insert(
      {
        company_id: branchData?.companyId,
        branch_name: branchData?.branchName,
        branch_code: branchData?.branchCode,
        branch_type: branchData?.branchType,
        location: branchData?.location,
        address: branchData?.address,
        contact_phone: branchData?.contactPhone,
        contact_email: branchData?.contactEmail,
        manager_name: branchData?.manager,
        is_active: branchData?.isActive
      }).select();

  if (error) {
    console.error('Error inserting into branches table:', error);
    throw error;
  }

  return data; // Return the inserted data
};
