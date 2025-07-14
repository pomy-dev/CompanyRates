"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowRight, X, Star, Clock, Phone, Mail } from "lucide-react";
import Image from "next/image";
import ratenow from "../../assets/images/ratenow.png";
import ratelater from "../../assets/images/ratelater.png";
import { useDataContext } from "../data-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useNotification } from "../components/ui/notification";

function UserDetailsScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  //global  data context :
  const { data, setData } = useDataContext();
const { phoneNumber, username, email } = data;
  const { notification } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleNext = () => {
    if (!username || !phoneNumber) {
      notification.validationError("name and phone number");
      return;
    }

    setShowDialog(true);
  };

  const handleRateNow = () => {
    notification.userSaved(username);
    router.push("/service-point");
  };

  const handleRateLater = () => {
    notification.smsSent(phoneNumber);
    router.push("/");
  };

  const handleModalCancel = () => {
    setShowDialog(false);
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
            <CardTitle className="text-3xl font-bold text-slate-800 mb-2">
              Tell us about yourself
            </CardTitle>
            <p className="text-slate-600 text-lg">
              We need a few details to personalize your experience
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
                onClick={handleNext}
                size="lg"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Bottom Sheet */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Choose Your Preference
            </DialogTitle>
            <p className="text-slate-600 text-center">How would you like to proceed with your rating?</p>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 mt-6">
            <Button
              onClick={handleRateNow}
              className="group  flex items-center justify-center gap-4 bg-gradient-to-r from-blue-600 to-purple-600
               hover:from-blue-700 hover:to-purple-700 text-white py-8 px-3 
               rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl  "
            >
              <div className="p-2 bg-white/20 rounded-full">
                <Star className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-bold">Rate Now</div>
                <div className="text-sm opacity-90 ">Complete your rating immediately</div>
              </div>
            </Button>
            
            <Button
              onClick={handleRateLater}
              variant="outline"
              className="group flex items-center justify-center gap-4 border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-800 py-8 px-3 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 bg-white hover:bg-slate-50"
            >
              <div className="p-2 bg-slate-100 rounded-full">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-bold">Rate Later</div>
                <div className="text-sm opacity-70">We'll send you a reminder via SMS</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UserDetailsScreen;
