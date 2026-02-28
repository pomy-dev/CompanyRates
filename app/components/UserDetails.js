"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowRight, Phone, Mail } from "lucide-react";
import { useDataContext } from "../data-context";
import { Button } from "./ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useNotification } from "./ui/notification";
import { FiCheck } from "react-icons/fi";
// local modules
import {
  insertUser,
  insertFeedback,
  insertOther,
} from "../../services/ratingService";
import { supabase } from "../../services/supabaseService";
import { DialogDescription } from "@radix-ui/react-dialog";

function UserDetailsScreen() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  // global data context
  const { data, setData } = useDataContext();
  const { phoneNumber, username, email } = data;
  const { notification } = useNotification();

  // New state for values that come from localStorage
  const [companyId, setCompanyId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Optional: show loading until we read storage

  // Load company_id and branch_id from localStorage **only in the browser**
  useEffect(() => {
    if (typeof window === "undefined") return; // extra safety (though useEffect already skips SSR)

    const storedCompany = localStorage.getItem("company_id");
    const storedBranch = localStorage.getItem("branch_id");

    setCompanyId(storedCompany);
    setBranchId(storedBranch);
    setIsLoading(false);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const cleaner = () => {
    localStorage.removeItem("ratingData");

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

  // check object if empty
  const isEmptyObject = (obj) => {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  };

  const sendUser = async (user_path) => {
    if (isLoading || !companyId) {
      notification.error("Company information not loaded yet. Please wait.");
      return false;
    }

    const userInfo = {
      name: data?.username,
      phone: data?.phoneNumber,
      email: data?.email,
      user_path: user_path || "rating_only",
      company_id: companyId,
      branch_id: branchId || null,
    };

    if (data?.username || data?.phoneNumber) {
      if (data?.sms) {
        const data1 = await insertUser({
          name: data?.username,
          phone: data?.phoneNumber,
          email: data?.email,
          company_id: companyId,
          branch_id: branchId || null,
          user_path: user_path,
          sms: "waiting",
        });

        if (!data1) return false;
        return "sms";
      }

      try {
        const result = await insertUser(userInfo);
        if (!result) return false;
        return result;
      } catch (error) {
        console.error("Failed to insert user:", error);
        notification.error("Error inserting user details");
        return false;
      }
    } else {
      notification.error("Make sure you have entered your details");
      return false;
    }
  };

  const sendFeedBack = async (userId, branchIdFromUser) => {
    if (!companyId) return;

    const newFeedback = {
      user_id: userId,
      comments: !isEmptyObject(data.comments) ? data.comments : null,
      suggestions: data.suggestionBox ? data.suggestionBox : null,
      ratingId: null,
      company_id: companyId,
      branch_id: branchIdFromUser || branchId,
    };

    try {
      const result = await insertFeedback(newFeedback);
      result && console.log("FeedBackData:", result);
    } catch (error) {
      console.error("Failed to insert feedback:", error);
    }
  };

  const submitData = async () => {
    if (isLoading || !companyId) {
      notification.error("Please wait while company information loads...");
      return;
    }

    try {
      const user =
        !isEmptyObject(data?.ratings) && !isEmptyObject(data?.suggestionBox)
          ? await sendUser("both")
          : !isEmptyObject(data?.suggestionBox) && isEmptyObject(data?.ratings)
            ? await sendUser("suggestion_only")
            : await sendUser("rating_only");

      if (user) {
        console.log("User from DB:", user);
        setShowDialog(true);

        if (!isEmptyObject(data?.ratings)) {
          const ratings_data = {
            p_company_id: companyId,
            p_branch_id: branchId,
            p_ratings: data?.formartedRatings,
            p_service_point: data?.servicePoint?.name,
            p_sms: false,
            p_user_id: user?.id,
            p_comments: data?.comments || {},
            p_suggestions: data?.suggestionBox || null,
          };

          try {
            let { error } = await supabase.rpc(
              "insert_multiple_ratings",
              ratings_data
            );

            if (error) throw error;

            notification.ratingSubmitted();
          } catch (error) {
            console.error("Failed to insert ratings:", error);
            notification.error("Failed to submit ratings");
          }
        }

        if (
          !isEmptyObject(data.suggestionBox) && isEmptyObject(data?.ratings)
        ) {
          try {
            await sendFeedBack(user?.id, user?.branch_id);
            notification.success("suggestion has been sent");
          } catch (error) {
            console.error("Failed to insert feedback:", error);
            notification.error("Failed to submit suggestion");
          }
        }

        if (
          !isEmptyObject(data.otherCriteria) &&
          data.otherCriteria?.otherRating !== 0
        ) {
          try {
            const otherCriterion = {
              user_id: user?.id,
              criteria: data.otherCriteria?.otherValue,
              ratings: data.otherCriteria?.otherRating,
              comments: data.otherCriteria?.otherReason,
              company_id: companyId,
              branch_id: user?.branch_id || branchId,
              department: data.otherCriteria?.otherDepartment,
            };

            const otherData = await insertOther(otherCriterion);
            otherData && console.log("Other Criterion data:", otherData);
          } catch (error) {
            console.error("Failed to insert otherCriterion Data:", error);
            notification.error("Failed to submit other-criterion rating");
          }
        }

        if (user === "sms") {
          notification.smsSent(data?.phoneNumber);
        }

        cleaner();
      }
    } catch (error) {
      console.error("Error in submitData:", error.message);
      notification.error("Something went wrong. Please try again.");
    } finally {
      setTimeout(() => {
        setShowDialog(false);
      }, 2000);
    }
  };

  // Show loading state while reading localStorage (prevents submit before values are ready)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading company information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-800">
              Tell us about yourself
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your full name"
                  name="username"
                  value={username}
                  onChange={handleChange}
                  className="h-12 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phoneNumber"
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  name="phoneNumber"
                  value={phoneNumber}
                  onChange={handleChange}
                  className="h-12 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  className="h-12 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-700">
                * Required fields help us provide better service
              </AlertDescription>
            </Alert>

            <div className="pt-4">
              <Button
                onClick={submitData}
                size="lg"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Submit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Success Popup */}
      <Dialog open={showDialog}>
        <DialogContent className="max-w-md text-center">
          <div className="p-8">
            <Avatar className="w-20 h-20 mx-auto mb-6">
              <AvatarFallback className="bg-green-500 text-white">
                <FiCheck className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>

            <h3 className="text-3xl font-bold text-slate-800 mb-4">
              Thank You!
            </h3>
            <p className="text-xl text-slate-600 mb-6">
              Your feedback has been submitted successfully.
            </p>

            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            </div>
            <p className="text-slate-500 mt-4">Redirecting...</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UserDetailsScreen;