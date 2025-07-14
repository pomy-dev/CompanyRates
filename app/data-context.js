"use client";

import { createContext, useContext, useState } from "react";

const DataContext = createContext();

const initialState = {
  username: "",
  phoneNumber: "",
  email: "",

  servicePoint: "",

  criteria: [],
  ratings: {},

  otherCriteria: {
    otherValue: "",
    otherRating: 0,
    otherReason: "",
  },

  suggestionBox: ""
};

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ratingData");
      return stored ? JSON.parse(stored) : initialState;
    }
    return initialState;
  });

  return (
    <DataContext.Provider value={{ data, setData }}>
      {children}
    </DataContext.Provider>
  );
}

export const useDataContext = () => useContext(DataContext);
