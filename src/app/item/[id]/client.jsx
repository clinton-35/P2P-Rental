"use client";

import ImageCarousel from "@/components/ImageCarousel";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deliveryType } from "@/modules/dataRepo";
import { ConvertDateToDaysAgo } from "@/modules/utilities";
import Image from "next/image";

const renderPrice = (item) => {
  if (item.price.type === "Fixed" || item.price.type === "Negotiable") {
    return (
      <>
        <span className="text-3xl font-extrabold text-white">
          KES {item.price.amount.toLocaleString("en-KE")}
        </span>
        <span className="text-sm text-white/70"> /day</span>
      </>
    );
  }
  return <span className="text-3xl font-extrabold text-white">FREE</span>;
};

const renderRelatedPrice = (item) => {
  if (item.price.type === "Fixed" || item.price.type === "Negotiable") {
    return (
      <span className="text-red-500 font-bold text-sm">
        KES {item.price.amount.toLocaleString("en-KE")}
        <span className="text-gray-400 font-normal"> /day</span>
      </span>
    );
  }
  return <span className="text-green-600 font-bold text-sm">FREE</span>;
};

const renderDeliveryCost = (cost) => {
  if (cost === 0) return <span className="text-green-400 font-semibold">FREE</span>;
  return <span>KES {cost.toLocaleString("en-KE")}</span>;
};

export default function ItemClient({ item, related }) {
  const session = useSession();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [chatIcon, setChatIcon] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const router = useRouter();

  // Booking state
  const [bookingModal, setBookingModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return days > 0 ? days * (item.price.amount || 0) : 0;
  };

  const totalDays = () => {
    if (!startDate || !endDate) return 0;
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  useEffect(() => {
    if (session.status === "authenticated") setChatIcon("majesticons:chat-line");
    else if (session.status === "unauthenticated") setChatIcon("material-symbols:lock-outline");
    else setChatIcon("eva:loader-outline");
  }, [session]);

  const chatButtonClicked = async () => {
    if (item.selfOwned) { router.push(`/edit/${item._id}`); return; }
    if (session.status === "authenticated") {
      setChatLoading(true);
      axios.post("/api/chats/create", {
        item_id: item._id,
        temp_buyer_email: session.data.user.email,
        seller_id: item.seller,
      })
      .then((res) => { if (res.status === 200) router.push(`/message/${res.data._id}`); })
      .catch((err) => {
        setChatLoading(false);
        Swal.fire({ title: "Error", text: err.response.data.error, icon: "error" });
      });
    } else {
      Swal.fire({
        title: "Login Required", text: "You must be logged in to chat with the seller.",
        icon: "warning", showCancelButton: true, confirmButtonText: "Login", cancelButtonText: "Cancel",
        reverseButtons: true,
        customClass: {
          confirmButton: "bg-gradient-to-r from-red-500 to-red-700 text-white px-5 py-2 rounded-xl shadow-md",
          cancelButton: "bg-gray-400 text-white px-5 py-2 rounded-xl shadow-md",
        },
        buttonsStyling: false,
      }).then((r) => { if (r.isConfirmed) window.location.href = "/login"; });
    }
  };

  const bookButtonClicked = () => {
    if (session.status === "unauthenticated") {
      Swal.fire({
        title: "Login Required", text: "You must be logged in to book this item.",
        icon: "warning", showCancelButton: true, confirmButtonText: "Login", cancelButtonText: "Cancel",
        reverseButtons: true,
        customClass: {
          confirmButton: "bg-gradient-to-r from-red-500 to-red-700 text-white px-5 py-2 rounded-xl shadow-md",
          cancelButton: "bg-gray-400 text-white px-5 py-2 rounded-xl shadow-md",
        },
        buttonsStyling: false,
      }).then((r) => { if (r.isConfirmed) window.location.href = "/login"; });
      return;
    }
    setBookingModal(true);
  };

  const submitBooking = async () => {
    if (!startDate || !endDate) {
      Swal.fire({ title: "Missing Dates", text: "Please select both start and end dates.", icon: "warning" });
      return;
    }
    if (totalDays() <= 0) {
      Swal.fire({ title: "Invalid Dates", text: "End date must be after start date.", icon: "warning" });
      return;
    }
    setBookingLoading(true);
    try {
      await axios.post("/api/CreateBooking", {
        itemId: item._id, startDate, endDate,
        totalPrice: calculateTotal(), message: bookingMessage,
      });
      setBookingModal(false);
      setStartDate(""); setEndDate(""); setBookingMessage("");
      Swal.fire({ title: "Booking Sent!", text: "Your booking request has been sent to the owner.", icon: "success" });
    } catch (err) {
      if (err.response?.status === 403) {
        Swal.fire({
          title: "Verification Required", text: err.response.data.error, icon: "warning",
          confirmButtonText: "Verify Now", showCancelButton: true, cancelButtonText: "Later",
          reverseButtons: true,
          customClass: {
            confirmButton: "bg-red-500 text-white px-5 py-2 rounded-xl shadow-md",
            cancelButton: "bg-gray-400 text-white px-5 py-2 rounded-xl shadow-md",
          },
          buttonsStyling: false,
        }).then((r) => { if (r.isConfirmed) window.location.href = "/verify"; });
      } else {
        Swal.fire({ title: "Error", text: err.response?.data?.error || "Something went wrong.", icon: "error" });
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-8 mt-[80px]">

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
            {item.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? "bg-green-500" : "bg-red-500"}`} />
              {item.isAvailable ? "Available" : "Unavailable"}
            </span>
            <span className="flex items-center gap-1 text-gray-400 text-sm">
              <Icon icon="mdi:map-marker-outline" width={14} />
              {item.my_location}
            </span>
            <span className="flex items-center gap-1 text-gray-400 text-sm">
              <Icon icon="tabler:eye" width={14} />
              {item.views} views
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT — Images + Description + Details ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Main carousel */}
            <div className="rounded-2xl overflow-hidden shadow-md bg-white aspect-[4/3]">
              <ImageCarousel
                images={item.images}
                activeImageIndex={activeImageIndex}
                setActiveImageIndex={setActiveImageIndex}
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {item.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === i
                      ? "border-red-500 shadow-md scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={`https://wsrv.nl?url=${img}&w=80&h=80&fit=cover`}
                    alt={`thumb-${i}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Item Details</h2>
              <div className="divide-y divide-gray-100">
                {[
                  { label: "Condition", value: item.condition },
                  { label: "Category", value: item.category },
                  { label: "Location", value: item.my_location },
                  { label: "Delivery Area", value: deliveryType[item.delivery.type]?.area },
                  { label: "Delivery Type", value: deliveryType[item.delivery.type]?.type },
                  ...(item.delivery.type !== "Door Pickup"
                    ? [{ label: "Delivery Cost", value: renderDeliveryCost(item.delivery.cost) }]
                    : []),
                  { label: "Posted", value: ConvertDateToDaysAgo(item.created_at) },
                  {
                    label: "Listed By",
                    value: (
                      <Link href={`/lists/${item.seller}`} className="flex items-center gap-1 text-red-500 hover:underline font-semibold">
                        {item.seller_name}
                        <Icon icon="ic:round-link" width={14} />
                      </Link>
                    )
                  },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-3 text-sm">
                    <span className="text-gray-400">{row.label}</span>
                    <span className="text-gray-800 font-semibold text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT — Booking + Owner ── */}
          <div className="space-y-4 lg:sticky lg:top-24 self-start">

            {/* Pricing + Booking Card */}
            <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white shadow-xl">

              {/* Price */}
              <div className="flex items-baseline justify-between mb-5">
                <div>{renderPrice(item)}</div>
              </div>

              {/* Date range display */}
              {(startDate || endDate) && (
                <div className="bg-white/10 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm text-white/90">
                  <Icon icon="mdi:calendar-range" width={18} />
                  <span>
                    {startDate || "—"} → {endDate || "—"}
                  </span>
                </div>
              )}

              {/* Price breakdown when dates selected */}
              {totalDays() > 0 && (
                <div className="bg-white/10 rounded-xl px-4 py-3 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between text-white/80">
                    <span>KES {item.price.amount.toLocaleString("en-KE")} × {totalDays()} day{totalDays() > 1 ? "s" : ""}</span>
                    <span>KES {calculateTotal().toLocaleString("en-KE")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white border-t border-white/20 pt-2">
                    <span>Total</span>
                    <span>KES {calculateTotal().toLocaleString("en-KE")}</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                {!item.selfOwned && item.isAvailable && item.price.type !== "Free" && (
                  <button
                    onClick={bookButtonClicked}
                    className="w-full bg-white text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Icon icon="mdi:calendar-check" width={20} />
                    Request Rental
                  </button>
                )}

                <button
                  disabled={chatLoading}
                  onClick={chatButtonClicked}
                  className="w-full bg-white/15 border border-white/30 text-white font-semibold py-3 rounded-xl hover:bg-white/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {item.selfOwned ? (
                    <><Icon icon="bx:edit" width={20} /> Edit Item</>
                  ) : !item.isAvailable ? (
                    <><Icon icon="bx:check" width={20} /> On Loan</>
                  ) : chatLoading ? (
                    <><Icon icon="eva:loader-outline" width={20} className="animate-spin" /> Opening Chat…</>
                  ) : (
                    <><Icon icon={chatIcon} width={20} /> Ask a Question</>
                  )}
                </button>
              </div>
            </div>

            {/* Owner Card */}
            <div className="bg-red-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center text-white font-extrabold text-xl flex-shrink-0">
                  {item.seller_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold truncate">{item.seller_name}</p>
                    <Icon icon="mdi:check-decagram" width={16} className="text-green-300 flex-shrink-0" />
                  </div>
                  <p className="text-white/60 text-xs">Asset Owner</p>
                </div>
                <button
                  onClick={chatButtonClicked}
                  className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-all flex-shrink-0"
                >
                  <Icon icon="majesticons:chat-line" width={16} />
                  Chat
                </button>
              </div>

              <Link
                href={`/lists/${item.seller}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition-all"
              >
                <Icon icon="mdi:storefront-outline" width={16} />
                View All Listings
              </Link>
            </div>
          </div>
        </div>

        {/* ── RELATED ── */}
        <div className="mt-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-5">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {related.map((relItem, index) => (
              <Link key={index} href={`/item/${relItem._id}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border border-gray-100">
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={`https://wsrv.nl?url=${relItem.images[0]}&w=400&h=300&fit=cover&a=attention`}
                      alt={relItem.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                      relItem.isAvailable ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}>
                      {relItem.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 truncate text-sm group-hover:text-red-500 transition-colors">
                      {relItem.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 mb-2">{relItem.category}</p>
                    {renderRelatedPrice(relItem)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOOKING MODAL ── */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Request Rental</h2>
              <button onClick={() => setBookingModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="maki:cross" width={20} />
              </button>
            </div>

            <div className="bg-red-50 rounded-xl p-3 mb-5 flex items-center justify-between">
              <span className="font-semibold text-gray-800 text-sm truncate pr-2">{item.name}</span>
              <span className="text-red-500 font-bold text-sm flex-shrink-0">
                KES {item.price.amount.toLocaleString("en-KE")} /day
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Start Date</label>
                <input
                  type="date" min={today} value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate(""); }}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">End Date</label>
                <input
                  type="date" min={startDate || today} value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Message to Owner (optional)
              </label>
              <textarea
                placeholder="e.g. I'll need it for a camping trip..."
                value={bookingMessage}
                onChange={(e) => setBookingMessage(e.target.value)}
                className="textarea textarea-bordered w-full rounded-xl resize-none h-20 text-sm"
              />
            </div>

            {/* Price summary */}
            {totalDays() > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-1.5">
                <div className="flex justify-between text-gray-500">
                  <span>KES {item.price.amount.toLocaleString("en-KE")} × {totalDays()} day{totalDays() > 1 ? "s" : ""}</span>
                  <span>KES {calculateTotal().toLocaleString("en-KE")}</span>
                </div>
                <div className="flex justify-between font-extrabold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-red-500">KES {calculateTotal().toLocaleString("en-KE")}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setBookingModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitBooking}
                disabled={bookingLoading}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {bookingLoading ? (
                  <><Icon icon="eva:loader-outline" width={18} className="animate-spin" /> Sending…</>
                ) : (
                  <><Icon icon="mdi:calendar-check" width={18} /> Confirm Booking</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}