import { supabase } from './supabaseService';

export const fetchCompanyDepartments = async (company_id) => {
  const { data, error } = await supabase
    .from("CompanyServicePoints")
    .select("*")
    .eq("company_id", company_id);

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  return data;
};
