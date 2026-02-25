"use client";

import { useEffect, useState } from "react";
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

export default function BookingsPage() {
  const session = useSession();
  const router = useRouter();
  const [tab, setTab] = useState("my"); // "my" | "incoming"
  const [myBookings, setMyBookings] = useState([]);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session.status === "authenticated") {
      fetchBookings();
    }
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
      // Update local state without refetching
      setIncomingBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status } : b))
      );
    } catch (err) {
      Swal.fire({ title: "Error", text: err.response?.data?.error || "Something went wrong.", icon: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icon icon="eva:loader-outline" className="animate-spin text-gray-400" width={48} />
      </div>
    );
  }

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

      {/* MY BOOKINGS TAB */}
      {tab === "my" && (
        <div className="flex flex-col gap-4">
          {myBookings.length === 0 ? (
            <div className="text-center text-gray-400 py-20">
              <Icon icon="mdi:calendar-blank-outline" width={48} className="mx-auto mb-3" />
              <p className="font-semibold">No bookings yet</p>
              <Link href="/" className="text-red-500 text-sm hover:underline mt-1 inline-block">Browse items</Link>
            </div>
          ) : (
            myBookings.map((booking) => (
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
                  <p className="text-sm text-gray-500 mt-1">Owner: {booking.owner.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    KES {booking.totalPrice.toLocaleString("en-KE")}
                  </p>
                  {booking.message && (
                    <p className="text-xs text-gray-400 mt-1 italic">"{booking.message}"</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* INCOMING BOOKINGS TAB */}
      {tab === "incoming" && (
        <div className="flex flex-col gap-4">
          {incomingBookings.length === 0 ? (
            <div className="text-center text-gray-400 py-20">
              <Icon icon="mdi:calendar-blank-outline" width={48} className="mx-auto mb-3" />
              <p className="font-semibold">No incoming bookings</p>
            </div>
          ) : (
            incomingBookings.map((booking) => (
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

                  {/* Renter info */}
                  <div className="flex items-center gap-2 mt-1">
                    {booking.renter.image && (
                      <Image src={booking.renter.image} alt={booking.renter.name} width={20} height={20} className="rounded-full" />
                    )}
                    <p className="text-sm text-gray-500">From: {booking.renter.name}</p>
                  </div>

                  <p className="text-sm text-gray-500">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    KES {booking.totalPrice.toLocaleString("en-KE")}
                  </p>
                  {booking.message && (
                    <p className="text-xs text-gray-400 mt-1 italic">"{booking.message}"</p>
                  )}

                  {/* Accept / Reject — only for pending */}
                  {booking.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        disabled={updatingId === booking._id}
                        onClick={() => updateBooking(booking._id, "confirmed")}
                        className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 transition-all disabled:opacity-60"
                      >
                        {updatingId === booking._id ? <Icon icon="eva:loader-outline" className="animate-spin" width={16} /> : "Accept"}
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
      )}
    </div>
  );
}