"use client";

import Link from "next/link";
import Image from "next/image";
import { ConvertDateToDaysAgo } from "@/modules/utilities";
import { useState } from "react";
import { Icon } from "@iconify/react";

const ItemCard = ({ item }) => {
  return (
    <Link
      href={`/item/${item._id}`}
      className="block w-full transition-transform hover:scale-[1.01]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white rounded-2xl shadow-sm hover:shadow-md m-2 p-4 transition-all duration-300 cursor-pointer border border-gray-200">
        {/* Image */}
        <div className="col-span-1 flex justify-center items-center">
          <Image
            src={
              "https://wsrv.nl?url=" +
              item.images[0] +
              "&w=350&h=350&fit=cover&a=attention"
            }
            alt={item.name}
            width={350}
            height={350}
            className="rounded-2xl h-[160px] w-[160px] sm:h-[200px] sm:w-[200px] object-cover border shadow-sm hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="col-span-2 flex flex-col justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-2">
              {item.name}
            </h1>
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
  const [items, setItems] = useState(data);

  const sortItems = (e) => {
    const value = e.target.value;
    const sorted = [...items];

    const sortLogic = {
      "name-za": () => sorted.sort((a, b) => b.name.localeCompare(a.name)),
      name: () => sorted.sort((a, b) => a.name.localeCompare(b.name)),
      date: () => sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      "date-on": () => sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
      price: () => sorted.sort((a, b) => a.price.amount - b.price.amount),
      "price-hl": () => sorted.sort((a, b) => b.price.amount - a.price.amount),
      popular: () => sorted.sort((a, b) => b.views - a.views),
      "popular-lh": () => sorted.sort((a, b) => a.views - b.views),
    };

    sortLogic[value]?.();
    setItems([...sorted]);
  };

  function searchFilter(keyword) {
    const lower = keyword.toLowerCase();
    if (lower.length > 0) {
      setItems(
        data.filter(
          (item) =>
            item.name.toLowerCase().includes(lower) ||
            item.description.toLowerCase().includes(lower) ||
            item.keywords.includes(lower) ||
            item.category.toLowerCase().includes(lower)
        )
      );
    } else {
      setItems(data);
    }
  }

  return (
    <main className="max-w-screen-xl mx-auto mt-[80px] px-4">
      {/* Header */}
<div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-md">
  {/* Title */}
  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">
    Available Items
  </h1>

  {/* Sort Dropdown */}
  <select
    className="
      rounded-full
      border
      border-gray-300
      px-5
      py-2
      shadow-sm
      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500
      outline-none
      transition
      duration-300
      bg-white
      text-gray-700
    "
    onChange={sortItems}
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


      {/* Search */}
      <div className="relative w-full">
  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
    <Icon icon="akar-icons:search" width={20} height={20} />
  </span>
  <input
    type="text"
    placeholder="Search items..."
    className="
      w-full
      rounded-full
      border
      border-gray-300
      px-12
      py-3
      shadow-sm
      outline-none
      focus:border-blue-400
      focus:ring-2
      focus:ring-blue-400
      transition
      duration-300
      placeholder-gray-400
    "
    onChange={(e) => searchFilter(e.target.value)}
  />
</div>

      {/* Items */}
      <div>
        {items.length === 0 ? (
          <div className="flex flex-col justify-center items-center gap-2 mt-14 text-gray-600">
            <Icon icon="akar-icons:search" width="50" height="50" />
            <p className="text-xl">No results found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-10">
            {items.map((item, index) => (
              <ItemCard key={index} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
