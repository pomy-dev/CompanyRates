"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../services/supabaseService";
import { getAllUsersByCompanyBranchId } from "../../../services/ratingService";
import {
  Building2, LogOut, Star, MessageSquare, BarChart3, CheckSquare, Lightbulb, Target,
  MapPin, Plus, Search, ChevronDown, Menu, X, Users, DoorClosedLocked, Shield, KeyRound,
  Trash2, Boxes,
} from "lucide-react";
import { useAuth } from "../../../app-context/auth-context";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { PiSpinner } from "react-icons/pi";
import { Pie, Bar } from "react-chartjs-2";
import BranchModal from "./BranchModal";
import LoadingModal from "./loadingModal";
import {
  getCompanyServicePointCriteria, insertNewBranch, fetchBranches,
  getRatingsByCriteriaIds, getRatings
} from "../../../services/companyService";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [companyData, setCompanyData] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [otherData, setOtherData] = useState([]);
  const [totalRatings, setTotalRatings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const { companyUser, loading: logoutCompany, logoutAdminUser, registerManager } = useAuth();
  const [recentComments, setRecentComments] = useState([]);
  const companyId = companyUser?.user_metadata?.company_id || companyUser?.id;
  const isSuperAdmin = !!companyUser && companyId === companyUser?.id;
  const userDisplayName = companyUser?.user_metadata?.full_name || companyUser?.email || "User";
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState("");
  const [filterCriteria, setFilterCriteria] = useState("all");
  const [filterServicePoint, setFilterServicePoint] = useState("all");
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isTabsMoreOpen, setIsTabsMoreOpen] = useState(false);

  const selectedBranchName =
    branches?.find(
      (b) => String(b.branch_id) === String(selectedBranchId)
    )?.branch_name || "";

  const [distribution, setDistribution] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

  const [allBranchesMonth, setAllBranchesMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [allBranchesUniqueFeedbackers, setAllBranchesUniqueFeedbackers] = useState({
    total: 0,
    byBranchId: {},
    comparePrevTotalDelta: null,
    comparePrevTotalPct: null,
  });

  const [feedbackMonthlySeries, setFeedbackMonthlySeries] = useState({
    months: [],
    totalByMonth: [],
    byBranchIdByMonth: {},
  });

  const [compareMonths, setCompareMonths] = useState(() => {
    const now = new Date();
    const b = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const a = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    return { a, b };
  });

  const [adminAccounts, setAdminAccounts] = useState([]);
  const [adminAccountsLoading, setAdminAccountsLoading] = useState(false);
  const [adminAccountCreating, setAdminAccountCreating] = useState(false);
  const [adminAccountsError, setAdminAccountsError] = useState("");

  const [newAccount, setNewAccount] = useState({
    email: "",
    password: "",
    name: "",
    role: "branch_admin",
    phone: "",
    branch_id: "",
  });

  const [editAccount, setEditAccount] = useState(null); // { id, email, name, role, branch_id }
  const [editPassword, setEditPassword] = useState("");
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [myPassword, setMyPassword] = useState("");
  const [myPasswordLoading, setMyPasswordLoading] = useState(false);
  const [myPasswordSuccess, setMyPasswordSuccess] = useState("");

  const [companyStructureLoading, setCompanyStructureLoading] = useState(false);
  const [companyStructureError, setCompanyStructureError] = useState("");

  const [adminUser, setAdminUser] = useState(null);
  const [adminUserType, setAdminUserType] = useState(null);

  // Add these states
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(true);
  const [adminLoginEmail, setAdminLoginEmail] = useState("");
  const [adminLoginPassword, setAdminLoginPassword] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");

  const fetchAdminAccounts = async () => {
    setAdminAccountsLoading(true);
    setAdminAccountsError("");
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes?.session?.access_token;
      if (!token) {
        setAdminAccountsError("Missing session token. Please re-login.");
        return;
      }

      const res = await fetch("/api/admin/accounts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to load accounts.");

      setAdminAccounts(Array.isArray(body?.data) ? body.data : []);
    } catch (e) {
      setAdminAccountsError(e.message || "Failed to load accounts.");
    } finally {
      setAdminAccountsLoading(false);
    }
  };

  const createAdminAccount = async () => {
    try {
      setAdminAccountsError("");
      setAdminAccountCreating(true)
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes?.session?.access_token;
      if (!token) throw new Error("Missing session token. Please re-login.");

      const payload = {
        email: newAccount.email,
        password: newAccount.password,
        name: newAccount.name,
        role: newAccount.role,
        phone: newAccount.phone,
        branch_id: newAccount.branch_id ? Number(newAccount.branch_id) : null,
      };

      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to create account.");

      setNewAccount({ email: "", password: "", name: "", role: "branch_admin", phone: "", branch_id: "" });
      await fetchAdminAccounts();
    } catch (e) {
      setAdminAccountsError(e.message || "Failed to create account.");
    } finally {
      setAdminAccountCreating(false)
    }
  };

  const updateAdminAccount = async (userId, updates) => {
    setAdminAccountsError("");
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes?.session?.access_token;
      if (!token) throw new Error("Missing session token. Please re-login.");

      const res = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, ...updates }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to update account.");
      if (isSuperAdmin) {
        await fetchAdminAccounts();
      }
      return true;
    } catch (e) {
      setAdminAccountsError(e.message || "Failed to update account.");
      return false;
    }
  };

  const deleteAdminAccount = async (userId) => {
    setAdminAccountsError("");
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes?.session?.access_token;
      if (!token) throw new Error("Missing session token. Please re-login.");

      const res = await fetch(`/api/admin/accounts?user_id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to delete account.");
      await fetchAdminAccounts();
    } catch (e) {
      setAdminAccountsError(e.message || "Failed to delete account.");
    }
  };

  const destroyCurrentBranchStructure = async () => {
    setCompanyStructureError("");
    if (!selectedBranchId) {
      setCompanyStructureError("Select a branch first to destroy its structure.");
      return;
    }

    const ok = window.confirm(
      "This will delete the selected branch, its service points, and the criteria mappings (and collected ratings/feedback) for that branch. Continue?"
    );
    if (!ok) return;

    setCompanyStructureLoading(true);
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes?.session?.access_token;
      if (!token) throw new Error("Missing session token. Please re-login.");

      const res = await fetch(
        `/api/admin/company-structure?branch_id=${encodeURIComponent(selectedBranchId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to destroy branch structure.");

      // Clear cached branch-dependent data
      localStorage.removeItem("cachedRatings");
      localStorage.removeItem("cachedComments");
      localStorage.removeItem("cachedOtherData");
      localStorage.removeItem("cachedServicePoints");
      localStorage.removeItem("cachedBranches");

      window.location.reload();
    } catch (e) {
      setCompanyStructureError(e.message || "Failed to destroy branch structure.");
    } finally {
      setCompanyStructureLoading(false);
    }
  };

  const resetCompanyStructure = async () => {
    setCompanyStructureError("");

    const ok = window.confirm(
      "This will reset/destroy the entire company structure (all branches, their service points, and criteria mappings), including collected ratings/feedback. Continue?"
    );
    if (!ok) return;

    setCompanyStructureLoading(true);
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes?.session?.access_token;
      if (!token) throw new Error("Missing session token. Please re-login.");

      const res = await fetch("/api/admin/company-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: "reset_all" }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to reset company structure.");

      localStorage.removeItem("cachedRatings");
      localStorage.removeItem("cachedComments");
      localStorage.removeItem("cachedOtherData");
      localStorage.removeItem("cachedServicePoints");
      localStorage.removeItem("cachedBranches");

      window.location.reload();
    } catch (e) {
      setCompanyStructureError(e.message || "Failed to reset company structure.");
    } finally {
      setCompanyStructureLoading(false);
    }
  };

  useEffect(() => {
    if (!companyUser) return;
    const storedBranchId = localStorage.getItem("branch_id") || "";
    if (!selectedBranchId) {
      setSelectedBranchId(storedBranchId);
    }
    const branchId = selectedBranchId || storedBranchId;
    const companyId = companyUser?.user_metadata?.company_id || companyUser?.id;

    try {
      setIsLoading(true);
      setAction("Loading dashboard data...");

      // Fetch company service points with respective criteria
      async function fetchServicePoints() {
        try {
          // Fetch company data
          const retrievedCompanyData = await getCompanyServicePointCriteria(
            companyId
          );

          if (!retrievedCompanyData) return;

          const allCriteriaIds = retrievedCompanyData.CompanyServicePoints.flatMap(
            (sp) => sp.ServicePointRatingCriteria.map(
              (c) => c.RatingCriteria.id
            )
          );

          // Get ratings for all criteria IDs of this service point
          const ratings = await getRatingsByCriteriaIds(allCriteriaIds, branchId);

          const updatedServicePoints = await Promise.all(
            retrievedCompanyData.CompanyServicePoints.map(async (sp) => {
              const criteriaIds = sp.ServicePointRatingCriteria.map(
                (c) => c.RatingCriteria.id
              );

              const servicePointRatings = ratings.filter((r) =>
                // check if rating criteria id is in the criteriaIds
                r.rating_criteria_id &&
                r.rating_criteria_id !== null &&
                r.rating_criteria_id !== undefined &&
                criteriaIds.includes(r.rating_criteria_id)
              );

              let average = null;
              if (servicePointRatings.length > 0) {
                const total = servicePointRatings.reduce((sum, r) => sum + r.score, 0);
                average = total / servicePointRatings.length;
              }

              return {
                ...sp,
                averageRating: average, // merged value
              };
            }));

          const companyWithRatings = {
            ...retrievedCompanyData,
            CompanyServicePoints: updatedServicePoints,
          };

          setCompanyData(companyWithRatings);
          console.log("Service Points:", companyWithRatings);

        } catch (err) {
          setError(err.message);
        }
      }

      // Fetch comppany branches
      async function fetchCompanyBranches() {
        try {
          const branchesData = await fetchBranches(companyId);
          if (!branchesData) return;
          setBranches(branchesData);
        } catch (error) {
          console.error('Error in fetchCompanyBranches:', error.message);
        }
      }

      // Fetch ratings from the ratings table
      async function fetchRatings() {
        const ratingData = await getRatings(companyId, branchId);

        if (!ratingData) {
          setError('Failed to fetch ratings');
          return;
        }

        // console.log('Ratings Data:', ratingData);

        setRatings(ratingData);

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalSum = 0;
        let totalCount = 0;

        ratingData.forEach((r) => {

          if (!r?.criteria || !Array.isArray(r.criteria) || r.criteria.length === 0) return;

          r.criteria.forEach((c) => {
            if (!c?.score) return;

            let score;

            try {
              score = typeof c.score === "string" ? Int.parse(c.score) : c.score;
            } catch (error) {
              console.warn("Invalid rating score interger:", c.score);
              return;
            }

            if (!score || typeof score !== "number") return;

            const rounded = Math.round(score);
            if (distribution[rounded] !== undefined) distribution[rounded]++;
            totalSum += score;
            totalCount++;
          })

        })

        const avg = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : 0;

        setDistribution(distribution);
        setTotalRatings(ratingData?.length);
        setAverageRating(avg);
      }

      // Fetch comments from the Feedback table
      async function fetchComments() {

        let query = supabase
          .from("feedback")
          .select(`
            id, 
            created_at, 
            rating_id, 
            comments, 
            suggestions, 
            user:user_id(
              id, 
              name, 
              phone
            ), 
            company_id, 
            branch_id
          `)
          .eq("company_id", companyId);

        if (branchId) query = query.eq("branch_id", branchId);

        const { data, error } = await query;

        if (error) {
          setError(error.message);
          return;
        }

        const groupedComments = data
          .filter((item) => item.comments)
          .map((item) => {
            const commentObj = typeof item.comments === "string" && item.comments !== null
              ? JSON.parse(item.comments)
              : item.comments;

            return {
              id: item.id,
              date: new Date(item.created_at),
              suggestion: item.suggestions || "",
              rating_id: item.rating_id,
              username: item.user?.name || "Unknown",
              phone_number: item.user?.phone || "",
              categories: Object.entries(commentObj || {}).map(
                ([category, content]) => ({
                  category,
                  content,
                })
              ),
            };
          })
          .sort((a, b) => b.date - a.date)

        const groupedSuggestions = data
          .filter(
            (item) =>
              item.suggestions && item.suggestions.trim() !== ""
          ).map((item) => ({
            id: item.id,
            date: new Date(item.created_at),
            suggestion: item.suggestions || "",
            rating_id: item.rating_id,
            username: item.user?.name || "Unknown",
            phone_number: item.user?.phone || "",
          }))
          .sort((a, b) => b.date - a.date);

        setComments(data);
        setRecentComments(groupedComments);
        setSuggestions(groupedSuggestions);
      }

      // Fetch all Other data
      async function fetchOtherData() {
        let query = supabase
          .from("other")
          .select("*")
          .eq("company_id", companyId);

        if (branchId) query = query.eq("branch_id", branchId);

        const { data: otherData, error: otherError } = await query;

        if (otherError) {
          setError(otherError.message);
          return;
        }
        // Filter out records where both criteria and comments are empty/null/undefined
        const filteredData = (otherData || []).filter(
          (item) =>
            (item.criteria && item.criteria.toString().trim() !== "") ||
            (item.comments && item.comments.toString().trim() !== "")
        );

        setOtherData(filteredData);
      }

      // Fetch all users/raters
      async function fetchUsers() {
        const raters = await getAllUsersByCompanyBranchId(companyId, branchId);
        if (!raters) return;

        setUsers(raters);
      }

      async function fetchAllBranchesUniqueFeedbackers() {
        // Only meaningful when branch is NOT selected (head office view)
        if (branchId) return;

        const [y, m] = (allBranchesMonth || "").split("-").map((v) => parseInt(v, 10));
        if (!y || !m) return;

        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);
        const prevStart = new Date(y, m - 2, 1);
        const prevEnd = new Date(y, m - 1, 1);

        const [currRes, prevRes] = await Promise.all([
          supabase
            .from("feedback")
            .select("user_id, branch_id, created_at")
            .eq("company_id", companyId)
            .gte("created_at", start.toISOString())
            .lt("created_at", end.toISOString()),
          supabase
            .from("feedback")
            .select("user_id, branch_id, created_at")
            .eq("company_id", companyId)
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", prevEnd.toISOString()),
        ]);

        if (currRes.error) {
          console.error("Error fetching feedback (current month):", currRes.error.message);
          return;
        }
        if (prevRes.error) {
          console.error("Error fetching feedback (previous month):", prevRes.error.message);
          // We can still show current month without comparison
        }

        const byBranchId = {};
        const totalSet = new Set();

        (currRes.data || []).forEach((row) => {
          if (!row?.user_id) return;
          totalSet.add(row.user_id);
          const b = row.branch_id ?? "unknown";
          if (!byBranchId[b]) byBranchId[b] = new Set();
          byBranchId[b].add(row.user_id);
        });

        const byBranchCounts = Object.fromEntries(
          Object.entries(byBranchId).map(([k, set]) => [k, set.size])
        );

        let comparePrevTotalDelta = null;
        let comparePrevTotalPct = null;
        if (prevRes?.data) {
          const prevSet = new Set();
          prevRes.data.forEach((row) => {
            if (row?.user_id) prevSet.add(row.user_id);
          });
          const prevTotal = prevSet.size;
          const currTotal = totalSet.size;
          comparePrevTotalDelta = currTotal - prevTotal;
          comparePrevTotalPct = prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : null;
        }

        setAllBranchesUniqueFeedbackers({
          total: totalSet.size,
          byBranchId: byBranchCounts,
          comparePrevTotalDelta,
          comparePrevTotalPct,
        });
      }

      async function fetchMonthlyUniqueFeedbackersSeries() {
        const monthKeys = getLastNMonthKeys(12);
        const earliest = monthKeys[0];
        const [ey, em] = (earliest || "").split("-").map((v) => parseInt(v, 10));
        if (!ey || !em) return;

        const start = new Date(ey, em - 1, 1);
        const end = new Date();

        let query = supabase
          .from("feedback")
          .select("user_id, branch_id, created_at")
          .eq("company_id", companyId)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());

        if (branchId) query = query.eq("branch_id", branchId);

        const { data, error } = await query;
        if (error) {
          console.error("Error fetching monthly feedback series:", error.message);
          return;
        }

        const totalSetsByMonth = Object.fromEntries(monthKeys.map((k) => [k, new Set()]));
        const branchSetsByMonth = {};

        (data || []).forEach((row) => {
          if (!row?.user_id || !row?.created_at) return;
          const d = new Date(row.created_at);
          const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!totalSetsByMonth[mk]) return;

          totalSetsByMonth[mk].add(row.user_id);

          const b = row.branch_id ?? "unknown";
          if (!branchSetsByMonth[b]) {
            branchSetsByMonth[b] = Object.fromEntries(monthKeys.map((k) => [k, new Set()]));
          }
          branchSetsByMonth[b][mk].add(row.user_id);
        });

        const totalByMonth = monthKeys.map((k) => totalSetsByMonth[k]?.size ?? 0);
        const byBranchIdByMonth = {};
        Object.entries(branchSetsByMonth).forEach(([b, sets]) => {
          byBranchIdByMonth[b] = monthKeys.map((k) => sets[k]?.size ?? 0);
        });

        setFeedbackMonthlySeries({
          months: monthKeys,
          totalByMonth,
          byBranchIdByMonth,
        });
      }

      fetchUsers();
      fetchOtherData();
      fetchComments();
      fetchRatings();
      fetchServicePoints();
      fetchCompanyBranches();
      fetchAllBranchesUniqueFeedbackers();
      fetchMonthlyUniqueFeedbackersSeries();
    } catch (error) {
      console.error("Error in Dashboard useEffect:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [companyUser, selectedBranchId, allBranchesMonth]);

  useEffect(() => {
    if (!companyUser) return;

    const shouldShowAdminModal = adminUser === null && adminUserType === null;

    setShowAdminLoginModal(shouldShowAdminModal);

    // Optional: Reset form when modal becomes visible
    if (shouldShowAdminModal) {
      setAdminLoginEmail("");
      setAdminLoginPassword("");
      setAdminLoginError("");
    }
  }, [companyUser, adminUser, adminUserType]);

  const activeServicePoints = companyData?.CompanyServicePoints?.filter((sp) => sp.isActive).length || 0;

  const totalComments = Array.isArray(comments)
    ? comments.filter((c) => c.comments).length
    : 0;

  const totalSuggestions = Array.isArray(comments)
    ? comments.filter(
      (c) =>
        c.suggestions &&
        typeof c.suggestions === "string" &&
        c.suggestions.trim() !== ""
    ).length
    : 0;

  const allBranchesMonthLabel = (() => {
    const [y, m] = (allBranchesMonth || "").split("-");
    if (!y || !m) return "Selected month";
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  })();

  const allBranchesFeedbackersBarData = (() => {
    const labels =
      (branches || []).map((b) => b.branch_name || `Branch ${b.branch_id}`);
    const data =
      (branches || []).map((b) => {
        const key = b.branch_id;
        return allBranchesUniqueFeedbackers.byBranchId?.[key] ?? 0;
      });

    return {
      labels,
      datasets: [
        {
          label: "Unique feedback providers",
          data,
          backgroundColor: "#3B82F6",
        },
      ],
    };
  })();

  const allBranchesMonthlyFeedbackersChartData = (() => {
    const labels = feedbackMonthlySeries.months.map(monthKeyToLabel);
    return {
      labels,
      datasets: [
        {
          label: selectedBranchId ? "Unique feedback providers (current branch)" : "Unique feedback providers (all branches)",
          data: feedbackMonthlySeries.totalByMonth,
          backgroundColor: "#2563EB",
        },
      ],
    };
  })();

  const perBranchMonthlyFeedbackersChartData = (() => {
    const labels = feedbackMonthlySeries.months.map(monthKeyToLabel);
    const branchLabels = (branches || []).map((b) => ({
      id: b.branch_id,
      name: b.branch_name || `Branch ${b.branch_id}`,
    }));

    const palette = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#14B8A6", "#0EA5E9", "#A3E635"];

    const datasets = branchLabels.map((b, idx) => ({
      label: b.name,
      data: feedbackMonthlySeries.byBranchIdByMonth?.[b.id] || new Array(labels.length).fill(0),
      backgroundColor: palette[idx % palette.length],
    }));

    return { labels, datasets };
  })();

  const getCountForMonth = (branchId, monthKey) => {
    const monthIndex = feedbackMonthlySeries.months.indexOf(monthKey);
    if (monthIndex < 0) return 0;
    if (!branchId) return feedbackMonthlySeries.totalByMonth?.[monthIndex] ?? 0;
    return feedbackMonthlySeries.byBranchIdByMonth?.[branchId]?.[monthIndex] ?? 0;
  };

  const compareMonthLabel = `${monthKeyToLabel(compareMonths.a)} → ${monthKeyToLabel(compareMonths.b)}`;

  const branchCompareRows = (() => {
    const a = compareMonths.a;
    const b = compareMonths.b;
    if (!a || !b) return [];

    return (branches || [])
      .map((br) => {
        const id = br.branch_id;
        const name = br.branch_name || `Branch ${id}`;
        const aCount = getCountForMonth(id, a);
        const bCount = getCountForMonth(id, b);
        const delta = bCount - aCount;
        const pct = aCount > 0 ? (delta / aCount) * 100 : null;
        return { id, name, aCount, bCount, delta, pct };
      })
      .sort((x, y) => y.bCount - x.bCount);
  })();

  const getFilteredRatings = (data, criteria, servicePoint, search) => {
    let filtered = data || [];

    if (criteria !== "all") {
      filtered = filtered.filter((item) =>
        item.criteria?.some(
          (c) => c.title?.toLowerCase() === criteria.toLowerCase()
        )
      );
    }

    if (servicePoint !== "all") {
      filtered = filtered.filter(
        (item) => item.service_point?.toLowerCase() === servicePoint.toLowerCase()
      );
    }

    if (search) {
      filtered = filtered.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredFeedback = (data, category, search) => {
    let commentsData = data || [];

    if (category !== "all") {
      commentsData = commentsData.filter(
        (item) => getServicePointByRatingId(item.rating_id) === category
      );
    }

    if (search) {
      commentsData = commentsData.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      );
    }

    return commentsData;
  };

  const getFilteredSuggestion = (data, search) => {
    let suggestionData = data || [];

    if (search) {
      suggestionData = suggestions.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      );
    }

    return suggestionData;
  };

  const getServicePointByRatingId = (ratingId) => {
    const rating = ratings.find((r) => r.id === ratingId);
    return rating ? rating.service_point : "Unknown";
  };

  const renderStars = (rating) => {
    const safeRating = typeof rating === "number" || !isNaN(rating) || typeof rating === 'string' ? Number(rating) : 0;
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= safeRating ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{safeRating?.toFixed(1)}</span>
      </div>
    );
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "access", label: "Access", icon: Users },
    { id: "branches", label: "Branches", icon: Building2 },
    { id: "service-points", label: "Service Points", icon: Target },
    { id: "ratings", label: "Ratings", icon: Star },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "user-prefs", label: "User Prefs", icon: CheckSquare },
    { id: "suggestions", label: "Suggestions", icon: Lightbulb },
  ];

  const primaryTabs = tabs.slice(0, 2);
  const overflowTabs = tabs.slice(2);

  function monthKeyToLabel(key) {
    const [y, m] = (key || "").split("-");
    if (!y || !m) return key;
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  }

  const getLastNMonthKeys = (n) => {
    const now = new Date();
    const keys = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return keys;
  };

  const totalUsers = users?.length || 0;

  const ratingsOnlyCount = users.filter(
    (u) => u.user_path === "rating_only"
  ).length;

  const suggestionsOnlyCount = users.filter(
    (u) => u.user_path === "suggestion_only"
  ).length;

  const bothCount = users.filter((u) => u.user_path === "both").length;

  const ratingO = totalUsers
    ? Math.round((ratingsOnlyCount / totalUsers) * 100)
    : 0;

  const suggO = totalUsers
    ? Math.round((suggestionsOnlyCount / totalUsers) * 100)
    : 0;

  const both = totalUsers ? Math.round((bothCount / totalUsers) * 100) : 0;

  const pieChartData = {
    labels: ["Rated Only", "Suggested Only", "Both Rated & Suggested"],
    datasets: [
      {
        data: [ratingO, suggO, both],
        backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
        hoverBackgroundColor: ["#2563EB", "#059669", "#D97706"],
      },
    ],
  };

  // Mock data for service points
  const retrievedServicePoints =
    companyData?.CompanyServicePoints?.map((servicePoint) => {
      const service = servicePoint?.servicepoint;
      return service;
    }) || [];

  const ratingsBarData = {
    labels: retrievedServicePoints,
    datasets: [
      {
        label: "Number of Ratings",
        data: retrievedServicePoints.map(
          (servicePoint) =>
            ratings.filter((rating) => rating.service_point === servicePoint)
              .length
        ),
        backgroundColor: "#3B82F6",
        borderColor: "#2563EB",
        borderWidth: 1,
      },
    ],
  };

  // Mock data for comments bar chart
  const commentsBarData = {
    labels: retrievedServicePoints,
    datasets: [
      {
        label: "Number of Comments",
        data: retrievedServicePoints.map(
          (servicePoint) =>
            comments.filter((comment) => {
              const rating = ratings.find((r) => r.id === comment.rating_id && comment.comments !== null);
              return rating && rating.service_point === servicePoint;
            }).length
        ),
        backgroundColor: "#10B981",
        borderColor: "#059669",
        borderWidth: 1,
      },
    ],
  };

  const handleSwitchBranch = (branchId) => {
    setIsLoading(true);
    setAction("Switching branch...");
    try {
      setSelectedBranchId(branchId);
      localStorage.setItem("branch_id", branchId);
      // Clear cached data
      localStorage.removeItem("cachedRatings");
      localStorage.removeItem("cachedComments");
      localStorage.removeItem("cachedOtherData");
      localStorage.removeItem("cachedServicePoints");
      localStorage.removeItem("cachedBranches");
    } catch (error) {
      console.error("Error switching branch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBranch = async (formData) => {
    const companyId = localStorage.getItem("company_id");
    setIsLoading(true)
    setAction("Creating new branch...");

    try {
      const insertedBranch = await insertNewBranch(companyId, formData)

      // Check for errors
      if (!insertedBranch) throw 'Something went wrong! New branch could not be inserted';

      // If successful, update local state
      const newBranch = {
        id: insertedBranch, // Assuming the RPC returns the new branch ID
        companyId: companyId?.trim(),
        branchName: formData.branchName,
        branchCode: formData.branchCode,
        branchType: formData.branchType,
        location: formData.location,
        address: formData.address,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        manager: formData.manager,
        isActive: formData.isActive,
        servicePoints: formData.servicePoints?.map((sp) => ({
          servicePointId: sp.id,
          servicePoint: sp.name,
          criteria: sp.criteria.map((c) => ({
            id: c?.id,
            title: c?.title
          })),
        })),
      };

      // Update branches state
      setBranches([...branches, newBranch]);

    } catch (error) {
      console.error('Branch Creation Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false)
      setShowBranchModal(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminLoginEmail.trim() || !adminLoginPassword.trim()) {
      setAdminLoginError("Please enter both email and password");
      return;
    }

    setAdminLoginLoading(true);
    setAdminLoginError("");

    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes?.session?.access_token;

      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: adminLoginEmail.trim(),
          password: adminLoginPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Invalid admin credentials");
      }

      // SUCCESS - Set admin user and close modal
      setAdminUser(result.user || { email: adminLoginEmail });
      setAdminUserType(result.role || "admin");

      // Modal will automatically close via useEffect
      setAdminLoginError("");

    } catch (error) {
      setAdminLoginError(error.message || "Admin verification failed. Please try again.");
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // When you want to reset (e.g., in useEffect or on cancel)
  const resetAdminLoginForm = () => {
    setAdminLoginEmail("");
    setAdminLoginPassword("");
    setAdminLoginError("");
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setAction("Logging out...");
    try {
      await logoutCompany();
      setCompanyData(null);
      setRatings([]);
      setComments([]);
      setOtherData([]);
      setTotalRatings(0);
      setAverageRating(0);
      setUsers([]);
      setBranches([]);
      setSelectedBranchId("");
      setDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      setError(null);
      setRecentComments([]);
      setSuggestions([]);
      setActiveTab("overview");
    }
    catch (error) {
      console.error("Logout Error:", error);
      setError("Failed to logout. Please try again.");
    } finally {
      // clear localStorage
      localStorage.removeItem("company_id");
      localStorage.removeItem("branch_id");
      localStorage.removeItem("company_logo_base64");
      localStorage.removeItem("cachedDepartments");
      localStorage.removeItem("cachedBranches");
      // go to login page
      window.location.href = "/login";
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 gap-3">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                {companyData?.logoUrl ? (
                  <button type="button" onClick={() => window.location.href = "/"}>
                    <img
                      src={companyData?.logoUrl}
                      alt="logo"
                      className="h-8 w-8 object-cover rounded"
                    />
                  </button>
                ) : (
                  <button type="button" onClick={() => window.location.href = "/"}>
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 max-w-[14rem] sm:max-w-none truncate">
                  {companyData?.company_name}
                </h1>
                <div className="hidden sm:flex items-center text-gray-600 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{companyData?.location}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{companyData?.industry}</span>
                </div>
              </div>
            </div>

            {/* Desktop header actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {isSuperAdmin ? (
                <>
                  {/* Branch Selector */}
                  {branches?.length > 0 && (
                    <div className="relative">
                      <select
                        value={selectedBranchId}
                        onChange={(e) => handleSwitchBranch(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch, index) => (
                          <option key={index} value={branch.branch_id}>
                            {branch.branch_name}-branch
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  {/* Add Branch Button */}
                  <button
                    onClick={() => setShowBranchModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-900">
                    {userDisplayName}
                  </div>
                  <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                    {selectedBranchName || "Branch"}
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>

            {/* Mobile/tablet header menu button */}
            <div className="lg:hidden flex items-center">
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={isHeaderMenuOpen}
                onClick={() => setIsHeaderMenuOpen(true)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile/tablet menu drawer */}
        {isHeaderMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsHeaderMenuOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl border-l border-gray-200 p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="font-semibold text-gray-900">Menu</div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setIsHeaderMenuOpen(false)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="pt-4 space-y-4">
                {isSuperAdmin ? (
                  <>
                    {branches?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-2">Branch</div>
                        <div className="relative">
                          <select
                            value={selectedBranchId}
                            onChange={(e) => {
                              handleSwitchBranch(e.target.value);
                              setIsHeaderMenuOpen(false);
                            }}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                          >
                            <option value="">Select Branch</option>
                            {branches.map((branch, index) => (
                              <option key={index} value={branch.branch_id}>
                                {branch.branch_name}-branch
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowBranchModal(true);
                        setIsHeaderMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Branch
                    </button>
                  </>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Signed in as</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {userDisplayName}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Branch: {selectedBranchName || "—"}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 text-red-700 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Login Modal - Only closes after successful login */}
      {/* {showAdminLoginModal && ( */}
      {/* <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"> */}
      {/* Blurry Backdrop */}
      {/* <div className="absolute inset-0 bg-black/70 backdrop-blur-lg" /> */}

      {/* Modal Content */}
      {/* <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"> */}
      {/* <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-blue-100 p-4 rounded-2xl mb-4">
              <DoorClosedLocked className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Verification</h2>
            <p className="text-gray-600 mt-2 text-sm">
              Please verify your admin credentials to access the dashboard
            </p>
          </div>

          {adminLoginError && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-sm">
              {adminLoginError}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={adminLoginEmail}
                onChange={(e) => {
                  setAdminLoginEmail(e.target.value);
                  if (adminLoginError) setAdminLoginError("");
                }}
                placeholder="admin@yourcompany.com"
                className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                disabled={adminLoginLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={adminLoginPassword}
                onChange={(e) => {
                  setAdminLoginPassword(e.target.value);
                  if (adminLoginError) setAdminLoginError("");
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                disabled={adminLoginLoading}
              />
            </div>

            <button
              onClick={handleAdminLogin}
              disabled={adminLoginLoading || !adminLoginEmail.trim() || !adminLoginPassword.trim()}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3
                    ${adminLoginLoading || !adminLoginEmail.trim() || !adminLoginPassword.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.985]"
                } text-white`}
            >
              {adminLoginLoading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent animate-spin rounded-full" />
                  Verifying Admin Access...
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </div>
        </div> */}

      {/* Footer note */}
      {/* <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 text-center">
          <p className="text-xs text-gray-500">
            This dashboard is restricted to authorized administrators only.
          </p>
        </div> */}
      {/* </div> */}
      {/* </div> */}
      {/* )} */}

      {/* Main return content dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Average Rating
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageRating}
                </p>
                <p className="text-xs text-gray-500">{totalRatings} reviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Services
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeServicePoints}
                </p>
                <p className="text-xs text-gray-500">
                  of {companyData?.servicePoints?.length} total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Comments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalComments}
                </p>
                <p className="text-xs text-gray-500">criteria comments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Lightbulb className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Suggested Ideas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSuggestions}
                </p>
                <p className="text-xs text-gray-500">suggestions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            {/* Desktop tabs */}
            <nav className="hidden lg:flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile/tablet tabs + More dropdown */}
            <nav className="lg:hidden px-4 sm:px-6" aria-label="Tabs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 overflow-x-auto py-2">
                  {primaryTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsTabsMoreOpen(false);
                        }}
                        className={`shrink-0 inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isTabsMoreOpen}
                    onClick={() => setIsTabsMoreOpen((v) => !v)}
                    className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    More
                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isTabsMoreOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isTabsMoreOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsTabsMoreOpen(false)}
                      />
                      <div
                        className="absolute right-0 mt-2 z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-2"
                        role="menu"
                      >
                        {overflowTabs.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              role="menuitem"
                              onClick={() => {
                                setActiveTab(tab.id);
                                setIsTabsMoreOpen(false);
                              }}
                              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {!selectedBranchId && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          All branches overview
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          You’re logged in without a branch code. Stats below summarize all branches.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Month</label>
                        <input
                          type="month"
                          value={allBranchesMonth}
                          onChange={(e) => setAllBranchesMonth(e.target.value)}
                          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="text-sm text-gray-600">Unique feedback providers</div>
                        <div className="text-3xl font-bold text-gray-900 mt-1">
                          {allBranchesUniqueFeedbackers.total}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {allBranchesMonthLabel}
                          {typeof allBranchesUniqueFeedbackers.comparePrevTotalDelta === "number" && (
                            <>
                              {" "}
                              • Compared to last month:{" "}
                              <span className={allBranchesUniqueFeedbackers.comparePrevTotalDelta >= 0 ? "text-emerald-700" : "text-red-700"}>
                                {allBranchesUniqueFeedbackers.comparePrevTotalDelta >= 0 ? "+" : ""}
                                {allBranchesUniqueFeedbackers.comparePrevTotalDelta}
                                {typeof allBranchesUniqueFeedbackers.comparePrevTotalPct === "number" && (
                                  <>
                                    {" "}
                                    ({allBranchesUniqueFeedbackers.comparePrevTotalPct >= 0 ? "+" : ""}
                                    {allBranchesUniqueFeedbackers.comparePrevTotalPct.toFixed(1)}%)
                                  </>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 p-4 lg:col-span-2">
                        <div className="text-sm font-medium text-gray-900 mb-2">
                          Branch comparison (unique feedback providers)
                        </div>
                        <div className="w-full">
                          <Bar
                            data={allBranchesFeedbackersBarData}
                            options={{
                              responsive: true,
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  callbacks: {
                                    label: (ctx) => ` ${ctx.raw} people`,
                                  },
                                },
                              },
                              scales: {
                                y: { beginAtZero: true, ticks: { precision: 0 } },
                              },
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Labels show each branch name; bars show the number of distinct people who submitted feedback during {allBranchesMonthLabel}.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Info Pie Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Users' Actions
                    </h3>
                    <div className="w-full max-w-xs mx-auto">
                      <Pie
                        data={pieChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "bottom",
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) =>
                                  `${context.label}: ${context.raw}%`,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Rating Distribution
                    </h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = distribution[rating];
                        const percentage =
                          totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                        return (
                          <div key={rating} className="flex items-center">
                            <span className="text-sm text-gray-600 w-6">
                              {rating}
                            </span>
                            <Star className="h-4 w-4 text-yellow-400 fill-current mx-2" />
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 ml-2 w-8">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Ratings
                    </h3>
                    <div className="w-full max-w-md mx-auto">
                      <Bar
                        data={ratingsBarData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "top",
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) =>
                                  `${context.dataset.label}: ${context.raw}`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: "Number of Ratings",
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: "Service Point",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Comments
                    </h3>
                    <div className="w-full max-w-md mx-auto">
                      <Bar
                        data={commentsBarData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "top",
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) =>
                                  `${context.dataset.label}: ${context.raw}`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: "Number of Comments",
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: "Service Point",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Access Tab */}
            {activeTab === "access" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Access management
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Create staff accounts, update roles/branches, reset passwords, and delete accounts. Only super admin can do this.
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await fetchAdminAccounts();
                        }}
                        className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>

                {adminAccountsError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                    {adminAccountsError}
                  </div>
                )}

                {!isSuperAdmin && (
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Update password
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      You can update only your own password.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          New password
                        </label>
                        <input
                          type="password"
                          value={myPassword}
                          onChange={(e) => {
                            setMyPasswordSuccess("");
                            setMyPassword(e.target.value);
                          }}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="Enter new password"
                        />
                      </div>

                      {myPasswordSuccess && (
                        <div className="text-sm text-emerald-700">
                          {myPasswordSuccess}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          setMyPasswordSuccess("");
                          if (!myPassword?.trim()) {
                            setAdminAccountsError("Please enter a new password.");
                            return;
                          }
                          setMyPasswordLoading(true);
                          try {
                            const ok = await updateAdminAccount(companyUser?.id, {
                              password: myPassword,
                            });
                            if (ok) {
                              setMyPassword("");
                              setMyPasswordSuccess("Password updated.");
                            }
                          } finally {
                            setMyPasswordLoading(false);
                          }
                        }}
                        disabled={myPasswordLoading}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${myPasswordLoading
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                      >
                        {myPasswordLoading ? "Updating..." : "Update password"}
                      </button>
                    </div>
                  </div>
                )}

                {isSuperAdmin && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Create account</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                          <input
                            type="email"
                            value={newAccount.email}
                            onChange={(e) => setNewAccount((p) => ({ ...p, email: e.target.value }))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="staff@company.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={newAccount.phone}
                            onChange={(e) => setNewAccount((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="+268 76xx xxxx"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Temporary password</label>
                          <input
                            type="password"
                            value={newAccount.password}
                            onChange={(e) => setNewAccount((p) => ({ ...p, password: e.target.value }))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="Set a temp password"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Full name (optional)</label>
                          <input
                            type="text"
                            value={newAccount.name}
                            onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="Jane Doe"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                            <select
                              value={newAccount.role}
                              onChange={(e) => setNewAccount((p) => ({ ...p, role: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="branch_admin">Branch admin</option>
                              <option value="member">Member</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Branch (optional)</label>
                            <select
                              value={newAccount.branch_id}
                              onChange={(e) => setNewAccount((p) => ({ ...p, branch_id: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                              <option value={companyId}>Main Branch</option>
                              {(branches || []).map((b, idx) => (
                                <option key={idx} value={b.branch_id}>
                                  {b.branch_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={createAdminAccount}
                          className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          {
                            adminAccountCreating ? <PiSpinner className="animate-spin h-5 w-5" /> :
                              <Users className="h-4 w-4 mr-2" />
                          }
                          Create staff account
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-gray-100 lg:col-span-2 overflow-x-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Accounts</h4>
                        {adminAccountsLoading && (
                          <div className="text-xs text-gray-500">Loading…</div>
                        )}
                      </div>
                      <table className="min-w-[860px] w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            <th className="py-2 pr-4">Email</th>
                            <th className="py-2 pr-4">Name</th>
                            <th className="py-2 pr-4">Role</th>
                            <th className="py-2 pr-4">Branch</th>
                            <th className="py-2 pr-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminAccounts.map((a) => (
                            <tr key={a.id} className="border-t border-gray-100">
                              <td className="py-2 pr-4 text-gray-900">{a.email}</td>
                              <td className="py-2 pr-4 text-gray-700">{a.name || "—"}</td>
                              <td className="py-2 pr-4 text-gray-700">{a.role}</td>
                              <td className="py-2 pr-4 text-gray-700">
                                {a.branch_id ? (branches || []).find((b) => b.branch_id === a.branch_id)?.branch_name || a.branch_id : "—"}
                              </td>
                              <td className="py-2 pr-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditAccount(a);
                                      setEditPassword("");
                                      setIsAccessModalOpen(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                  >
                                    <KeyRound className="h-4 w-4 mr-2" />
                                    Edit
                                  </button>
                                  {a.role !== "super_admin" && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const ok = window.confirm(`Delete account ${a.email}? This cannot be undone.`);
                                        if (!ok) return;
                                        await deleteAdminAccount(a.id);
                                      }}
                                      className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {adminAccounts.length === 0 && !adminAccountsLoading && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-gray-500">
                                No staff accounts found (or you are not super admin).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {isSuperAdmin && (
                  <>
                    {/* Company structure reset */}
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Boxes className="h-5 w-5 text-blue-600" />
                            Company structure
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Destroy branches, their service points, and criteria mappings. This also clears collected ratings/feedback for the destroyed scope.
                          </p>
                        </div>
                        {companyStructureLoading ? (
                          <div className="text-sm text-gray-600">Working…</div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Selected branch: <span className="font-medium text-gray-900">{selectedBranchId || "All / none"}</span>
                          </div>
                        )}
                      </div>

                      {companyStructureError && (
                        <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
                          {companyStructureError}
                        </div>
                      )}

                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={destroyCurrentBranchStructure}
                          disabled={companyStructureLoading || !selectedBranchId}
                          className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${companyStructureLoading || !selectedBranchId
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Destroy selected branch
                        </button>

                        <button
                          type="button"
                          onClick={resetCompanyStructure}
                          disabled={companyStructureLoading}
                          className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${companyStructureLoading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Reset entire company
                        </button>
                      </div>
                    </div>

                    {isAccessModalOpen && editAccount && (
                      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setIsAccessModalOpen(false)} />
                        <div className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="font-semibold text-gray-900">Edit account</div>
                            <button
                              type="button"
                              onClick={() => setIsAccessModalOpen(false)}
                              className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="pt-4 space-y-3">
                            <div className="text-sm text-gray-600">
                              Editing{" "}
                              <span className="font-medium text-gray-900">
                                {editAccount.email}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={editAccount.name || ""}
                                  onChange={(e) =>
                                    setEditAccount((p) => ({
                                      ...p,
                                      name: e.target.value,
                                    }))
                                  }
                                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Role
                                </label>
                                <select
                                  value={editAccount.role || "branch_admin"}
                                  onChange={(e) =>
                                    setEditAccount((p) => ({
                                      ...p,
                                      role: e.target.value,
                                    }))
                                  }
                                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                  <option value="branch_admin">
                                    Branch admin
                                  </option>
                                  <option value="viewer">Viewer</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Branch
                              </label>
                              <select
                                value={editAccount.branch_id || ""}
                                onChange={(e) =>
                                  setEditAccount((p) => ({
                                    ...p,
                                    branch_id: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  }))
                                }
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              >
                                <option value="">All / none</option>
                                {(branches || []).map((b, idx) => (
                                  <option key={idx} value={b.branch_id}>
                                    {b.branch_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                New password (optional)
                              </label>
                              <input
                                type="password"
                                value={editPassword}
                                onChange={(e) =>
                                  setEditPassword(e.target.value)
                                }
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="Leave blank to keep existing password"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  await updateAdminAccount(editAccount.id, {
                                    name: editAccount.name || "",
                                    role: editAccount.role,
                                    branch_id:
                                      editAccount.branch_id || null,
                                    password: editPassword || undefined,
                                  });
                                  setIsAccessModalOpen(false);
                                }}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Save changes
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsAccessModalOpen(false)}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="text-xs text-gray-500">
                              Password changes and deletes are enforced
                              server-side and restricted to super admin.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Branches Tab */}
            {activeTab === "branches" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Branch analytics</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Monthly unique people who provided feedback.
                      {selectedBranchId ? " (Current branch only)" : " (All branches)"}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Compare A</label>
                      <input
                        type="month"
                        value={compareMonths.a}
                        onChange={(e) => setCompareMonths((p) => ({ ...p, a: e.target.value }))}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Compare B</label>
                      <input
                        type="month"
                        value={compareMonths.b}
                        onChange={(e) => setCompareMonths((p) => ({ ...p, b: e.target.value }))}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">12 month trend</div>
                  <Bar
                    data={allBranchesMonthlyFeedbackersChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "top" },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => ` ${ctx.raw} people`,
                          },
                        },
                      },
                      scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 } },
                      },
                    }}
                  />
                  <div className="text-xs text-gray-600 mt-2">
                    Each bar is the count of distinct `feedback.user_id` entries for that month.
                  </div>
                </div>

                {!selectedBranchId && (
                  <>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        By branch — monthly chart
                      </div>
                      <Bar
                        data={perBranchMonthlyFeedbackersChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: "bottom" },
                            tooltip: {
                              callbacks: {
                                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
                              },
                            },
                          },
                          scales: {
                            y: { beginAtZero: true, ticks: { precision: 0 } },
                          },
                        }}
                      />
                      <div className="text-xs text-gray-600 mt-2">
                        Labels identify the branch; values are distinct people who submitted feedback per month.
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
                      <div className="text-sm font-medium text-gray-900 mb-3">
                        Branch-by-branch comparison: {compareMonthLabel}
                      </div>
                      <table className="min-w-[720px] w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            <th className="py-2 pr-4">Branch</th>
                            <th className="py-2 pr-4">{monthKeyToLabel(compareMonths.a)}</th>
                            <th className="py-2 pr-4">{monthKeyToLabel(compareMonths.b)}</th>
                            <th className="py-2 pr-4">Δ</th>
                            <th className="py-2 pr-4">% change</th>
                            <th className="py-2 pr-4">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branchCompareRows.map((r) => (
                            <tr key={r.id} className="border-t border-gray-100">
                              <td className="py-2 pr-4 font-medium text-gray-900">{r.name}</td>
                              <td className="py-2 pr-4 text-gray-700">{r.aCount}</td>
                              <td className="py-2 pr-4 text-gray-700">{r.bCount}</td>
                              <td className={`py-2 pr-4 ${r.delta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                                {r.delta >= 0 ? "+" : ""}
                                {r.delta}
                              </td>
                              <td className="py-2 pr-4 text-gray-700">
                                {typeof r.pct === "number"
                                  ? `${r.pct >= 0 ? "+" : ""}${r.pct.toFixed(1)}%`
                                  : "—"}
                              </td>
                              <td className="py-2 pr-4 text-gray-600">
                                {r.delta === 0
                                  ? `No change (${r.bCount} vs ${r.aCount}).`
                                  : r.delta > 0
                                    ? `Increase of ${r.delta} people in ${monthKeyToLabel(compareMonths.b)} vs ${monthKeyToLabel(compareMonths.a)}.`
                                    : `Decrease of ${Math.abs(r.delta)} people in ${monthKeyToLabel(compareMonths.b)} vs ${monthKeyToLabel(compareMonths.a)}.`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Service Points Tab */}
            {activeTab === "service-points" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Service Points
                  </h3>
                  <span className="text-sm text-gray-600">
                    {activeServicePoints} active of{" "}
                    {companyData?.CompanyServicePoints?.length} total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companyData?.CompanyServicePoints?.map((servicePoint) => {
                    // Filter ratings for this specific service point
                    const serviceRatings = ratings.filter(
                      (r) => r.service_point === servicePoint.servicepoint
                    );

                    return (
                      <div
                        key={servicePoint.id}
                        className="border border-gray-200 rounded-lg p-6"
                      >

                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {servicePoint.servicepoint}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {servicePoint.department}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${servicePoint.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {servicePoint.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-900">
                            Rating Criteria:
                          </p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {servicePoint?.ServicePointRatingCriteria?.map(
                              (criterion, index) => (
                                <li key={index}>
                                  {criterion?.RatingCriteria?.title}
                                  <span
                                    className='ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
                                  >
                                    Required
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>

                        <div className="flex justify-between items-center">
                          {renderStars(servicePoint?.averageRating || 0)}
                          <span className="text-xs text-gray-500">
                            {serviceRatings?.length}{" "}
                            {serviceRatings?.length === 1 ? "review" : "reviews"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === "ratings" && (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search ratings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* criteria filter */}
                  <select
                    value={filterCriteria}
                    onChange={(e) => setFilterCriteria(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Criteria</option>
                    {companyData?.CompanyServicePoints?.flatMap(sp =>
                      sp.ServicePointRatingCriteria?.map(c =>
                        c.RatingCriteria?.title
                      )
                    )
                      .filter((v, i, a) => v && a.indexOf(v) === i)
                      .map((title, idx) => (
                        <option key={idx} value={title}>{title}</option>
                      ))}
                  </select>

                  {/* service point filter */}
                  <select
                    value={filterServicePoint}
                    onChange={(e) => setFilterServicePoint(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Service Points</option>
                    {companyData?.CompanyServicePoints?.map((sp) => (
                      <option key={sp?.id} value={sp?.servicepoint}>
                        {sp?.servicepoint}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  {getFilteredRatings(ratings, filterCriteria, filterServicePoint, searchTerm).map(
                    (rating, index) => {
                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-6"
                        >

                          {/* display of user, service point and average rating */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {rating?.user?.full_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {rating.service_point}
                              </p>
                            </div>
                            <div className="text-right">
                              {renderStars(rating?.averageScore)}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(rating?.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* display of each criteria and rating */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-gray-700 text-sm space-y-1">
                            {rating?.criteria?.map((criterion, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-evenly bg-gray-50 p-2 rounded-full m-1"
                              >
                                <span className="flex items-center">rated:
                                  <p className="text-blue-400 font-semibold"> {criterion?.name}</p>
                                </span>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${star <= criterion?.score
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                        }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === "comments" && (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search comments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Service Points</option>
                    {companyData?.CompanyServicePoints?.map((sp) => (
                      <option key={sp?.id} value={sp?.servicepoint}>
                        {sp?.servicepoint}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 space-y-4">
                  {getFilteredFeedback(
                    recentComments,
                    filterCategory,
                    searchTerm
                  ).map((comment, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {comment.username}
                          </p>
                          <p className="text-sm text-gray-600">
                            {comment.phone_number}
                          </p>
                          <p className="text-xs text-slate-400">
                            <span className="font-semibold text-slate-500">Service Point:{" "}</span>
                            {getServicePointByRatingId(comment.rating_id)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(comment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                              Criteria
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                              Comment
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {comment.categories.map((cat, index) => (
                            <tr key={index} className="border-b">
                              <td className="px-4 py-2 font-semibold text-xs">{cat.category}</td>
                              <td className="px-4 py-2">
                                <div className="px-2 py-1 rounded-lg text-xs bg-green-100 text-green-800">
                                  {cat.content}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Prefs Tab */}
            {activeTab === "user-prefs" && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    User Defined Ratings
                  </h3>
                  <p className="text-gray-600">
                    These are the added user preferences.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherData.map((pref) => (
                    <div
                      key={pref.id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {pref.username}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {pref.phone_number}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {pref.department ? pref.department : "General"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Rating Criteria:
                        </p>
                        <div className="space-y-2">
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">
                                    Named-Criteria
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">
                                    Rating-Given
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">
                                    Description
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr key={pref.id} className="border-b">
                                  <td className="px-4 py-2">{pref.criteria}</td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${star <= pref.ratings
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                            }`}
                                        />
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="px-2 py-1 rounded-lg text-xs bg-green-100 text-green-800">
                                      {pref.comments}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === "suggestions" && (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search suggestions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 space-y-4">
                  {getFilteredSuggestion(suggestions, searchTerm).map(
                    (suggestion, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {suggestion.username}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {suggestion.phone_number}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getServicePointByRatingId(suggestion.rating_id)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-green-100 rounded-md p-2 mb-4">
                          <p className="text-green-600 font-semibold text-xs mb-2">
                            {suggestion.suggestion}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Submitted{" "}
                          {new Date(suggestion.date).toLocaleDateString()}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* branch modal for adding or updating branch */}
      <BranchModal
        isOpen={showBranchModal}
        onClose={() => {
          setShowBranchModal(false);
        }}
        onSave={handleSaveBranch}
        isSubmiting={isLoading}
        servicePoints={companyData?.CompanyServicePoints}
      />

      {/* login modal for company and branch */}
      <LoadingModal
        isOpen={isLoading}
        onClose={() => setIsLoading(false)}
        action={action}
        isLoading={isLoading}
      />
    </div>
  );
}

export default Dashboard;
