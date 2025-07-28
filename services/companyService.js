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
