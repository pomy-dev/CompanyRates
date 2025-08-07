"use client";
import { useRouter } from "next/navigation";
import {
  Star,
  ArrowRight,
  Menu,
  Building2,
  Boxes,
  Heart,
  Users,
  TrendingUp,
  MessageSquare,
  LockKeyhole,
  Clock
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { fetchCompanyDepartments } from "../../services/companyService";
import { getIconForDepartment } from "../../utils/iconSelector";
import { Button } from "../components/ui/button";
import { Card, CardContent, } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
//local modules
import { useDataContext } from "../data-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useNotification } from "../components/ui/notification";

function WelcomeScreen() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [companyLogo, setCompanyLogo] = useState(null);

  //global  data context :
  const { setData } = useDataContext();

  //show dailog :
  const [showDialog, setShowDialog] = useState(false);
  const { notification } = useNotification();

  // const fetchAndCacheDepartments = async () => {
  //   const company_id = localStorage.getItem("company_id");
  //   const departments = await fetchCompanyDepartments(company_id);

  //   const enriched = departments.map((item) => ({
  //     servicePointId:item.service_point_id,
  //     name: item.servicepoint,
  //     department: item.department,
  //     servicePoint: item.servicepoint,
  //     iconName: getIconForDepartment(item.department).iconName, // Save icon name
  //     companyId: item.company_id,
  //     isActive:item.isActive,
  //     ratingCriteria: item.rating_criteria,
  //   }));

  //   localStorage.setItem("cachedDepartments", JSON.stringify(enriched));
  // };

  useEffect(() => {
    const logoBase64 = localStorage?.getItem("company_logo_base64");
    if (logoBase64) {
      setCompanyLogo(logoBase64);
    }

    if (!localStorage?.getItem("cachedDepartments")) {
      fetchAndCacheDepartments();
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // getCompanyLogo();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogin = () => {
    setMenuOpen(false);
    router.push("/login");
  };

  const handleRegister = () => {
    setMenuOpen(false);
    router.push("/register");
  };

  const handleStart = () => {
    setShowDialog(true);
  };

  const handleRateNow = () => {
    // notification.userSaved(username);
    router.push("/service-point");
  };

  const handleRateLater = () => {
    setData((prevData) => ({ ...prevData, "sms": true }));
    router.push("/user-details");
  };

  const handleDirectFeedback = () => {
    router.push("/feedback");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          {companyLogo ? (
            <Image
              src={companyLogo}
              className="rounded-lg"
              alt="Company Logo"
              width={40}
              height={40}
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <span className="text-lg font-semibold text-slate-800">
            Rating System
          </span>
        </div>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>

            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full hover:bg-white/50 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-48" align="end">

            <DropdownMenuItem onClick={handleLogin}>
              <Building2 className="w-4 h-4 mr-2" />
              Admin Login
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleRegister}>
              <Users className="w-4 h-4 mr-2" />
              Register Company
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
                <Star className="w-12 h-12 text-white fill-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              We Value Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                Feedback!
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-2xl mx-auto">
              "Rate our service and share your suggestions!"
            </p>

            <div className="flex gap-4 flex-wrap justify-center">
              <Button
                onClick={handleStart}
                size="lg"
                className="group inline-flex items-center gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Star className="w-5 h-5" />
                Start Rating
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                onClick={handleDirectFeedback}
                size="lg"
                variant="outline"
                className="group inline-flex items-center gap-3 px-8 py-6 text-lg font-semibold border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <MessageSquare className="w-5 h-5" />
                Leave Suggestion
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="border-0 shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  Easy to Use
                </h3>
                <p className="text-slate-600 text-sm">
                  Simple and intuitive rating process
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  Real Impact
                </h3>
                <p className="text-slate-600 text-sm">
                  Your feedback helps us improve
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LockKeyhole className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">secured</h3>
                <p className="text-slate-600 text-sm">
                  We prioritize your privacy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog Bottom Sheet */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Choose Your Preference
            </DialogTitle>
            <p className="text-slate-600 text-center">
              How would you like to proceed with your rating?
            </p>
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
                <div className="text-sm opacity-90 ">
                  Complete your rating immediately
                </div>
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
                <div className="text-sm opacity-70">
                  We'll send you a reminder via SMS
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WelcomeScreen;
