"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Building2, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../../app-context/auth-context";
import { supabase } from "../../../services/supabaseService";
import { useRouter } from "next/navigation";
import { PiSpinner } from "react-icons/pi";

// Removed TypeScript interface LoginFormProps because this is a JavaScript file.

function LoginForm() {
  const { loginCompany } = useAuth();
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
  });
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function extractStoragePath(fullUrl) {
    const parts = fullUrl.split("/object/public/company-logos/");
    console.log("rrrr");
    console.log(parts);
    return parts[1]; // "images/company_logo_....png"
  }

  async function cacheCompanyLogo(path) {
    try {
      // 1. Download the image as a blob
      const { data, error } = await supabase.storage
        .from("company-logos")
        .download(path);

      if (error) throw error;

      const base64 = await convertBlobToBase64(data);

      localStorage.setItem("company_logo_base64", base64);

      return base64;
    } catch (err) {
      console.error("Failed to cache logo:", err.message);
      return null;
    }
  }

  function convertBlobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read blob as base64"));
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  const fetchLogoPathAndCache = async () => {
    const company_id = localStorage.getItem("company_id");
    const { data, error } = await supabase
      .from("Companies")
      .select("logoUrl")
      .eq("id", company_id)
      .single();

    if (data?.logoUrl) {
      const path = extractStoragePath(data.logoUrl);
      const base64Logo = await cacheCompanyLogo(path);
      if (base64Logo) setCompanyLogo(base64Logo);
    }
  };

  useEffect(() => {
    const storedLogo = localStorage.getItem("company_logo_base64");

    if (storedLogo) setCompanyLogo(storedLogo);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      // You may want to fetch the email based on companyName/location, or use email directly
      const { data, error } = await loginCompany({
        email: formData.email,
        password: formData.password,
      });
      setLoading(false);
      if (!data) setError(error);

      alert("Login Successfully!");
      fetchLogoPathAndCache();
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      alert(error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* <div className="w-full max-w-md"> */}
      <div className="rounded-2xl shadow-xl p-2">
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt="Company Logo"
                width={150}
                height={150}
                className="inline-flex items-center justify-center rounded-lg"
              />
            ) : (
              <Building2 className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Company Login</h1>
          <p className="text-gray-600 mt-2">Access your company dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter company name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center gap-2 justify-center bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading && <PiSpinner className="animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don t have an account?{" "}
            <button
              onClick={handleRegister}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Register your company
            </button>
          </p>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
}

export default LoginForm;
