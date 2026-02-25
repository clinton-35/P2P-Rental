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

const TableRow = ({ label, value }) => (
  <tr className="border-b hover:bg-gray-50 transition-all">
    <td className="p-3 font-semibold text-gray-700 w-[40%]">{label}</td>
    <td className="p-3 text-gray-600">{value}</td>
  </tr>
);

const renderPrice = (item) => {
  if (item.price.type === "Fixed" || item.price.type === "Negotiable") {
    return (
      <span className="text-lg font-bold text-gray-800">
        KES {item.price.amount.toLocaleString("en-KE")} / day
      </span>
    );
  }
  return <span className="font-bold text-green-600">FREE</span>;
};

const renderDeliveryCost = (cost) => {
  if (cost === 0) return <span className="font-bold text-green-600">FREE</span>;
  return (
    <span className="font-semibold text-gray-800">
      KES {cost.toLocaleString("en-KE")}
    </span>
  );
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

  // Calculate total price from selected dates
  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 0;
    return days * (item.price.amount || 0);
  };

  const totalDays = () => {
    if (!startDate || !endDate) return 0;
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  useEffect(() => {
    if (session.status === "authenticated") {
      setChatIcon("majesticons:chat-line");
    } else if (session.status === "unauthenticated") {
      setChatIcon("material-symbols:lock-outline");
    } else {
      setChatIcon("eva:loader-outline");
    }
  }, [session]);

  const chatButtonClicked = async () => {
    if (item.selfOwned) {
      router.push(`/edit/${item._id}`);
      return;
    }

    if (session.status === "authenticated") {
      setChatLoading(true);
      const data = {
        item_id: item._id,
        temp_buyer_email: session.data.user.email,
        seller_id: item.seller,
      };

      axios
        .post("/api/chats/create", data)
        .then((res) => {
          if (res.status === 200) {
            router.push(`/message/${res.data._id}`);
          }
        })
        .catch((err) => {
          setChatLoading(false);
          Swal.fire({
            title: "Error",
            text: err.response.data.error,
            icon: "error",
            confirmButtonText: "OK",
          });
        });
    } else if (session.status === "unauthenticated") {
      Swal.fire({
        title: "Login Required",
        text: "You must be logged in to chat with the seller.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        customClass: {
          actions: "flex justify-center gap-4",
          confirmButton: "bg-gradient-to-r from-red-500 to-red-700 text-white px-5 py-2 rounded-xl shadow-md hover:scale-105 hover:shadow-xl transition-all",
          cancelButton: "bg-gray-400 text-white px-5 py-2 rounded-xl shadow-md hover:scale-105 hover:shadow-xl transition-all",
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
    }
  };

  const bookButtonClicked = () => {
    if (session.status === "unauthenticated") {
      Swal.fire({
        title: "Login Required",
        text: "You must be logged in to book this item.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        customClass: {
          actions: "flex justify-center gap-4",
          confirmButton: "bg-gradient-to-r from-red-500 to-red-700 text-white px-5 py-2 rounded-xl shadow-md hover:scale-105 hover:shadow-xl transition-all",
          cancelButton: "bg-gray-400 text-white px-5 py-2 rounded-xl shadow-md hover:scale-105 hover:shadow-xl transition-all",
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) window.location.href = "/login";
      });
      return;
    }
    setBookingModal(true);
  };

  const submitBooking = async () => {
    if (!startDate || !endDate) {
      Swal.fire({ title: "Missing Dates", text: "Please select both start and end dates.", icon: "warning", confirmButtonText: "OK" });
      return;
    }

    if (totalDays() <= 0) {
      Swal.fire({ title: "Invalid Dates", text: "End date must be after start date.", icon: "warning", confirmButtonText: "OK" });
      return;
    }

    setBookingLoading(true);

    try {
      await axios.post("/api/CreateBooking", {
        itemId: item._id,
        startDate,
        endDate,
        totalPrice: calculateTotal(),
        message: bookingMessage,
      });

      setBookingModal(false);
      setStartDate("");
      setEndDate("");
      setBookingMessage("");

      Swal.fire({
        title: "Booking Sent!",
        text: "Your booking request has been sent to the owner.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.error || "Something went wrong.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto mt-[80px] gap-6">
        {/* LEFT IMAGE + ACTIONS */}
        <div className="md:w-1/2 m-4 flex flex-col rounded-2xl shadow-lg bg-white p-4 backdrop-blur-xl">
          <div className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500">
            <ImageCarousel
              images={item.images}
              activeImageIndex={activeImageIndex}
              setActiveImageIndex={setActiveImageIndex}
            />
          </div>

          {/* Views + Buttons */}
          <div className="my-4 flex justify-between items-center gap-2">
            <span className="font-[500] flex items-center text-gray-700">
              <Icon icon="tabler:eye" width={24} height={24} className="mr-1" />
              {item.views} Views
            </span>

            <div className="flex gap-2">
              {/* Book Button */}
              {!item.selfOwned && item.isAvailable && item.price.type !== "Free" && (
                <button
                  onClick={bookButtonClicked}
                  className="px-5 py-2 rounded-xl font-semibold text-white shadow-md transform transition-all duration-500 flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 hover:shadow-xl"
                >
                  <Icon icon="mdi:calendar-check" width={22} />
                  Book
                </button>
              )}

              {/* Chat Button */}
              <button
                disabled={chatLoading || (item.status === "sold" && !item.selfOwned)}
                onClick={chatButtonClicked}
                className={`px-5 py-2 rounded-xl font-semibold text-white shadow-md transform transition-all duration-500 flex items-center gap-2 
                  ${chatLoading || (item.status === "sold" && !item.selfOwned)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 hover:shadow-xl"}
                `}
              >
                {item.selfOwned ? (
                  <><Icon icon="bx:edit" width={22} /> Edit Item</>
                ) : !item.isAvailable  ? (
                  <><Icon icon="bx:check" width={22} /> On Loan</>
                ) : chatLoading ? (
                  <><Icon icon="eva:loader-outline" width={22} className="animate-spin" /> Opening Chat…</>
                ) : (
                  <><Icon icon={chatIcon} width={22} /> Chat Seller</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT DETAILS */}
        <div className="md:w-1/2 m-4 bg-white shadow-lg rounded-2xl p-6 backdrop-blur-xl animate-slideUp">
          <h1 className="text-3xl font-[800] mb-4 tracking-tight text-gray-900">{item.name}</h1>

          <table className="w-full border rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 font-semibold">Attribute</th>
                <th className="p-3 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <TableRow label="Price per day" value={renderPrice(item)} />
              <TableRow label="Delivery Area" value={deliveryType[item.delivery.type].area} />
              <TableRow label="Delivery Type" value={deliveryType[item.delivery.type].type} />
              {item.delivery.type !== "Door Pickup" && (
                <TableRow label="Delivery Cost" value={renderDeliveryCost(item.delivery.cost)} />
              )}
              <TableRow
                label="Owned By"
                value={
                  <Link href={`/lists/${item.seller}`} className="flex gap-1 items-center hover:text-red-500 transition-all">
                    {item.seller_name}
                    <Icon icon="ic:round-link" width={20} />
                  </Link>
                }
              />
              <TableRow label="Condition" value={item.condition} />
              <TableRow label="Category" value={item.category} />
              <TableRow label="Location" value={item.my_location} />
              <TableRow label="Posted" value={ConvertDateToDaysAgo(item.created_at)} />
            </tbody>
          </table>

          <div className="mt-6">
            <h2 className="font-bold text-lg mb-1">Description</h2>
            <p className="text-gray-700 leading-relaxed">{item.description}</p>
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Book Item</h2>
              <button onClick={() => setBookingModal(false)} className="text-gray-400 hover:text-gray-600 transition-all">
                <Icon icon="maki:cross" width={20} />
              </button>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              <span className="font-semibold text-gray-800">{item.name}</span> — KES {item.price.amount.toLocaleString("en-KE")} / day
            </div>

            {/* Start Date */}
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value >= endDate) setEndDate("");
                }}
                className="input input-bordered w-full rounded-lg"
              />
            </div>

            {/* End Date */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-bordered w-full rounded-lg"
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Message to Owner (optional)</label>
              <textarea
                placeholder="e.g. I'll need it for a camping trip..."
                value={bookingMessage}
                onChange={(e) => setBookingMessage(e.target.value)}
                className="textarea textarea-bordered w-full rounded-lg resize-none h-24"
              />
            </div>

            {/* Price Summary */}
            {totalDays() > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>KES {item.price.amount.toLocaleString("en-KE")} × {totalDays()} day{totalDays() > 1 ? "s" : ""}</span>
                  <span>KES {calculateTotal().toLocaleString("en-KE")}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>KES {calculateTotal().toLocaleString("en-KE")}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBookingModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitBooking}
                disabled={bookingLoading}
                className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {bookingLoading ? (
                  <><Icon icon="eva:loader-outline" width={20} className="animate-spin" /> Sending…</>
                ) : (
                  <><Icon icon="mdi:calendar-check" width={20} /> Confirm Booking</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RELATED */}
      <hr className="my-6" />
      <div className="max-w-screen-xl mx-auto">
        <h1 className="text-2xl font-bold mx-4 mb-4">You Might Also Like</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 m-4">
          {related.map((item, index) => (
            <Link key={index} href={`/item/${item._id}`}>
              <div className="rounded-xl overflow-hidden shadow-md bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer group">
                <div className="relative overflow-hidden">
                  <Image
                    src={`https://wsrv.nl?url=${item.images[0]}&w=400&h=300&fit=cover&a=attention`}
                    alt={item.name}
                    width={400}
                    height={300}
                    className="object-cover group-hover:scale-110 transition-all duration-700"
                  />
                </div>
                <div className="p-4">
                  <h1 className="text-lg font-bold truncate">{item.name}</h1>
                  <span className="text-gray-500">{item.category}</span>
                  <div className="mt-2 font-semibold text-gray-800">{renderPrice(item)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}