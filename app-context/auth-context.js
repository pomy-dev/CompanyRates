'use client'

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseService";
import { createRatingCriteria, insertServicePoint, createServicePoint_RatingCriteria } from '../services/companyService'
import { elements } from "chart.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Register a company (sign up)
  const registerCompany = async ({ data, ...companyData }) => {

    try {
      if (data.user) {
        const companyId = data.user.id;

        // get company data
        const name = companyData.company_name;
        const location = companyData.location;
        const industry = companyData.industry;
        const email = companyData.contactEmail;
        const phone = companyData.contactPhone;
        const logoUrl = companyData.logoUrl;

        const { error: insertError } = await supabase
          .from('Companies')
          .insert([{ id: companyId, company_name: name, location, industry, contactEmail: email, contactPhone: phone, logoUrl }]);

        if (insertError) {
          console.error('Error inserting user:', insertError.message)
          return { error: true, msg: insertError.details || insertError.message };
        }

        // get Service Points of the company
        const servicePoints = companyData.servicePoints || [{}]
        console.log(servicePoints)

        servicePoints.forEach(async element => {
          try {
            const insertedServicePoint = await insertServicePoint(companyId, element)

            const allRatingCriteria = companyData?.servicePoints?.flatMap(
              (sp) => sp.ratingCriteria
            );

            if (!insertedServicePoint) return;

            const ratingCriterions = await createRatingCriteria(allRatingCriteria);

            ratingCriterions.forEach(async criterion => {
              const servicePoint_ratingCriteria = {
                service_point_id: insertedServicePoint?.id,
                rating_criteria_id: criterion?.criteria_id,
                is_required: criterion?.is_required
              };

              const servicePointRatingCriteriaHybrid = await createServicePoint_RatingCriteria(servicePoint_ratingCriteria);
              console.log(servicePointRatingCriteriaHybrid)

            });

            console.log('Inserted Service Points:', data);

            return data;

          } catch (error) {
            console.error('Error in service points:', error);
            throw error;
          }
        });

        return { error: false, msg: 'Registration successful!' };
      } else {
        return {
          error: false,
          msg: 'Check your email to complete registration.',
        };
      }
    } catch (err) {
      return { error: true, msg: err.message || 'Something went wrong' };
    }
  };

  // Login with company credentials
  const loginCompany = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // set company id to localStorage
    localStorage.setItem("company_id", data.user.id);

    //deleting to force cache miss in welcome page
    localStorage.removeItem("cachedDepartments");
    localStorage.removeItem("company_logo_base64")

    return data;
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, registerCompany, loginCompany, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);