"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheck } from "react-icons/fi";

//local modules
import { useDataContext } from "../data-context";
import {
  insertUser,
  insertRating,
  insertFeedback,
  insertOther,
} from "../../services/ratingService";

import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import { MessageSquare } from "lucide-react";
import { useNotification } from "../components/ui/notification";

const Feedback = () => {
  // const [feedback, setFeedback] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter(); ''
  const company_id = localStorage.getItem('company_id')

  const { data, setData } = useDataContext();
  const { suggestionBox, criteria } = data;
  const { notification } = useNotification();

  const [userData, setUserData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const cleaner = () => {
    localStorage.removeItem('ratingData');

    setTimeout(() => {
      setData({
        username: "",
        phoneNumber: "",
        servicePoint: "",
        criteria: [],
        ratings: {},
        email: "",
        comments: {},
        suggestionBox: "",
      });
      router.push("/");
    }, 5000);
  };

  //check object if emty :
  const isEmptyObject = (obj) => {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false; // Object has at least one key
      }
    }
    return true; // No keys found
  };

  const sendUser = async () => {
    const userInfo = {
      name: data?.username,
      phone: data?.phoneNumber,
      email: data?.email
    }

    try {
      const data = await insertUser(userInfo);

      if (!data) return 'User is null after supposed insertion';

      return data;

    } catch (error) {
      console.error("Failed to insert user:", error);
      return error
    }
  }

  const sendNormalRating = async (userId) => {
    const newRating = {
      companyId: company_id,
      rating: data.ratings, // Example JSON rating
      user_id: userId,
      sms: true,
      servicePoint: data.servicePoint?.name, // Optional chaining to prevent errors
    };

    try {
      const result = await insertRating(userData?.id, newRating);

      if (result) {
        // Check if data.comments or suggestionBox exists
        if (
          !isEmptyObject(data.comments) ||
          (data.suggestionBox && data.suggestionBox.trim() !== "")
        ) {
          const newFeedback = {
            comments: !isEmptyObject(data.comments) ? data.comments : null,
            suggestions: data.suggestionBox ? data.suggestionBox : null,
            ratingId: result[0].id,
            company_id: company_id,
          };

          try {
            const result2 = await insertFeedback(newFeedback);
          } catch (error) {
            console.error("Failed to insert feedback:", error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to insert rating:", error);
    }
  };

  const submitData = async () => {
    try {
      if (data?.username || data?.phoneNumber) {
        const user = await sendUser();
        setUserData(user)
        userData && console.log(`User Id from DB: ${userData?.id}`)
      }
    } catch (error) {
      console.error("Failed to insert user:", error);
      notification.error("Failed to insert user");
    }

    try {
      if (userData) {
        setShowPopup(true);

        if (!isEmptyObject(data.ratings)) {
          try {
            const ratingData = await sendNormalRating(userData?.id);
            ratingData && console.log(`Rating data: ${ratingData}`)
            notification.ratingSubmitted();
          } catch (error) {
            console.error("Failed to insert ratings:", error);
            notification.error("Failed to submit ratings");
          }
        }

        if (data.suggestionBox && data.suggestionBox?.trim() !== "") {
          try {
            const newFeedback = {
              comments: null,
              suggestions: data.suggestionBox ? data.suggestionBox : null,
              ratingId: null,
              company_id: company_id,
            };
            const feedbackData = await insertFeedback(userData?.id, newFeedback);
            feedbackData && console.log(`Suggestion data: ${feedbackData}`)
          } catch (error) {
            console.error("Failed to insert suggestions:", error);
            notification.error("Failed to submit suggestions");
          }
        }

        if (!isEmptyObject(data.otherCriteria)) {
          try {
            const otherCriterion = [
              {
                criteria: data.otherCriteria?.otherValue,
                ratings: data.otherCriteria?.otherRating,
                comments: data.otherCriteria?.otherReason,
                company_id: company_id,
                department: data.otherCriteria?.otherDepartment
              },
            ];
            const otherData = await insertOther(userData?.id, otherCriterion);
            otherData && console.log(`Other Criterion data: ${otherData}`)
          } catch (error) {
            console.error("Failed to insert otherCriterion Data:", error);
            notification.error("Failed to submit other-criterion rating");
          }
        }

        cleaner();
        setUserData(null)
        setTimeout(() => { setShowPopup(false) }, 2000);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      notification.error("Something went wrong. Please try again.");
    }
  }

  // const handleSubmit = async () => {
  //   // Ensure data is available before proceeding
  //   console.log(`Company Id Verify: ${company_id}`)

  //   try {
  //     if (data?.username || data?.phoneNumber) {
  //       const userData = await sendUser();

  //       userData && console.log(`User Id from DB: ${userData?.id}`)

  //       if (isEmptyObject(data.otherCriteria)) {
  //         setShowPopup(true);
  //         await sendNormalRating(userData?.id);
  //         notification.ratingSubmitted();
  //         cleaner();
  //         setTimeout(() => { setShowPopup(false) }, 2000);
  //       } else {
  //         setShowPopup(true);
  //         const otherCriterion = [
  //           {
  //             criteria: data.otherCriteria?.otherValue,
  //             ratings: data.otherCriteria?.otherRating,
  //             comments: data.otherCriteria?.otherReason,
  //             company_id: company_id,
  //             department: data.otherCriteria?.otherDepartment
  //           },
  //         ];

  //         try {
  //           if (data.suggestionBox && data.suggestionBox?.trim() !== "") {
  //             const newFeedback = {
  //               comments: null,
  //               suggestions: data.suggestionBox ? data.suggestionBox : null,
  //               ratingId: null,
  //               company_id: company_id,
  //             };

  //             try {
  //               const feedbackData = await insertFeedback(userData?.id, newFeedback);
  //               feedbackData && console.log(`Suggestion data: ${feedbackData}`)
  //             } catch (error) {
  //               console.error("Failed to insert feedback:", error);
  //               notification.error("Failed to submit feedback");
  //             }
  //           }

  //           const result = await insertOther(otherCriterion);

  //           if (result && !isEmptyObject(data.ratings)) {
  //             await sendNormalRating(userData?.id);
  //             notification.ratingSubmitted();
  //             cleaner();
  //           } else {
  //             notification.ratingSubmitted();
  //             cleaner();
  //           }
  //         } catch (error) {
  //           console.error("Failed to insert entries:", error);
  //           notification.error("Failed to submit your feedback. Please try again.");
  //         }
  //         setTimeout(() => { setShowPopup(false) }, 2000);
  //       }
  //     }

  //   } catch (error) {
  //     console.error("Error submitting feedback:", error);
  //     notification.error("Something went wrong. Please try again.");
  //   }
  // };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
            Share Your Suggestion
          </CardTitle>
          <p className="text-slate-600">
            Your thoughts help us improve our service
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <div className="space-y-6">
            {/* Simple Feedback Form */}
            <div>
              <Textarea
                value={suggestionBox}
                name="suggestionBox"
                onChange={handleChange}
                rows={6}
                placeholder="What could we improve? Any suggestions?"
                className="w-full text-base resize-none border-2 border-slate-200 focus:border-blue-500 rounded-lg p-4 transition-all duration-300"
                style={{
                  fontSize: "16px",
                  touchAction: "manipulation",
                }}
                autoComplete="off"
                autoCorrect="on"
                spellCheck="true"
              />
              <p className="text-sm text-slate-500 mt-2 text-center">
                {suggestionBox?.length || 0} characters • Optional but appreciated
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                onClick={submitData}
                size="lg"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Submit Suggestion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Success Popup */}
      <Dialog open={showPopup}>
        <DialogContent className="max-w-md text-center">
          <div className="p-8">
            {/* Success Icon */}
            <Avatar className="w-20 h-20 mx-auto mb-6">
              <AvatarFallback className="bg-green-500 text-white">
                <FiCheck className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <DialogTitle></DialogTitle>

            {/* Success Message */}
            <h3 className="text-3xl font-bold text-slate-800 mb-4">
              Thank You!
            </h3>
            <p className="text-xl text-slate-600 mb-6">
              Your feedback has been submitted successfully.
            </p>

            {/* Loading indicator */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            </div>
            <p className="text-slate-500 mt-4">Redirecting...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feedback;
