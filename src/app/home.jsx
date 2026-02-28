"use client";

import Link from "next/link";
import Image from "next/image";
import { ConvertDateToDaysAgo } from "@/modules/utilities";
import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";

const ItemCard = ({ item }) => {
  return (
    <Link href={`/item/${item._id}`} className="block w-full transition-transform hover:scale-[1.01]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white rounded-2xl shadow-sm hover:shadow-md m-2 p-4 transition-all duration-300 cursor-pointer border border-gray-200">
        <div className="col-span-1 flex justify-center items-center relative">
          <Image
            src={"https://wsrv.nl?url=" + item.images[0] + "&w=350&h=350&fit=cover&a=attention"}
            alt={item.name}
            width={350}
            height={350}
            className="rounded-2xl h-[160px] w-[160px] sm:h-[200px] sm:w-[200px] object-cover border shadow-sm hover:scale-105 transition-transform duration-300"
          />
          <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full shadow-sm ${item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {item.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>

        <div className="col-span-2 flex flex-col justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-2">{item.name}</h1>
            <p className="text-gray-700 text-lg mt-1 font-semibold">
              {item.price.type === "Free" || item.price.amount === 0 ? (
                <span className="text-green-600 font-bold">FREE</span>
              ) : (
                new Intl.NumberFormat("en-KE", {
                  style: "currency",
                  currency: "KES",
                  maximumFractionDigits: 0,
                }).format(item.price.amount)
              )}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-gray-600 text-sm">
            <p className="flex items-center gap-2">
              <Icon icon="mdi:location" width={18} height={18} />
              {item.my_location}
            </p>
            <p className="flex items-center gap-2">
              <Icon icon="material-symbols:category" width={18} height={18} />
              {item.category}
            </p>
            <p className="flex items-center gap-2">
              <Icon icon="mingcute:time-fill" width={18} height={18} />
              {ConvertDateToDaysAgo(item.created_at)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Home({ data }) {
  const [sortBy, setSortBy] = useState("date");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Derive unique categories and locations from data
  const categories = useMemo(() => {
    const cats = [...new Set(data.map((i) => i.category))].sort();
    return ["All", ...cats];
  }, [data]);

  const locations = useMemo(() => {
    const locs = [...new Set(data.map((i) => i.my_location))].sort();
    return ["All", ...locs];
  }, [data]);

  const hasActiveFilters =
    search || selectedCategory !== "All" || selectedLocation !== "All" || minPrice || maxPrice;

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedLocation("All");
    setMinPrice("");
    setMaxPrice("");
  };

  // Filter + sort in one pass
  const filteredItems = useMemo(() => {
    let result = [...data];

    // Name search
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower) ||
          item.keywords.includes(lower) ||
          item.category.toLowerCase().includes(lower)
      );
    }

    // Category
    if (selectedCategory !== "All") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Location
    if (selectedLocation !== "All") {
      result = result.filter((item) => item.my_location === selectedLocation);
    }

    // Price range
    if (minPrice !== "") {
      result = result.filter((item) => item.price.amount >= Number(minPrice));
    }
    if (maxPrice !== "") {
      result = result.filter((item) => item.price.amount <= Number(maxPrice));
    }

    // Sort
    const sortLogic = {
      "name-za": () => result.sort((a, b) => b.name.localeCompare(a.name)),
      name:      () => result.sort((a, b) => a.name.localeCompare(b.name)),
      date:      () => result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      "date-on": () => result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
      price:     () => result.sort((a, b) => a.price.amount - b.price.amount),
      "price-hl":() => result.sort((a, b) => b.price.amount - a.price.amount),
      popular:   () => result.sort((a, b) => b.views - a.views),
      "popular-lh": () => result.sort((a, b) => a.views - b.views),
    };
    sortLogic[sortBy]?.();

    return result;
  }, [data, search, selectedCategory, selectedLocation, minPrice, maxPrice, sortBy]);

  return (
    <main className="max-w-screen-xl mx-auto mt-[80px] px-4">

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 bg-white p-4 rounded-2xl shadow-md">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">
          Available Items
        </h1>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-full border border-gray-300 px-5 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition duration-300 bg-white text-gray-700"
        >
          <option value="date">Newest First</option>
          <option value="date-on">Oldest First</option>
          <option value="name">Name (A-Z)</option>
          <option value="name-za">Name (Z-A)</option>
          <option value="price">Price (Low to High)</option>
          <option value="price-hl">Price (High to Low)</option>
          <option value="popular-lh">Least Popular First</option>
          <option value="popular">Most Popular First</option>
        </select>
      </div>

      {/* Search Bar */}
      <div className="relative w-full mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon icon="akar-icons:search" width={20} height={20} />
        </span>
        <input
          type="text"
          value={search}
          placeholder="Search by name, category, keyword..."
          className="w-full rounded-full border border-gray-300 px-12 py-3 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 transition duration-300 placeholder-gray-400"
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Icon icon="maki:cross" width={14} />
          </button>
        )}
      </div>

      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={() => setFiltersOpen((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-all"
        >
          <Icon icon={filtersOpen ? "mdi:filter-off-outline" : "mdi:filter-outline"} width={20} />
          {filtersOpen ? "Hide Filters" : "Show Filters"}
          {hasActiveFilters && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-all"
          >
            <Icon icon="maki:cross" width={12} />
            Clear all filters
          </button>
        )}
      </div>

      {/* Expandable Filter Panel */}
      {filtersOpen && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select select-bordered w-full rounded-xl text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="select select-bordered w-full rounded-xl text-sm"
            >
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Min Price (KES)
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input input-bordered w-full rounded-xl text-sm"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Max Price (KES)
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input input-bordered w-full rounded-xl text-sm"
            />
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-gray-400 px-1 mb-2">
        {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found
        {hasActiveFilters && " (filtered)"}
      </p>

      {/* Items */}
      <div>
        {filteredItems.length === 0 ? (
          <div className="flex flex-col justify-center items-center gap-2 mt-14 text-gray-600">
            <Icon icon="akar-icons:search" width={50} height={50} />
            <p className="text-xl">No results found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-red-500 text-sm hover:underline mt-1">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-10">
            {filteredItems.map((item, index) => (
              <ItemCard key={index} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}