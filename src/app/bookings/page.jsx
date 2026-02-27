"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

const statusColors = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  active:    "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-700",
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

const ALL_STATUSES = ["all", "pending", "confirmed", "cancelled", "active", "completed"];

export default function BookingsPage() {
  const session = useSession();
  const router = useRouter();
  const [tab, setTab] = useState("my");
  const [myBookings, setMyBookings] = useState([]);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session.status === "authenticated") fetchBookings();
  }, [session.status]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("/api/GetBookings");
      setMyBookings(res.data.myBookings);
      setIncomingBookings(res.data.incomingBookings);
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to load bookings.", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (bookingId, status) => {
    const label = status === "confirmed" ? "Accept" : "Reject";
    const result = await Swal.fire({
      title: `${label} Booking?`,
      text: `Are you sure you want to ${label.toLowerCase()} this booking?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: label,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        actions: "flex justify-center gap-4",
        confirmButton: `${status === "confirmed" ? "bg-green-600" : "bg-red-600"} text-white px-5 py-2 rounded-xl shadow-md`,
        cancelButton: "bg-gray-400 text-white px-5 py-2 rounded-xl shadow-md",
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;

    setUpdatingId(bookingId);
    try {
      await axios.post("/api/UpdateBooking", { bookingId, status });
      setIncomingBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status } : b))
      );
    } catch (err) {
      Swal.fire({ title: "Error", text: err.response?.data?.error || "Something went wrong.", icon: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  // Reusable filter function — works for both my and incoming bookings
  const applyFilters = (bookings, nameKey) => {
    return bookings.filter((b) => {
      const matchesSearch =
        search.trim() === "" ||
        b.item.name.toLowerCase().includes(search.toLowerCase()) ||
        b[nameKey]?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || b.status === statusFilter;

      const bookingStart = new Date(b.startDate);
      const bookingEnd = new Date(b.endDate);
      const matchesDateFrom = dateFrom === "" || bookingEnd >= new Date(dateFrom);
      const matchesDateTo = dateTo === "" || bookingStart <= new Date(dateTo);

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  };

  // nameKey is "owner" for my bookings, "renter" for incoming
  const filteredMyBookings = useMemo(
    () => applyFilters(myBookings, "owner"),
    [myBookings, search, statusFilter, dateFrom, dateTo]
  );

  const filteredIncoming = useMemo(
    () => applyFilters(incomingBookings, "renter"),
    [incomingBookings, search, statusFilter, dateFrom, dateTo]
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = search || statusFilter !== "all" || dateFrom || dateTo;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icon icon="eva:loader-outline" className="animate-spin text-gray-400" width={48} />
      </div>
    );
  }

  const activeList = tab === "my" ? filteredMyBookings : filteredIncoming;

  return (
    <div className="max-w-screen-lg mx-auto mt-[80px] px-4 pb-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setTab("my")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            tab === "my" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          My Bookings
          {myBookings.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {myBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("incoming")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            tab === "incoming" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Incoming Bookings
          {incomingBookings.filter((b) => b.status === "pending").length > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {incomingBookings.filter((b) => b.status === "pending").length} pending
            </span>
          )}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon icon="akar-icons:search" width={18} />
          </span>
          <input
            type="text"
            placeholder={tab === "my" ? "Search by item or owner name..." : "Search by item or renter name..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-9 rounded-xl"
          />
        </div>

        {/* Status + Date filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered rounded-xl flex-1"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Date From */}
          <div className="flex flex-col flex-1">
            <label className="text-xs text-gray-500 mb-1 ml-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input input-bordered rounded-xl w-full"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col flex-1">
            <label className="text-xs text-gray-500 mb-1 ml-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input input-bordered rounded-xl w-full"
            />
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="self-start text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-all"
          >
            <Icon icon="maki:cross" width={12} />
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-gray-400 mb-4">
          Showing {activeList.length} result{activeList.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* BOOKING CARDS */}
      <div className="flex flex-col gap-4">
        {activeList.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <Icon icon="mdi:calendar-blank-outline" width={48} className="mx-auto mb-3" />
            <p className="font-semibold">
              {hasActiveFilters ? "No bookings match your filters" : tab === "my" ? "No bookings yet" : "No incoming bookings"}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="text-red-500 text-sm hover:underline mt-1">
                Clear filters
              </button>
            ) : tab === "my" ? (
              <Link href="/" className="text-red-500 text-sm hover:underline mt-1 inline-block">
                Browse items
              </Link>
            ) : null}
          </div>
        ) : (
          activeList.map((booking) => (
            <div key={booking._id} className="bg-white rounded-2xl shadow-md p-4 flex gap-4 items-start hover:shadow-lg transition-all">
              <Link href={`/item/${booking.item._id}`}>
                <Image
                  src={`https://wsrv.nl?url=${booking.item.images[0]}&w=100&h=100&fit=cover`}
                  alt={booking.item.name}
                  width={80}
                  height={80}
                  className="rounded-xl object-cover flex-shrink-0"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <Link href={`/item/${booking.item._id}`} className="font-bold text-gray-900 hover:text-red-500 transition-all truncate">
                    {booking.item.name}
                  </Link>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[booking.status]}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                {tab === "my" ? (
                  <p className="text-sm text-gray-500 mt-1">Owner: {booking.owner.name}</p>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    {booking.renter.image && (
                      <Image src={booking.renter.image} alt={booking.renter.name} width={20} height={20} className="rounded-full" />
                    )}
                    <p className="text-sm text-gray-500">From: {booking.renter.name}</p>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  KES {booking.totalPrice.toLocaleString("en-KE")}
                </p>
                {booking.message && (
                  <p className="text-xs text-gray-400 mt-1 italic">"{booking.message}"</p>
                )}

                {tab === "incoming" && booking.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={updatingId === booking._id}
                      onClick={() => updateBooking(booking._id, "confirmed")}
                      className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 transition-all disabled:opacity-60"
                    >
                      {updatingId === booking._id
                        ? <Icon icon="eva:loader-outline" className="animate-spin" width={16} />
                        : "Accept"}
                    </button>
                    <button
                      disabled={updatingId === booking._id}
                      onClick={() => updateBooking(booking._id, "cancelled")}
                      className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition-all disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}