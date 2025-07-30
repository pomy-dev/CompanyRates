"use client";

import React, { useState } from "react";
import { X, ChevronDown, ChevronUp, Upload, Image } from "lucide-react";
import { useAuth } from "../../../app-context/auth-context";
import { PiSpinner } from "react-icons/pi";
import { supabase } from "../../../services/supabaseService";
import { uploadFileToStorage } from "../../../services/uploadFile";

function RegistrationForm({ onRegister, onBack }) {
  let [currentStep, setCurrentStep] = useState(1);
  let [formData, setFormData] = useState({
    company_name: "",
    location: "",
    password: "",
    confirmPassword: "",
    industry: "",
    contactEmail: "",
    contactPhone: "",
    logoFile: null, // Store the File object
  });
  let [logoPreviewUrl, setLogoPreviewUrl] = useState(""); // Separate state for preview
  let [servicePoints, setServicePoints] = useState([]);
  let [tempServicePoint, setTempServicePoint] = useState({
    name: "",
    department: "",
    isActive: true,
    ratingCriteria: [],
  });
  let [tempRatingCriteria, setTempRatingCriteria] = useState({
    title: "",
    isRequired: false,
  });
  let [expandedServicePoints, setExpandedServicePoints] = useState({});
  let [showModal, setShowModal] = useState(false);
  let [loading, setLoading] = useState(false);
  let { registerCompany } = useAuth();

  //create rating critea using supabase emthods :
  const createRatingCriteria = async (criteriaList) => {
    // Ensure the input is a valid JSONB array
    const formattedList = criteriaList.map((item) => ({
      title: item.title || null,
      isRequired: item.isRequired ?? true,
      companyId: item.companyId || null,
      servicePointId: item.servicePointId || null,
    }));

    let { data, error } = await supabase.rpc("upsert_rating_criteria_bulk", {
      p_criteria_list: formattedList,
    });

    if (error) console.error(error);
    else console.log(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      setLoading(false);
      return;
    }

    let publicUrl = "";
    if (formData.logoFile) {
      // Generate a unique file name (e.g., using timestamp or UUID)
      const fileName = `company_logo_${Date.now()}.${formData.logoFile.name
        .split(".")
        .pop()}`;
      publicUrl = await uploadFileToStorage(
        `images/${fileName}`,
        formData.logoFile
      );
      if (!publicUrl) {
        alert("Failed to upload logo");
        setLoading(false);
        return;
      }
    }

    const companyData = {
      ...formData,
      logoUrl: publicUrl, // Use the public URL from Supabase
      servicePoints: servicePoints.map((sp, index) => ({
        ...sp,
        id: `sp${index + 1}`,
        ratingCriteria: sp.ratingCriteria.map((rc, rcIndex) => ({
          ...rc,
          id: `rc${index + 1}-${rcIndex + 1}`,
        })),
      })),
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.contactEmail,
        password: formData.password,
      });

      if (error) throw error;

      await registerCompany({
        data,
        ...companyData,
      });

      const allRatingCriteria = companyData.servicePoints.flatMap(
        (sp) => sp.ratingCriteria
      );
      console.log(allRatingCriteria);

      createRatingCriteria(allRatingCriteria);

      setLoading(false);
      alert("Your Company Has been uploaded successfully.");

      // Store company logo URL in localStorage
      localStorage.setItem("companyLogo", publicUrl);
      console.log(companyData);

      // Reset all fields and go back to step one
      setShowModal(false);
      setExpandedServicePoints({});
      setTempRatingCriteria({ title: "", isRequired: false });
      setTempServicePoint({
        name: "",
        department: "",
        isActive: true,
        ratingCriteria: [],
      });
      setServicePoints([]);
      setFormData({
        company_name: "",
        location: "",
        password: "",
        confirmPassword: "",
        industry: "",
        contactEmail: "",
        contactPhone: "",
        logoFile: null,
      });
      setLogoPreviewUrl("");
      setCurrentStep(1);
    } catch (error) {
      setLoading(false);
      alert(error.message);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local URL for preview
      const previewUrl = URL.createObjectURL(file);
      setLogoPreviewUrl(previewUrl);
      setFormData({
        ...formData,
        logoFile: file, // Store the File object
      });
    }
  };

  const removeLogo = () => {
    setFormData({
      ...formData,
      logoFile: null,
    });
    setLogoPreviewUrl("");
    // Revoke the object URL to free memory
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTempServicePointChange = (field, value) => {
    setTempServicePoint({
      ...tempServicePoint,
      [field]: value,
    });
  };

  const handleTempRatingCriteriaChange = (field, value) => {
    setTempRatingCriteria({
      ...tempRatingCriteria,
      [field]: value,
    });
  };

  const saveRatingCriteria = () => {
    if (!tempRatingCriteria.title.trim()) {
      alert("Please enter a criterion title.");
      return;
    }
    setTempServicePoint({
      ...tempServicePoint,
      ratingCriteria: [
        ...tempServicePoint.ratingCriteria,
        { ...tempRatingCriteria },
      ],
    });
    setTempRatingCriteria({ title: "", isRequired: false });
  };

  const removeRatingCriteria = (index) => {
    setTempServicePoint({
      ...tempServicePoint,
      ratingCriteria: tempServicePoint.ratingCriteria.filter(
        (_, i) => i !== index
      ),
    });
  };

  const isModalShown = (isShown) => {
    setShowModal(isShown);
  };

  const saveServicePoint = () => {
    if (!tempServicePoint.name.trim() || !tempServicePoint.department.trim()) {
      alert("Please enter both service name and department.");
      return;
    }
    if (tempServicePoint.ratingCriteria.length === 0) {
      alert("Please add at least one rating criterion.");
      return;
    }
    setServicePoints([...servicePoints, { ...tempServicePoint }]);
    setTempServicePoint({
      name: "",
      department: "",
      isActive: true,
      ratingCriteria: [],
    });

    setShowModal(false);
  };

  const removeServicePoint = (index) => {
    setServicePoints(servicePoints.filter((_, i) => i !== index));
    setExpandedServicePoints((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const toggleExpandServicePoint = (index) => {
    setExpandedServicePoints((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const nextStep = () => {
    if (currentStep === 2) {
      if (servicePoints.length === 0) {
        alert(
          "Please save at least one service point with rating criteria before proceeding."
        );
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => setCurrentStep(currentStep - 1);

  return (
    <div className="w-full bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center p-2 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl shadow-xl p-2">
          <div className="justify-center items-center">
            <div className="flex flex-col items-center justify-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Get Your Company Rated
              </h1>
              <p className="text-gray-600 items-center justify-center">
                Step {currentStep} of 3
              </p>
            </div>

            <div className="flex items-center justify-center mb-4">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step <= currentStep
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 2 && (
                    <div
                      className={`w-16 h-1 ${
                        step < currentStep ? "bg-emerald-600" : "bg-gray-300"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Company Information
                  </h2>

                  {/* Logo Upload Section */}
                  <div className="bg-gray-50 rounded-xl p-1 border-2 border-dashed border-gray-300">
                    <h3 className="text-lg font-medium text-gray-900">
                      Company Logo
                    </h3>

                    {logoPreviewUrl ? (
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <img
                            src={logoPreviewUrl}
                            alt="Company Logo Preview"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Logo uploaded successfully
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Click the X to remove and upload a different logo
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                        <label className="cursor-pointer">
                          <span className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors inline-flex items-center">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Enter your company name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="City, State/Country"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry *
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        required
                      >
                        <option value="">Select Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Education">Education</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="contact@company.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder=""
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Create a secure password"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="w-5xl space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Service Points
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Set your Service-Points and their Rating-Criteria
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Input Form */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Name *
                          </label>
                          <input
                            type="text"
                            value={tempServicePoint.name}
                            onChange={(e) =>
                              handleTempServicePointChange(
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                            placeholder="e.g., Customer Support, Technical Consultation"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department *
                          </label>
                          <input
                            type="text"
                            value={tempServicePoint.department}
                            onChange={(e) =>
                              handleTempServicePointChange(
                                "department",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                            placeholder="e.g., Support, Sales, Engineering"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={tempServicePoint.isActive}
                          onChange={(e) =>
                            handleTempServicePointChange(
                              "isActive",
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Service is currently active
                        </span>
                      </label>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Rating Criteria
                      </h4>
                      {tempServicePoint.ratingCriteria.length > 0 && (
                        <div className="space-y-2 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {tempServicePoint.ratingCriteria.map(
                            (criterion, critIndex) => (
                              <div
                                key={critIndex}
                                className="flex justify-between items-center bg-white rounded-lg px-2 py-1 border border-gray-200"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {criterion.title}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {criterion.isRequired
                                      ? "Required"
                                      : "Optional"}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeRatingCriteria(critIndex)
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Criterion Title *
                            </label>
                            <input
                              type="text"
                              value={tempRatingCriteria.title}
                              onChange={(e) =>
                                handleTempRatingCriteriaChange(
                                  "title",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                              placeholder="e.g., Response Time, Professionalism"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={tempRatingCriteria.isRequired}
                                onChange={(e) =>
                                  handleTempRatingCriteriaChange(
                                    "isRequired",
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Required for rating
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={saveRatingCriteria}
                              className="bg-blue-500 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={saveServicePoint}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {/* Right Column: Preview Section */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Service Points Preview
                      </h3>
                      {servicePoints.length === 0 ? (
                        <div className="text-center text-gray-500">
                          <p>No service points added yet.</p>
                          <p className="text-sm mt-2">
                            Add a service point to see it here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {servicePoints.map((sp, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {sp.name}
                                </h4>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => editServicePoint(index)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded-lg transition-colors"
                                  >
                                    <svg
                                      className="h-5 w-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleExpandServicePoint(index)
                                    }
                                    className="text-blue-600 hover:text-blue-700 p-1 rounded-lg transition-colors"
                                  >
                                    {expandedServicePoints[index] ? (
                                      <ChevronUp className="h-5 w-5" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeServicePoint(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                Department: {sp.department}
                              </p>
                              <p className="text-sm text-gray-600">
                                Status: {sp.isActive ? "Active" : "Inactive"}
                              </p>
                              {expandedServicePoints[index] &&
                                sp.ratingCriteria.length > 0 && (
                                  <div className="mt-3">
                                    <h5 className="font-medium text-gray-900 mb-2">
                                      Rating Criteria
                                    </h5>
                                    <div className="space-y-2">
                                      {sp.ratingCriteria.map(
                                        (criterion, critIndex) => (
                                          <div
                                            key={critIndex}
                                            className="flex justify-between items-center bg-gray-100 rounded-lg p-2"
                                          >
                                            <div>
                                              <p className="text-sm font-medium text-gray-800">
                                                {criterion.title}
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                {criterion.isRequired
                                                  ? "Required"
                                                  : "Optional"}
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors shadow-sm"
                    >
                      Previous
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      {loading && <PiSpinner className="animate-spin" />}
                      Finish
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;
