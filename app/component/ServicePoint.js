"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  X,
  Building2,
  Users

} from "lucide-react";

import { FaStar } from "react-icons/fa";

//local modules
import { useDataContext } from "../data-context";
import { iconMap } from "../../utils/iconSelector";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

function ServiceScreen() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [selectedService, setSelectedService] = useState(null); // Stores full option object { name, icon }
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherValue, setOtherValue] = useState("");
  const [otherRating, setOtherRating] = useState(0);
  const [otherReason, setOtherReason] = useState("");
  const [options, setOptions] = useState([]);

  //global  data context :
  const { data, setData } = useDataContext();

  useEffect(() => {
    const cached = localStorage.getItem("cachedDepartments");
    if (cached) {
      const parsed = JSON.parse(cached);
      const enriched = parsed.map((item) => ({
        ...item,
        icon: iconMap[item.iconName] || iconMap["FcCollaboration"],
      }));
      setOptions(enriched);
    }
  }, []);

  useEffect(() => {
    const cleanData = {
      ...data,
      servicePoint: data.servicePoint ? { name: data.servicePoint.name } : null,
    };
    localStorage.setItem("ratingData", JSON.stringify(cleanData));
  }, [data]);

  const handleChange = () => {
    setData((prevData) => {
      const updates = { ...prevData };

      if (selectedService) {
        updates.servicePoint = selectedService;
      }

      if (selectedCriteria && selectedCriteria.length > 0) {
        updates.criteria = selectedCriteria;
      }
      return updates;
    });
  };

  const fallbackCriteria = [
    "Cleanliness",
    "Language Use",
    "Waiting Time",
    "Overall Impression",
    "Other",
  ];

  const criteriaList = (() => {
    const rawList =
      selectedService?.ratingCriteria?.map((item) => item.title) ||
      fallbackCriteria;
    const filtered = rawList.filter((title) => title.toLowerCase() !== "other");
    return [...filtered, "Other"];
  })();


  const handleSelectService = (option) => {
    setSelectedService(option);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCriteria([]);
    setSelectedService(null);
  };

  const handleNext = () => {
    handleChange();
    router.push("/rate");
  };

  const handleBack = () => {
    router.back();
  };

  const handleSelectCriterion = (criterion) => {
    if (criterion === "Other") {
      setShowOtherModal(true);
      return;
    }
    setSelectedCriteria((prev) =>
      prev.includes(criterion)
        ? prev.filter((item) => item !== criterion)
        : [...prev, criterion]
    );
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim() || otherRating > 0 || otherReason.trim()) {
      // 2. Update global context (criteria + ratings + suggestionBox)
      setData((prevData) => ({
        ...prevData,
        criteria: [...(prevData.criteria || [])],
        ratings: {
          ...(prevData.ratings || {}),
        },
        comments: {
          ...(prevData.comments || {}),
        },
        otherCriteria: {
          otherValue,
          otherRating,
          otherReason,
          otherDepartment :selectedService.name,
        },
      }));

      // Check if "Other" was chosen alone or with other criteria. If it is alone, redirect to feedback page, but if not alone, the popup disapears.
      if (selectedCriteria.length === 0) {
        setShowOtherModal(false);
        setOtherValue("");
        setOtherRating(0);
        setOtherReason("");
        router.push("/feedback");
      } else {
        setShowOtherModal(false);
        setOtherValue("");
        setOtherRating(0);
        setOtherReason("");
      }
    }
  };

  const handleOtherCancel = () => {
    setShowOtherModal(false);
    setOtherValue("");
    setOtherRating(0);
    setOtherReason("");
    setData((prevData) => ({
      ...prevData,
      otherCriteria: {
        otherValue: "",
        otherRating: "",
        otherReason: "",
        otherDepartment :"",
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="w-10 h-10 rounded-full hover:bg-white/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center space-x-3">
          <Building2 className="w-6 h-6 text-slate-600" />
          <span className="text-lg font-semibold text-slate-800">Service Selection</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main className="px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Select Service Department
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the department you'd like to rate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {options.map((option) => (
              <Card 
                key={option.name}
                className="group cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-white/80 backdrop-blur-sm"
                onClick={() => handleSelectService(option)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                    <span className="text-2xl">{option.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {option.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Click to select and rate
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

        {/* Modal for Rating Criteria */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl py-8 px-4 max-w-5xl w-full max-h-[85vh] relative shadow-2xl border border-white/20">
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              {/* Modal Content */}
              <div className="text-center overflow-y-auto max-h-[75vh] pt-4">
                {/* Service Icon and Name */}
                <div className="flex items-center justify-center mb-6">
                  <span className="text-4xl mr-4">{selectedService?.icon}</span>
                  <h2 className="text-4xl font-bold text-slate-800">
                    Rate {selectedService?.name}
                  </h2>
                </div>
                <p className="text-slate-500 text-xl mb-8">
                  Criteria selected: [
                  {selectedCriteria.length > 0 ? selectedCriteria.length : "0"}]
                </p>
                <div className="flex justify-center mb-10">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 max-w-4xl place-items-center">
                  {criteriaList.map((criterion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectCriterion(criterion)}
                      className={`py-4 px-4 rounded-2xl font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 relative w-full text-center ${
                        selectedCriteria.includes(criterion)
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-blue-600"
                          : "bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {criterion}
                      {selectedCriteria.includes(criterion) && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                  </div>
                </div>
                <div className="flex justify-between items-center max-w-lg mx-auto pt-4 mb-6">
                  <button
                    onClick={handleCloseModal}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-800 font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={selectedCriteria.length === 0}
                    className={`inline-flex items-center gap-3 px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                      selectedCriteria.length > 0
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for "Other" Criterion */}
        {showOtherModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full relative shadow-2xl border border-white/20">
              <button
                onClick={handleOtherCancel}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-2xl font-bold mb-6 text-slate-800 pt-2">
                Specify Your Own Criterion
              </h2>
              <input
                type="text"
                className="w-full border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 shadow-sm rounded-xl px-4 py-3 mb-6 text-lg"
                placeholder="Enter your criterion"
                value={otherValue}
                onChange={(e) => setOtherValue(e.target.value)}
              />
              <div className="mb-6">
                <span className="block mb-3 font-semibold text-slate-700 text-lg">
                  Rate this criterion:
                </span>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      size={32}
                      className={`cursor-pointer transition-all duration-200 hover:scale-110 ${
                        star <= otherRating
                          ? "text-yellow-400"
                          : "text-slate-300 hover:text-yellow-200"
                      }`}
                      onClick={() => setOtherRating(star)}
                    />
                  ))}
                </div>
              </div>
              <textarea
                className="w-full border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 shadow-sm rounded-xl p-4 mb-6 text-lg min-h-[100px] resize-none"
                placeholder="Explain about your specified criterion"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
              />
              <div className="flex justify-between gap-4">
                <button
                  onClick={handleOtherCancel}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-800 font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOtherSubmit}
                  disabled={
                    !otherValue.trim() ||
                    otherRating === 0 ||
                    !otherReason.trim()
                  }
                  className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    otherValue.trim() && otherRating > 0 && otherReason.trim()
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}

export default ServiceScreen;



[{"id" : 2, "title" : "Friendliness", "description" : null, "isRequired" : true, "displayOrder" : 1, "isActive" : true},
   {"id" : 3, "title" : "Functionable", "description" : null, "isRequired" : true, "displayOrder" : 2, "isActive" : true}]
