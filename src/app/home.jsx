"use client";

import Link from "next/link";
import Image from "next/image";
import { ConvertDateToDaysAgo } from "@/modules/utilities";
import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";

// Category icons
const CATEGORIES = [
  { label: "All", icon: "mdi:view-grid" },
  { label: "Electronics", icon: "mdi:laptop" },
  { label: "Vehicles", icon: "mdi:car" },
  { label: "Tools", icon: "mdi:wrench" },
  { label: "Videography", icon: "mdi:camera" },
  { label: "Audio Devices", icon: "mdi:headphones" },
  { label: "Gaming", icon: "mdi:gamepad-variant" },
  { label: "Furniture", icon: "mdi:sofa" },
  { label: "Sports", icon: "mdi:bicycle" },
  { label: "Outdoor", icon: "mdi:tent" },
  { label: "Computers", icon: "mdi:desktop-classic" },
  { label: "Mobile Phones", icon: "mdi:cellphone" },
];

const ItemCard = ({ item }) => {
  return (
    <Link href={`/item/${item._id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">

        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={"https://wsrv.nl?url=" + item.images[0] + "&w=400&h=300&fit=cover&a=attention"}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Availability Badge */}
          <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full shadow ${item.isAvailable ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {item.isAvailable ? "Available" : "Unavailable"}
          </span>
          {/* Category Badge */}
          <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
            {item.category}
          </span>
        </div>

        {/* Details */}
        <div className="p-4">
          <h2 className="font-bold text-gray-900 text-base line-clamp-2 mb-2 group-hover:text-red-500 transition-colors">
            {item.name}
          </h2>

          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <Icon icon="mdi:map-marker-outline" width={16} />
            <span className="truncate">{item.my_location}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              {item.price.type === "Free" || item.price.amount === 0 ? (
                <span className="text-green-600 font-bold text-lg">FREE</span>
              ) : (
                <div>
                  <span className="text-red-500 font-extrabold text-lg">
                    KES {item.price.amount.toLocaleString("en-KE")}
                  </span>
                  <span className="text-gray-400 text-sm"> /day</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {ConvertDateToDaysAgo(item.created_at)}
            </span>
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
  const [heroSearch, setHeroSearch] = useState("");

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
    setHeroSearch("");
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    setSearch(heroSearch);
    // Scroll to listings
    document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredItems = useMemo(() => {
    let result = [...data];

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

    if (selectedCategory !== "All") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (selectedLocation !== "All") {
      result = result.filter((item) => item.my_location === selectedLocation);
    }

    if (minPrice !== "") {
      result = result.filter((item) => item.price.amount >= Number(minPrice));
    }
    if (maxPrice !== "") {
      result = result.filter((item) => item.price.amount <= Number(maxPrice));
    }

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
    <main className="min-h-screen bg-gray-50">

      {/* ── HERO SECTION ── */}
      <div className="relative w-full h-[480px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1501669362114-90c01bd6aeaa?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 w-full max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
            Rent Anything
          </h1>
          <p className="text-white/80 text-lg mb-8">
            From people in your area in just a few clicks
          </p>

          {/* Hero Search */}
          <form onSubmit={handleHeroSearch} className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Icon icon="akar-icons:search" width={20} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Cars, drones, electronics etc"
                className="w-full outline-none text-gray-800 placeholder-gray-400 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <Icon icon="akar-icons:search" width={16} />
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── CATEGORY ICONS ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-[64px] z-40">
        <div className="max-w-screen-xl mx-auto px-4 py-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 min-w-max mx-auto justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label === "All" ? "All" : cat.label)}
                className={`flex flex-col items-center gap-1.5 group transition-all ${
                  selectedCategory === cat.label || (cat.label === "All" && selectedCategory === "All")
                    ? "text-red-500"
                    : "text-gray-500 hover:text-red-400"
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  selectedCategory === cat.label || (cat.label === "All" && selectedCategory === "All")
                    ? "bg-red-50 border-2 border-red-400"
                    : "bg-gray-100 group-hover:bg-red-50"
                }`}>
                  <Icon icon={cat.icon} width={26} />
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LISTINGS SECTION ── */}
      <div id="listings" className="max-w-screen-xl mx-auto px-4 py-8">

        {/* Search + Sort + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon icon="akar-icons:search" width={18} />
            </span>
            <input
              type="text"
              value={search}
              placeholder="Search listings..."
              className="w-full rounded-full border border-gray-200 pl-10 pr-10 py-2.5 shadow-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition bg-white text-sm"
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon icon="maki:cross" width={12} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full border border-gray-200 px-4 py-2.5 shadow-sm bg-white text-sm text-gray-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
          >
            <option value="date">Newest First</option>
            <option value="date-on">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="name-za">Name (Z-A)</option>
            <option value="price">Price: Low to High</option>
            <option value="price-hl">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm text-sm font-semibold transition-all ${
              hasActiveFilters
                ? "bg-red-500 text-white border-red-500"
                : "bg-white border-gray-200 text-gray-600 hover:border-red-300"
            }`}
          >
            <Icon icon="mdi:tune-variant" width={18} />
            Filters
            {hasActiveFilters && (
              <span className="bg-white text-red-500 text-xs font-bold px-1.5 py-0.5 rounded-full">
                ON
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {filtersOpen && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Location</label>
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
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Min Price (KES)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input input-bordered w-full rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Max Price (KES)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input input-bordered w-full rounded-xl text-sm"
              />
            </div>
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 rounded-xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <Icon icon="maki:cross" width={12} />
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-bold text-gray-800">{filteredItems.length}</span> item{filteredItems.length !== 1 ? "s" : ""} found
            {hasActiveFilters && <span className="text-red-400 ml-1">(filtered)</span>}
          </p>
          {selectedCategory !== "All" && (
            <span className="text-sm font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full">
              {selectedCategory}
            </span>
          )}
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col justify-center items-center gap-3 py-24 text-gray-400">
            <Icon icon="mdi:magnify-close" width={56} />
            <p className="text-xl font-semibold">No results found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-red-500 text-sm hover:underline font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
            {filteredItems.map((item, index) => (
              <ItemCard key={index} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}