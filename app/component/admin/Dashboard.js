'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseService';
import { getAllUsersByCompanyId } from '../../../services/ratingService';
import {
  Building2,
  LogOut,
  Star,
  MessageSquare,
  BarChart3,
  CheckSquare,
  Lightbulb,
  Target,
  MapPin,
  Plus,
  Search,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../../app-context/auth-context';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import BranchModal from './BranchModal';
import { mockBranches } from '../../../utils/data';
import { insertNewBranch } from '../../../services/ratingService';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [companyData, setCompanyData] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [otherData, setOtherData] = useState([]);
  const [totalRatings, setTotalRatings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const { user, loading: authLoading } = useAuth();
  const [recentComments, setRecentComments] = useState([]);
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [branches, setBranches] = useState(mockBranches);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Fetch company and service points data from Supabase
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const companyId = user?.id;

        // Fetch company data
        const { data: companyData, error: companyError } = await supabase
          .from('Companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyError) throw companyError;

        // Fetch service points with ratings and comments
        const { data: servicePoints, error: servicePointsError } = await supabase
          .from('CompanyServicePoints')
          .select('*')
          .eq('company_id', companyId);

        if (servicePointsError) throw servicePointsError;

        // Structure data to match original component expectations

        const formattedData = {
          ...companyData,
          servicePoints: servicePoints?.map(sp => ({
            id: sp.id,
            name: sp.servicepoint,
            department: sp.department,
            isActive: sp.is_active || true,
            ratingCriteria: sp.ratingCriteria || [],
          })),
        };

        setCompanyData(formattedData);
      } catch (err) {
        setError(err.message);
      }
    }

    // Fetch ratings from the ratings table
    async function fetchRatings() {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('company_id', user?.id);

      if (error) {
        setError(error?.message);
        return;
      }

      if (!data) return;

      setRatings(data); // store full ratings

      // Calculate distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalSum = 0;
      let totalCount = 0;


      data?.forEach((r) => {
        if (!r?.rating) return;

        let ratingObj;
        try {
          ratingObj = typeof r.rating === 'string' ? JSON.parse(r.rating) : r.rating;
        } catch (error) {
          console.warn('Invalid rating JSON:', r.rating);
          return;
        }

        if (!ratingObj || typeof ratingObj !== 'object') return;

        const scores = Object.values(ratingObj).filter(n => typeof n === 'number');

        scores?.forEach((score) => {
          const rounded = Math.round(score);
          if (distribution[rounded] !== undefined) distribution[rounded]++;
          totalSum += score;
          totalCount++;
        });
      });


      const avg = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : 0;

      setDistribution(distribution);
      setTotalRatings(data?.length);
      setAverageRating(avg);
    }

    // Fetch comments from the Feedback table
    async function fetchComments() {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('id, user_id')
        .eq('company_id', user?.id);

      if (ratingsError) {
        setError(ratingsError.message);
        return;
      }

      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('company_id', user?.id);

      if (error) {
        setError(error.message);
        return;
      }

      const ratingIdToUsername = {};
      (ratingsData || []).forEach(r => {
        ratingIdToUsername[r.id] = {
          username: r.username,
          phone_number: r.phone_number
        }
      });

      const groupedComments = data
        .filter(item => item.comments)
        .map(item => {
          const commentObj = typeof item.comments === 'string'
            ? JSON.parse(item.comments)
            : item.comments;

          return {
            id: item.id,
            date: new Date(item.created_at),
            suggestion: item.suggestion || '',
            rating_id: item.rating_id,
            username: ratingIdToUsername[item.rating_id]?.username || 'Unknown',
            phone_number: ratingIdToUsername[item.rating_id]?.phone_number || '',
            categories: Object.entries(commentObj || {}).map(([category, content]) => ({
              category,
              content,
            })),
          };
        })
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);

      const groupedSuggestions = data
        .filter(item => item.suggestions &&
          item.suggestions.trim() !== '' &&
          item.rating_id
        )
        .map(item => ({
          id: item.id,
          date: new Date(item.created_at),
          suggestion: item.suggestions || '',
          rating_id: item.rating_id,
          username: ratingIdToUsername[item.rating_id]?.username || 'Unknown',
          phone_number: ratingIdToUsername[item.rating_id]?.phone_number || '',
        }))
        .sort((a, b) => b.date - a.date);

      setComments(data);
      setRecentComments(groupedComments);
      setSuggestions(groupedSuggestions);
    }

    // Fetch all Other data
    async function fetchOtherData() {
      const { data: otherData, error: otherError } = await supabase.from('other').select('*').eq('company_id', user.id);
      if (otherError) {
        setError(otherError.message);
        return;
      }
      // Filter out records where both criteria and comments are empty/null/undefined
      const filteredData = (otherData || []).filter(
        item =>
          (item.criteria && item.criteria.toString().trim() !== '') ||
          (item.comments && item.comments.toString().trim() !== '')
      );

      setOtherData(filteredData);
    }

    // Fetch all users/raters
    async function fetchUsers() {
      const raters = await getAllUsersByCompanyId(user?.id);
      if (!raters) return;

      setUsers(raters);
    }

    fetchUsers();
    fetchOtherData();
    fetchComments();
    fetchRatings();
    fetchData();
  }, [user]);

  const handleTest = () => {
    console.log(companyData);
  };

  const activeServicePoints = companyData?.servicePoints?.filter(sp => sp.isActive).length || 0;

  const totalComments = Array.isArray(comments)
    ? comments.filter(
      c =>
        c.comments &&
        typeof c.comments === 'object' &&
        Object.keys(c.comments).length > 0
    ).length
    : 0;

  const pendingSuggestions = comments.length || 0;

  const getFilteredRatings = (data, category, search) => {
    let filtered = data || [];

    if (category !== 'all') {
      filtered = filtered.filter(item =>
        item.department?.toLowerCase() === category.toLowerCase() ||
        item.service_point === category
      );
    }

    if (search) {
      filtered = filtered.filter(item =>
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredFeedback = (data, category, search) => {
    let filtered = data || [];

    if (category !== 'all') {
      filtered = filtered.filter(item =>
        getServicePointByRatingId(item.rating_id) === category
      );
    }

    if (search) {
      filtered = filtered.filter(item =>
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredSuggestion = (data, search) => {
    let filtered = data || [];

    if (search) {
      filtered = filtered.filter(item =>
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  const getServicePointByRatingId = (ratingId) => {
    const rating = ratings.find(r => r.id === ratingId);
    return rating ? rating.service_point : 'Unknown';
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'service-points', label: 'Service Points', icon: Target },
    { id: 'ratings', label: 'Ratings', icon: Star },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'user-prefs', label: 'User Prefs', icon: CheckSquare },
    { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
  ];

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }
  const totalUsers = users?.length || 0;

  const ratingsOnlyCount = users.filter(u => u.user_path === 'rating_only').length;
  const suggestionsOnlyCount = users.filter(u => u.user_path === 'suggestion_only').length;
  const bothCount = users.filter(u => u.user_path === 'both').length;

  const ratingO = totalUsers ? Math.round((ratingsOnlyCount / totalUsers) * 100) : 0;
  const suggO = totalUsers ? Math.round((suggestionsOnlyCount / totalUsers) * 100) : 0;
  const both = totalUsers ? Math.round((bothCount / totalUsers) * 100) : 0;

  const pieChartData = {
    labels: ['Rated Only', 'Suggested Only', 'Both Rated & Suggested'],
    datasets: [{
      data: [ratingO, suggO, both],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      hoverBackgroundColor: ['#2563EB', '#059669', '#D97706'],
    }],
  };

  // Mock data for service points
  const mockServicePoints = companyData?.servicePoints?.map(point => {
    const service = point?.name;
    return service;
  }) || []

  // const displayedServicePoints =
  //   selectedBranchId
  //     ? branches.find((b) => b.id === parseInt(selectedBranchId))?.servicePoints || []
  //     : companyData?.servicePoints || [];

  // Mock data for ratings bar chart
  const ratingsBarData = {
    labels: mockServicePoints,
    datasets: [{
      label: 'Number of Ratings',
      data: mockServicePoints.map(servicePoint =>
        ratings.filter(rating => rating.service_point === servicePoint).length
      ),
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      borderWidth: 1,
    }],
  };

  // Mock data for comments bar chart
  const commentsBarData = {
    labels: mockServicePoints,
    datasets: [{
      label: 'Number of Comments',
      data: mockServicePoints.map(servicePoint =>
        comments.filter(comment => {
          const rating = ratings.find(r => r.id === comment.rating_id);
          return rating && rating.service_point === servicePoint;
        }).length
      ),
      backgroundColor: '#10B981',
      borderColor: '#059669',
      borderWidth: 1,
    }],
  };

  const handleSwitchBranch = (branch) => {
    // setBranches(branch)
  }

  const handleSaveBranch = async (formData) => {
    const companyId = localStorage.getItem('company_id')
    const newBranch = {
      id: Date.now(),
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
      servicePoints: formData.servicePoints?.map(sp => ({
        servicePoint: sp.name,
        criteria: sp.criteria.map(c => ({
          title: c.title,
          priority: c.priority,
        })),
      }))
    };

    console.log(newBranch);

    try {
      const insertedBranch = await insertNewBranch(newBranch);
    } catch (error) {
      setError(error)
    }

    setBranches([...branches, newBranch]);
    setShowBranchModal(false);
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                {companyData?.logoUrl ? (
                  <img
                    src={companyData?.logoUrl}
                    alt='logo'
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{companyData?.company_name}</h1>
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{companyData?.location}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{companyData?.industry}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Branch Selector */}
              {branches.length > 0 && (
                <div className="relative">
                  <select
                    value={branches.id || ''}
                    onChange={(e) => handleSwitchBranch(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {branches?.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}-branch
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

              <button
                onClick={handleTest}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{averageRating}</p>
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
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">{activeServicePoints}</p>
                <p className="text-xs text-gray-500">of {companyData?.servicePoints?.length} total</p>
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
                <p className="text-2xl font-bold text-gray-900">{totalComments}</p>
                <p className="text-xs text-gray-500">user feedback</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Lightbulb className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suggested Ideas</p>
                <p className="text-2xl font-bold text-gray-900">{pendingSuggestions}</p>
                <p className="text-xs text-gray-500">suggestions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Company Info Pie Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Distribution</h3>
                    <div className="w-full max-w-xs mx-auto">
                      <Pie
                        data={pieChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.label}: ${context.raw}%`,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = distribution[rating];
                        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                        return (
                          <div key={rating} className="flex items-center">
                            <span className="text-sm text-gray-600 w-6">{rating}</span>
                            <Star className="h-4 w-4 text-yellow-400 fill-current mx-2" />
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 ml-2 w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Ratings</h3>
                    <div className="w-full max-w-md mx-auto">
                      <Bar
                        data={ratingsBarData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.dataset.label}: ${context.raw}`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Number of Ratings',
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Service Point',
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Comments</h3>
                    <div className="w-full max-w-md mx-auto">
                      <Bar
                        data={commentsBarData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.dataset.label}: ${context.raw}`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Number of Comments',
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Service Point',
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

            {/* Service Points Tab */}
            {activeTab === 'service-points' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Service Points</h3>
                  <span className="text-sm text-gray-600">
                    {activeServicePoints} active of {companyData?.servicePoints?.length} total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companyData?.servicePoints?.map((servicePoint) => {
                    // Filter ratings for this specific service point
                    const serviceRatings = ratings.filter(r => r.service_point === servicePoint.name);
                    // Aggregate all criteria scores for this service point
                    let totalScore = 0;
                    let totalCount = 0;
                    serviceRatings.forEach(r => {
                      const ratingObj = typeof r.rating === 'string' ? JSON.parse(r.rating) : r.rating;
                      Object.values(ratingObj).forEach(val => {
                        if (typeof val === 'number') {
                          totalScore += val;
                          totalCount++;
                        }
                      });
                    });
                    const avgRating = totalCount > 0 ? (totalScore / totalCount) : 0;

                    return (
                      <div key={servicePoint.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{servicePoint.name}</h4>
                            <p className="text-sm text-gray-600">{servicePoint.department}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${servicePoint.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {servicePoint.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-900">Rating Criteria:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {servicePoint.ratingCriteria.map((criterion, index) => (
                              <li key={index}>
                                {criterion.title}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${criterion.isRequired ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                                  {criterion.isRequired ? 'Required' : 'Optional'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex justify-between items-center">
                          {renderStars(avgRating)}
                          <span className="text-xs text-gray-500">
                            {serviceRatings.length} {serviceRatings.length === 1 ? 'review' : 'reviews'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === 'ratings' && (
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
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Service Points</option>
                    {companyData?.servicePoints?.map((sp) => (
                      <option key={sp.id} value={sp.name}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  {getFilteredRatings(ratings, filterCategory, searchTerm).map((rating) => {
                    const ratingObj = typeof rating.rating === 'string' ? JSON.parse(rating.rating) : rating.rating;
                    const avgScore = Object.values(ratingObj).filter(val => typeof val === 'number').reduce((a, b) => a + b, 0) / Object.keys(ratingObj).length || 0;
                    return (
                      <div key={rating.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold text-gray-900">{rating.username}</p>
                            <p className="text-sm text-gray-600">{rating.service_point}</p>
                          </div>
                          <div className="text-right">
                            {renderStars(avgScore)}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-gray-700 text-sm space-y-1">
                          {Object.entries(ratingObj).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-evenly bg-gray-50 p-2 rounded-full m-1">
                              <span>Criterion: {key}</span>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`h-4 w-4 ${star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
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
                    {companyData?.servicePoints?.map((sp) => (
                      <option key={sp.id} value={sp.name}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  {getFilteredFeedback(recentComments, filterCategory, searchTerm).map((comment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">{comment.username}</p>
                          <p className="text-sm text-gray-600">{comment.phone_number}</p>
                          <p className="text-xs text-blue-600">
                            Service Point: {getServicePointByRatingId(comment.rating_id)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(comment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ul className="text-gray-700">
                        {comment.categories.map((cat, i) => (
                          <li key={i}>
                            <span className="font-medium">{cat.category}:</span>
                            <span className="ml-2">{cat.content}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Prefs Tab */}
            {activeTab === 'user-prefs' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Defined Ratings</h3>
                  <p className="text-gray-600">
                    These are the added user preferences.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherData.map((pref) => (
                    <div key={pref.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{pref.username}</h4>
                          <p className="text-sm text-gray-600">{pref.phone_number}</p>
                        </div>
                        <span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                          {pref.department ? pref.department : 'General'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Rating Criteria:</p>
                        <div className="space-y-2">
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Named-Criteria</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Rating-Given</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Description</th>
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
                                          className={`h-4 w-4 ${star <= pref.ratings ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
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
            {activeTab === 'suggestions' && (
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

                <div className="space-y-4">
                  {getFilteredSuggestion(suggestions, searchTerm).map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{suggestion.username}</h4>
                          <p className="text-sm text-gray-600">{suggestion.phone_number}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className='px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                            {getServicePointByRatingId(suggestion.rating_id)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{suggestion.suggestion}</p>
                      <p className="text-xs text-gray-500">
                        Submitted {new Date(suggestion.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BranchModal
        isOpen={showBranchModal}
        onClose={() => { setShowBranchModal(false) }}
        onSave={handleSaveBranch}
        servicePoints={companyData?.servicePoints}
      />

    </div>
  );
}

export default Dashboard;