"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Building2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../app-context/auth-context";
import { supabase } from "../../../services/supabaseService";
import { getBranchByBarCode } from '../../../services/companyService'
import { useRouter } from "next/navigation";
import { PiSpinner } from "react-icons/pi";

function LoginForm() {
  const { loginCompany } = useAuth();
  const [formData, setFormData] = useState({
    branchCode: "",
    email: "",
    password: "",
  });
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEyeOn, setEyeOn] = useState(false);
  const [isBranch, setIsBranch] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function extractStoragePath(fullUrl) {
    const parts = fullUrl.split("/object/public/company-logos/");
    return parts[1]; // "images/company_logo_....png"
  }

  async function cacheCompanyLogo(path) {
    try {
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
    setError("");

    // Validate branch code if isBranch is true
    if (isBranch && !formData.branchCode?.trim()) {
      setError("Branch code is required.");
      setLoading(false);
      return;
    }

    try {
      const data = await loginCompany({
        email: formData.email,
        password: formData.password,
      });

      if (!data) return;
      const branch = getBranchByBarCode(formData?.branchCode?.trim(), data?.user?.id);

      if (branch) localStorage.setItem("branch_id", branch.id);

      alert("Login Successful!");
      await fetchLogoPathAndCache();

      router.push("/dashboard");

    } catch (error) {
      setLoading(false);
      setError(error.message);
    } finally {
      setLoading(false)
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleToggleChange = (e) => {
    setIsBranch(!isBranch);

    if (isBranch) {
      setFormData((prev) => ({ ...prev, branchCode: "" }));
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  useEffect(() => {
    const company_id = localStorage.getItem("company_id");
    if (company_id) {
      fetchLogoPathAndCache();
    }
  }, []);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md items-center justify-center rounded-2xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
        {/* Header Section */}
        <div className="text-center mb-4">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt="Company Logo"
                width={80}
                height={80}
                className="object-contain rounded-full elevation-2 shadow-lg"
              />
            ) : (
              <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Company Login</h1>
          <p className="text-gray-500 mt-2 text-sm">Access your company dashboard securely</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-md p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={isEyeOn ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your password"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer">
                {isEyeOn ? (
                  <button type="button" onClick={() => setEyeOn(false)}>
                    {formData.password.length <= 0 ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                ) : (
                  <button type="button" onClick={() => setEyeOn(true)}>
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isBranch"
                checked={isBranch}
                onChange={handleToggleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Sign in as Branch</span>
            </label>

            {isBranch && (
              <div className="relative mt-4 animate-slideIn">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="branchCode"
                  value={formData.branchCode}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter branch code"
                  required
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-white transition-colors ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              } focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {loading && <PiSpinner className="animate-spin h-5 w-5" />}
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don&apos;t have an account?{" "}
            <button
              onClick={handleRegister}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Register your company
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;