"use client";

import React, { useState } from "react";
import StarRatings from "react-star-ratings";
import { useRouter } from "next/navigation";
import { getPriceQueryParams } from "../../helpers/helpers";

const Filters = () => {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const router = useRouter();

  let queryParams;

  function handleClick(checkbox) {
    if (typeof window !== "undefined") {
      queryParams = new URLSearchParams(window.location.search);
    }

    const checkboxes = document.getElementsByName(checkbox.name);

    // Uncheck all other checkboxes in the same group
    checkboxes.forEach((item) => {
      if (item !== checkbox) item.checked = false;
    });

    // Update the query parameters based on the checkbox state
    if (!checkbox.checked) {
      queryParams.delete(checkbox.name);
    } else {
      queryParams.set(checkbox.name, checkbox.value);
    }

    const path = window.location.pathname + "?" + queryParams.toString();
    router.push(path);
  }

  function handleButtonClick() {
    if (typeof window !== "undefined") {
      queryParams = new URLSearchParams(window.location.search);

      queryParams = getPriceQueryParams(queryParams, "min", min);
      queryParams = getPriceQueryParams(queryParams, "max", max);

      const path = window.location.pathname + "?" + queryParams.toString();
      router.push(path);
    }
  }

  function checkHandler(checkBoxType, checkBoxValue) {
    if (typeof window !== "undefined") {
      queryParams = new URLSearchParams(window.location.search);

      const value = queryParams.get(checkBoxType);
      return checkBoxValue === value;
    }
    return false;
  }

  return (
    <aside className="md:w-1/3 lg:w-1/4 px-4">
      {/* Mobile Filters Toggle */}
      <div className="md:hidden flex justify-between items-center p-2 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-lg">Filters</h3>
        <button
          className="text-blue-600 font-semibold"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          {isFilterOpen ? "Close Filters" : "Open Filters"}
        </button>
      </div>

      {/* Mobile Filters Content */}
      {isFilterOpen && (
        <div className="md:hidden p-4 border border-gray-200 bg-white rounded shadow-sm">
          {/* Price Filter */}
          <h3 className="font-semibold mb-2">Price ($)</h3>
          <div className="grid grid-cols-2 gap-x-2 mb-4">
            <input
              name="min"
              className="appearance-none border border-gray-200 bg-gray-100 rounded-md py-2 px-3 hover:border-gray-400 focus:outline-none focus:border-gray-400 w-full"
              type="number"
              placeholder="Min"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
            <input
              name="max"
              className="appearance-none border border-gray-200 bg-gray-100 rounded-md py-2 px-3 hover:border-gray-400 focus:outline-none focus:border-gray-400 w-full"
              type="number"
              placeholder="Max"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
          <button
            className="px-1 py-2 w-full text-center text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            onClick={handleButtonClick}
          >
            Go
          </button>

          {/* Category Filter */}
          <h3 className="font-semibold mt-4 mb-2">Category</h3>
          <ul className="space-y-1">
            {["Electronics", "Construction"].map((category) => (
              <li key={category}>
                <label className="flex items-center">
                  <input
                    name="category"
                    type="checkbox"
                    value={category}
                    className="h-4 w-4"
                    defaultChecked={checkHandler("category", category)}
                    onClick={(e) => handleClick(e.target)}
                  />
                  <span className="ml-2 text-gray-500">{category}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden md:block px-6 py-2 border border-gray-200 bg-white rounded shadow-sm mt-2">
        {/* Price Filter */}
        <h3 className="font-semibold mb-2">Price ($)</h3>
        <div className="grid md:grid-cols-3 gap-x-2">
          <div className="mb-2">
            <input
              name="min"
              className="appearance-none border border-gray-200 bg-gray-100 rounded-md py-2 px-3 hover:border-gray-400 focus:outline-none focus:border-gray-400 w-full"
              type="number"
              placeholder="Min"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <input
              name="max"
              className="appearance-none border border-gray-200 bg-gray-100 rounded-md py-2 px-3 hover:border-gray-400 focus:outline-none focus:border-gray-400 w-full"
              type="number"
              placeholder="Max"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <button
              className="px-1 py-2 text-center w-full inline-block text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              onClick={handleButtonClick}
            >
              Go
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <h3 className="font-semibold mt-4 mb-2">Category</h3>
        <ul className="space-y-1">
          {["Electronics", "Construction"].map((category) => (
            <li key={category}>
              <label className="flex items-center">
                <input
                  name="category"
                  type="checkbox"
                  value={category}
                  className="h-4 w-4"
                  defaultChecked={checkHandler("category", category)}
                  onClick={(e) => handleClick(e.target)}
                />
                <span className="ml-2 text-gray-500">{category}</span>
              </label>
            </li>
          ))}
        </ul>
        
      </div>
    </aside>
  );
};

export default Filters;
