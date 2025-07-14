'use client';
import React from 'react';
import Image from 'next/image'; // Assuming Next.js for optimized image handling
import { Images } from '@/component/images';
import { useDataContext } from '../data-context';

const HomeScreen = () => {


  const handleRateUsClick = () => {
    // Logic to handle rating action (e.g., redirect to a rating page)
    alert('Thank you for your feedback!');
  };


  return (
    <div className="flex flex-col items-center p-8 rounded-xl shadow-lg bg-white max-w-md mx-auto my-12">
      {/* Company Logo */}
      <div className="mb-6">
        <Image
          src={Images.logo} // Replace with your logo path or URL
          alt="Company Logo"
          width={120}
          height={120}
          className="object-contain"
          priority // Optional: for faster loading of above-the-fold content
        />
      </div>

      {/* Text Content */}
      <h2 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">
        We Value Your Feedback!
      </h2>
      <p className="text-gray-600 mb-6 text-center text-base">
        Please take a moment to rate us.
      </p>

      {/* Rate Us Button */}
      <button
        className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 font-medium"
        onClick={handleRateUsClick}
      >
        Rate Uss
      </button>
    </div>
  );
};

export default HomeScreen;