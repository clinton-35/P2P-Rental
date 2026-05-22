"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const verificationStatusColors = {
  unverified: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const withdrawalStatusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatKES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab state — "verification" | "wallet"
  const [activeTab, setActiveTab] = useState("verification");

  // Verification state
  const [users, setUsers] = useState([]);
  const [verificationFilter, setVerificationFilter] = useState("pending");
  const [verificationSearch, setVerificationSearch] = useState("");
  const [updatingVerificationId, setUpdatingVerificationId] = useState(null);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [feeTransactions, setFeeTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState("pending");
  const [walletSearch, setWalletSearch] = useState([]);
  const [walletTab, setWalletTab] = useState("withdrawals");
  const [updatingWithdrawalId, setUpdatingWithdrawalId] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      if (session?.user?.email !== ADMIN_EMAIL) {
        router.push("/");
        return;
      }
      fetchAll();
    }
  }, [status, session]);

  const fetchAll = async () => {
    try {
      const [usersRes, walletRes, withdrawalsRes] = await Promise.all([
        axios.get("/api/admin/GetUsers"),
        axios.get("/api/admin/GetWallet"),
        axios.get("/api/admin/GetWithdrawals"),
      ]);
      setUsers(usersRes.data.users);
      setWalletBalance(walletRes.data.balance);
      setTotalFees(walletRes.data.totalFees);
      setFeeTransactions(walletRes.data.transactions);
      setWithdrawals(withdrawalsRes.data.withdrawals);
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Failed to load dashboard data.",
        icon: "error",
      });
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

    setUpdatingVerificationId(userId);
    try {
      await axios.post("/api/admin/UpdateVerification", { userId, action });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, verified: action } : u)),
      );
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.error || "Something went wrong.",
        icon: "error",
      });
    } finally {
      setUpdatingVerificationId(null);
    }
  };

  const updateWithdrawal = async (withdrawalId, action) => {
    const label = action === "completed" ? "Approve" : "Reject";
    const result = await Swal.fire({
      title: `${label} Withdrawal?`,
      text:
        action === "completed"
          ? "Confirm you have sent the M-Pesa payment before approving."
          : "The amount will be refunded to the user's wallet.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: label,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        actions: "flex justify-center gap-4",
        confirmButton: `${action === "completed" ? "bg-green-600" : "bg-red-600"} text-white px-5 py-2 rounded-xl shadow-md`,
        cancelButton: "bg-gray-400 text-white px-5 py-2 rounded-xl shadow-md",
      },
      buttonsStyling: false,
    });
    if (!result.isConfirmed) return;

    setUpdatingWithdrawalId(withdrawalId);
    try {
      await axios.post("/api/admin/UpdateWithdrawal", { withdrawalId, action });
      setWithdrawals((prev) =>
        prev.map((w) =>
          w._id === withdrawalId ? { ...w, status: action } : w,
        ),
      );
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.error || "Something went wrong.",
        icon: "error",
      });
    } finally {
      setUpdatingWithdrawalId(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesFilter =
      verificationFilter === "all" || u.verified === verificationFilter;
    const matchesSearch =
      verificationSearch.trim() === "" ||
      u.name?.toLowerCase().includes(verificationSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(verificationSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
  const matchesFilter =
    withdrawalFilter === "all" || w.status === withdrawalFilter;

  const search = String(walletSearch || "").toLowerCase().trim();

  const matchesSearch =
    search === "" ||
    w.userName?.toLowerCase().includes(search) ||
    w.userEmail?.toLowerCase().includes(search) ||
    w.mpesaNumber?.includes(search);

  return matchesFilter && matchesSearch;
});

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icon
          icon="eva:loader-outline"
          className="animate-spin text-gray-400"
          width={48}
        />
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto mt-[80px] px-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Icon icon="mdi:shield-account" width={32} className="text-red-500" />
        <h1 className="text-3xl font-extrabold text-gray-900">
          Admin Dashboard
        </h1>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("verification")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "verification"
              ? "border-red-500 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Icon icon="mdi:shield-account-outline" width={18} />
          Verification
          {users.filter((u) => u.verified === "pending").length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {users.filter((u) => u.verified === "pending").length} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("wallet")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "wallet"
              ? "border-red-500 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Icon icon="mdi:wallet-outline" width={18} />
          Wallet
          {withdrawals.filter((w) => w.status === "pending").length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {withdrawals.filter((w) => w.status === "pending").length} pending
            </span>
          )}
        </button>
      </div>

      {/* ── VERIFICATION TAB ── */}
      {activeTab === "verification" && (
        <>
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon icon="akar-icons:search" width={16} />
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={verificationSearch}
                onChange={(e) => setVerificationSearch(e.target.value)}
                className="input input-bordered w-full pl-8 rounded-xl text-sm"
              />
            </div>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="select select-bordered rounded-xl text-sm"
            >
              {["pending", "verified", "rejected", "unverified", "all"].map(
                (f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Users List */}
          <div className="flex flex-col gap-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                <Icon
                  icon="mdi:account-group-outline"
                  width={48}
                  className="mx-auto mb-3"
                />
                <p className="font-semibold">No users in this category</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-white rounded-2xl shadow-md p-4 flex gap-4 items-start hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <Icon
                        icon="mdi:account"
                        width={28}
                        className="text-gray-400"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {(() => {
                        const verificationStatus =
                          typeof user.verified === "string"
                            ? user.verified
                            : user.verified === true
                              ? "verified"
                              : user.verified === false
                                ? "unverified"
                                : "unverified";

                        return (
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              verificationStatusColors[verificationStatus] ||
                              verificationStatusColors.unverified
                            }`}
                          >
                            {verificationStatus.charAt(0).toUpperCase() +
                              verificationStatus.slice(1)}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>Joined: {formatDate(user.createdAt)}</span>
                      {user.verificationSubmittedAt && (
                        <span>
                          Submitted: {formatDate(user.verificationSubmittedAt)}
                        </span>
                      )}
                      {user.documentType && (
                        <span>Doc: {user.documentType}</span>
                      )}
                    </div>

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

                    {user.verified === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          disabled={updatingVerificationId === user._id}
                          onClick={() =>
                            updateVerification(user._id, "verified")
                          }
                          className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 transition-all disabled:opacity-60"
                        >
                          {updatingVerificationId === user._id ? (
                            <Icon
                              icon="eva:loader-outline"
                              className="animate-spin"
                              width={16}
                            />
                          ) : (
                            "Approve"
                          )}
                        </button>
                        <button
                          disabled={updatingVerificationId === user._id}
                          onClick={() =>
                            updateVerification(user._id, "rejected")
                          }
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
        </>
      )}

      {/* ── WALLET TAB ── */}
      {activeTab === "wallet" && (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm font-semibold opacity-80 mb-1">
                Platform Balance
              </p>
              <p className="text-3xl font-extrabold">
                {formatKES(walletBalance)}
              </p>
              <p className="text-xs opacity-70 mt-2">
                Accumulated from platform fees
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:percent" width={22} className="text-red-500" />
                <p className="text-sm font-semibold text-gray-500">
                  Total Fees Collected
                </p>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">
                {formatKES(totalFees)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                2% platform fee on all confirmed bookings
              </p>
            </div>
          </div>

          {/* Wallet Sub-tabs */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setWalletTab("withdrawals")}
              className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
                walletTab === "withdrawals"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Withdrawal Requests
              {withdrawals.filter((w) => w.status === "pending").length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {withdrawals.filter((w) => w.status === "pending").length}{" "}
                  pending
                </span>
              )}
            </button>
            <button
              onClick={() => setWalletTab("fees")}
              className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
                walletTab === "fees"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Platform Fee Transactions
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon icon="akar-icons:search" width={16} />
            </span>
            <input
              type="text"
              placeholder={
                walletTab === "withdrawals"
                  ? "Search by name or M-Pesa number..."
                  : "Search transactions..."
              }
              value={walletSearch}
              onChange={(e) => setWalletSearch(e.target.value)}
              className="input input-bordered w-full pl-8 rounded-xl text-sm"
            />
          </div>

          {/* Withdrawals Sub-tab */}
          {walletTab === "withdrawals" && (
            <>
              {/* Status filter pills */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {["pending", "completed", "rejected", "all"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setWithdrawalFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      withdrawalFilter === f
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                {filteredWithdrawals.length === 0 ? (
                  <div className="text-center text-gray-400 py-16">
                    <Icon
                      icon="mdi:bank-transfer-out"
                      width={48}
                      className="mx-auto mb-3"
                    />
                    <p className="font-semibold">No withdrawal requests</p>
                  </div>
                ) : (
                  filteredWithdrawals.map((w) => (
                    <div
                      key={w._id}
                      className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <p className="font-bold text-gray-900">
                            {w.userName}
                          </p>
                          <p className="text-sm text-gray-500">{w.userEmail}</p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${withdrawalStatusColors[w.status]}`}
                        >
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                          <p className="font-bold text-gray-900">
                            {formatKES(w.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            M-Pesa Number
                          </p>
                          <p className="font-semibold text-gray-800">
                            {w.mpesaNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Registered Name
                          </p>
                          <p className="font-semibold text-gray-800">
                            {w.mpesaName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Requested
                          </p>
                          <p className="text-gray-600">
                            {formatDate(w.createdAt)}
                          </p>
                        </div>
                        {w.reviewedAt && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Reviewed
                            </p>
                            <p className="text-gray-600">
                              {formatDate(w.reviewedAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      {w.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <button
                            disabled={updatingWithdrawalId === w._id}
                            onClick={() => updateWithdrawal(w._id, "completed")}
                            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 transition-all disabled:opacity-60"
                          >
                            {updatingWithdrawalId === w._id ? (
                              <Icon
                                icon="eva:loader-outline"
                                className="animate-spin"
                                width={16}
                              />
                            ) : (
                              "✓ Mark as Sent"
                            )}
                          </button>
                          <button
                            disabled={updatingWithdrawalId === w._id}
                            onClick={() => updateWithdrawal(w._id, "rejected")}
                            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition-all disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Fees Sub-tab */}
          {walletTab === "fees" && (
            <div className="overflow-x-auto bg-white rounded-2xl shadow-md border border-gray-100 p-4">
              {feeTransactions.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <Icon
                    icon="mdi:receipt-text-outline"
                    width={48}
                    className="mx-auto mb-3"
                  />
                  <p className="font-semibold">No fee transactions yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wide">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Description</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Fee Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {feeTransactions
  .filter((t) => {
    const search = String(walletSearch || "")
      .toLowerCase()
      .trim();

    return (
      search === "" ||
      t.description?.toLowerCase().includes(search)
    );
  })
  .map((t) => (
                        <tr
                          key={t._id}
                          className="hover:bg-gray-50 transition-all"
                        >
                          <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                            {formatDateTime(t.createdAt)}
                          </td>
                          <td className="py-3 pr-4 text-gray-800 max-w-[250px] truncate">
                            {t.description}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${withdrawalStatusColors[t.status] ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {t.status?.charAt(0).toUpperCase() +
                                t.status?.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold text-green-600">
                            +{formatKES(t.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
