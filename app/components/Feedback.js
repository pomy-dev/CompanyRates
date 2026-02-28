"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
//local modules
import { useDataContext } from "../data-context";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "../components/ui/textarea";
import { MessageSquare } from "lucide-react";

const Feedback = () => {
  const router = useRouter();
  const { data, setData } = useDataContext();
  const { suggestionBox, criteria } = data;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const submitData = async () => {
    console.log("Submitting data:", data?.formartedRatings);
    router.push("/user-details");
  }

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
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
