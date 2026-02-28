"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const statusColors = {
  unverified: "bg-gray-100 text-gray-600",
  pending:    "bg-yellow-100 text-yellow-700",
  verified:   "bg-green-100 text-green-700",
  rejected:   "bg-red-100 text-red-600",
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("pending");

 useEffect(() => {
  console.log("status:", status);
  console.log("session email:", session?.user?.email);
  console.log("ADMIN_EMAIL:", ADMIN_EMAIL);
  console.log("match:", session?.user?.email === ADMIN_EMAIL);

  if (status === "unauthenticated") {
    router.push("/login");
    return;
  }
  if (status === "authenticated") {
    if (session?.user?.email !== ADMIN_EMAIL) {
      router.push("/");
      return;
    }
    fetchUsers();
  }
}, [status, session]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/admin/GetUsers");
      setUsers(res.data.users);
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to load users.", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateVerification = async (userId, action) => {
    const label = action === "verified" ? "Approve" : "Reject";
    const result = await Swal.fire({
      title: `${label} User?`,
      text: `Are you sure you want to ${label.toLowerCase()} this user?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: label,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        actions: "flex justify-center gap-4",
        confirmButton: `${action === "verified" ? "bg-green-600" : "bg-red-600"} text-white px-5 py-2 rounded-xl shadow-md`,
        cancelButton: "bg-gray-400 text-white px-5 py-2 rounded-xl shadow-md",
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;

    setUpdatingId(userId);
    try {
      await axios.post("/api/admin/UpdateVerification", { userId, action });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, verified: action } : u))
      );
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.error || "Something went wrong.",
        icon: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    filter === "all" ? true : u.verified === filter
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icon icon="eva:loader-outline" className="animate-spin text-gray-400" width={48} />
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto mt-[80px] px-4 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Icon icon="mdi:shield-account" width={32} className="text-red-500" />
        <h1 className="text-3xl font-extrabold text-gray-900">
          Admin — Verification Review
        </h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {["pending", "verified", "rejected", "unverified", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
              filter === f
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && (
              <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {users.filter((u) => u.verified === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users List */}
      <div className="flex flex-col gap-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <Icon icon="mdi:account-group-outline" width={48} className="mx-auto mb-3" />
            <p className="font-semibold">No users in this category</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-2xl shadow-md p-4 flex gap-4 items-start hover:shadow-lg transition-all"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user.image ? (
                  <Image src={user.image} alt={user.name} width={48} height={48} className="rounded-full object-cover" />
                ) : (
                  <Icon icon="mdi:account" width={28} className="text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[user.verified]}`}>
                    {(user.verified ?? "unverified").charAt(0).toUpperCase() + (user.verified ?? "unverified").slice(1)}
                  </span>
                </div>

                <div className="flex gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                  <span>Joined: {formatDate(user.createdAt)}</span>
                  {user.verificationSubmittedAt && (
                    <span>Submitted: {formatDate(user.verificationSubmittedAt)}</span>
                  )}
                  {user.documentType && (
                    <span>Doc: {user.documentType}</span>
                  )}
                </div>

                {/* Document Preview */}
               {user.verificationDocument && (
  <a
    href={user.verificationDocument}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1 mt-2 text-sm text-red-500 hover:underline"
  >
    <Icon icon="mdi:file-eye-outline" width={16} />
    View Document
  </a>
)}

                {/* Actions — only for pending */}
                {user.verified === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={updatingId === user._id}
                      onClick={() => updateVerification(user._id, "verified")}
                      className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 transition-all disabled:opacity-60"
                    >
                      {updatingId === user._id
                        ? <Icon icon="eva:loader-outline" className="animate-spin" width={16} />
                        : "Approve"}
                    </button>
                    <button
                      disabled={updatingId === user._id}
                      onClick={() => updateVerification(user._id, "rejected")}
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