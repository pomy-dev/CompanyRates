"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaStar, FaRegCreditCard } from "react-icons/fa";
import {
  FiArrowLeft,
  FiArrowRight,
  FiShoppingBag,
  FiMessageCircle,
} from "react-icons/fi";
import { FcCollaboration, FcEngineering } from "react-icons/fc";
import { useDataContext } from "../data-context";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

const serviceIcons = {
  "Customer Service": <FcCollaboration />,
  "Technical Support": <FcEngineering />,
  "Sales Department": <FiShoppingBag />,
  "Billing & Accounts": <FaRegCreditCard />,
};

function SelectRatings() {
  const [ratings, setRatings] = useState({}); // Fix: Initialize as object, not array
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [commentModal, setCommentModal] = useState({
    open: false,
    criterion: "",
    text: "",
  });
  const router = useRouter();
  const { data, setData } = useDataContext();
  const { servicePoint, criteria, otherCriteria } = data;

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("ratingData");
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed);
      if (parsed.ratings) {
        setRatings(parsed.ratings); // Load ratings from context
      }
    }
  }, [setData]);

  // Set local service & criteria
  useEffect(() => {
    if (servicePoint) {
      setSelectedService({
        name: servicePoint.name,
        icon: serviceIcons[servicePoint.name] || null,
      });
    }

    if (criteria) {
      const extendedCriteria = [...criteria];

      // Only add "Other" if otherCriteria exists and has a valid otherValue
      if (otherCriteria?.otherValue) {
        extendedCriteria.push(`Other: ${otherCriteria.otherValue.substring(0, 5) + '...'}`);
      }

      setSelectedCriteria(extendedCriteria);

      setRatings((prev) => {
        const newRatings = { ...prev };
        extendedCriteria.forEach((criterion) => {
          if (!newRatings[criterion]) {
            newRatings[criterion] = 0; // Initialize rating for each criterion
          }
        });
        // If otherCriteria exists, set its rating
        if (
          otherCriteria?.otherValue &&
          otherCriteria?.otherRating &&
          !newRatings[`Other: ${otherCriteria.otherValue.substring(0, 5) + '...'}`]
        ) {
          newRatings[`Other: ${otherCriteria.otherValue.substring(0, 5) + '...'}`] =
            otherCriteria.otherRating;
        }
        return newRatings;
      });
    }
  }, [servicePoint, criteria, otherCriteria]);

  const handleRating = (criterion, index) => {
    const updatedRatings = {
      ...ratings,
      [criterion]: index,
    };

    setRatings(updatedRatings);

    if (otherCriteria?.otherValue && criterion === `Other: ${otherCriteria.otherValue.substring(0, 5) + '...'}`) {
      setData((prev) => {
        const updated = {
          ...prev,
          otherCriteria: {
            ...prev.otherCriteria,
            otherRating: index,
          },
        };
        localStorage.setItem("ratingData", JSON.stringify(updated));
        return updated;
      });
    } else {
      // Store in global ratings
      const filteredRatings = { ...updatedRatings };
      if (otherCriteria?.otherValue) {
        delete filteredRatings[`Other: ${otherCriteria.otherValue.substring(0, 5) + '...'}`]; // Ensure 'Other' is not included
      }

      setData((prev) => {
        const updated = {
          ...prev,
          ratings: filteredRatings,
        };
        localStorage.setItem("ratingData", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleOpenCommentModal = (criterion) => {
    let existingComment = data.comments?.[criterion] || "";
    // If it's the "Other" criterion, use otherCriteria.otherReason
    if (
      otherCriteria?.otherValue &&
      criterion === `Other: ${otherCriteria.otherValue.substring(0, 5) + "..."}`
    ) {
      existingComment = otherCriteria.otherReason || "";
    }
    setCommentModal({ open: true, criterion, text: existingComment });
  };

  const handleCommentChange = (e) => {
    setCommentModal((prev) => ({
      ...prev,
      text: e.target.value,
    }));
  };

  const handleSaveComment = () => {
    if (
      otherCriteria?.otherValue &&
      commentModal.criterion === `Other: ${otherCriteria.otherValue.substring(0, 5) + "..."}`
    ) {
      // Update otherCriteria.otherReason
      const updated = {
        ...data,
        otherCriteria: {
          ...data.otherCriteria,
          otherReason: commentModal.text,
        },
      };
      setData(updated);
      localStorage.setItem("ratingData", JSON.stringify(updated));
    } else {
      const updatedComments = {
        ...(data.comments || {}),
        [commentModal.criterion]: commentModal.text,
      };

      const updated = {
        ...data,
        comments: updatedComments,
      };

      setData(updated);
      localStorage.setItem("ratingData", JSON.stringify(updated));
    }
    setCommentModal({ open: false, criterion: "", text: "" });
  };

  const handleNext = () => {
    router.push("/feedback");
  };

  const isNextDisabled = selectedCriteria.some(
    (criterion) =>
      (!otherCriteria?.otherValue || criterion !== `Other: ${otherCriteria.otherValue.substring(0, 5) + '...'}`) &&
      (!ratings[criterion] || ratings[criterion] === 0)
  );

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center p-3 overflow-hidden">
      <Card className="backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl max-w-3xl w-full animate-fade-in-up">
        <CardContent className="p-8 text-center">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                {selectedService?.icon ? (
                  <span className="text-white text-2xl">{selectedService.icon}</span>
                ) : (
                  <FaStar className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Rate Your Experience
            </h1>
            {selectedService && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-slate-600 text-lg">Service:</span>
                <Badge variant="outline" className="text-lg px-4 py-2 bg-blue-50 border-blue-200 text-blue-700">
                  {selectedService.name}
                </Badge>
              </div>
            )}
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Please rate each criterion based on your experience
            </p>
          </div>

          {/* Criteria List */}
          <div className="space-y-6 max-w-2xl mx-auto overflow-y-auto max-h-96">
            {selectedCriteria.map((criterion) => (
              <Card
                key={criterion}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-evenly p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:border-blue-300"
              >
                <span className="text-lg font-semibold text-slate-800 mb-2 sm:mb-0 min-w-0 flex-1">
                  {criterion}
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <FaStar
                      key={index}
                      size={30}
                      className={`cursor-pointer transition-all duration-200 hover:scale-110 ${index <= ratings[criterion]
                        ? "text-yellow-400"
                        : "text-slate-300"
                        }`}
                      onClick={() => handleRating(criterion, index)}
                    />
                  ))}
                </div>
                <div className="flex-1 flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenCommentModal(criterion)}
                    className="flex items-center text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200 font-medium"
                  >
                    <FiMessageCircle className="mr-1 w-4 h-4" />
                    Comment
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center max-w-lg mx-auto mt-12 mb-6">
            <Button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-800 font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Button>

            <Button
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${isNextDisabled
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                }`}
            >
              Continue
              <FiArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comment Modal */}
      <Dialog open={commentModal.open} onOpenChange={(open) => !open && setCommentModal({ open: false, criterion: "", text: "" })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-2 text-slate-800">
              Comment on {commentModal.criterion}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={commentModal.text}
            onChange={handleCommentChange}
            rows={4}
            className="w-full text-base"
            placeholder="Enter your comment..."
          />
          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() =>
                setCommentModal({ open: false, criterion: "", text: "" })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveComment}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SelectRatings;