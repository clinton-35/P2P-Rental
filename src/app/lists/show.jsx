"use client";

import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export default function MyItemList({ items, title, owner }) {
  const status = {
    available: owner === "me" ? "Waiting" : "Available",
    sold: "On Loan",
  };

  const deleteItem = (id) => {
  Swal.fire({
    title: "Delete Item",
    text: "Are you sure you want to delete this item?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    buttonsStyling: true, // ensure styling is applied
    customClass: {
      confirmButton: "bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg",
      cancelButton: "bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-lg"
    }
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/api/DeleteAd", {
        method: "POST",
        body: JSON.stringify({ id }),
      })
        .then((res) => res.json())
        .then(() => window.location.reload())
        .catch((error) =>
          Swal.fire({
            title: "Error",
            text: error.response?.data?.error || "Something went wrong",
            icon: "error",
            confirmButtonText: "OK",
            customClass: {
              confirmButton: "bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg",
            }
          })
        );
    }
  });
};


  return (
    <div className="max-w-screen-xl mx-auto mt-[80px] p-4">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 text-center">
        {title}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
          >
            <div className="flex p-4 items-center gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                <Image
                  src={`https://wsrv.nl?url=${item.images[0]}&w=128&h=128&fit=cover&a=attention`}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="text-lg font-semibold text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                  <span className="font-semibold">
                    {item.price.type === "Free" || item.price.amount === 0
                      ? "FREE"
                      : new Intl.NumberFormat("en-KE", {
                          style: "currency",
                          currency: "KES",
                          maximumFractionDigits: 0,
                        }).format(item.price.amount)}
                  </span>
                  <span
                    className={`font-medium ${
                      item.status === "sold"
                        ? "text-red-500"
                        : owner === "me"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {status[item.status]}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {owner === "me" && (
                    <Link href={`/edit/${item._id}`}>
                      <button className="btn btn-circle p-2 bg-gray-100 hover:bg-gray-200 transition-all">
                        <Icon icon="bx:edit" height="22" width="22" />
                      </button>
                    </Link>
                  )}

                  <Link href={`/item/${item._id}`}>
                    <button className="btn btn-circle p-2 bg-gray-100 hover:bg-gray-200 transition-all">
                      <Icon icon="ion:eye" height="22" width="22" />
                    </button>
                  </Link>

                  {owner === "me" && (
                    <button
                      className="btn btn-circle p-2 bg-red-100 hover:bg-red-200 transition-all"
                      onClick={() => deleteItem(item._id)}
                    >
                      <Icon icon="tabler:trash" height="22" width="22" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
