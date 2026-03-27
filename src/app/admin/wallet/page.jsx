"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const statusColors = {
  pending:   "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed:    "bg-red-100 text-red-600",
  rejected:  "bg-red-100 text-red-600",
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatKES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);

export default function AdminWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tab, setTab] = useState("withdrawals");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [withdrawalFilter, setWithdrawalFilter] = useState("pending");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      if (session?.user?.email !== ADMIN_EMAIL) { router.push("/"); return; }
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    try {
      const [walletRes, withdrawalsRes] = await Promise.all([
        axios.get("/api/admin/GetWallet"),
        axios.get("/api/admin/GetWithdrawals"),
      ]);
      setBalance(walletRes.data.balance);
      setTotalFees(walletRes.data.totalFees);
      setTransactions(walletRes.data.transactions);
      setWithdrawals(withdrawalsRes.data.withdrawals);
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to load data.", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateWithdrawal = async (withdrawalId, action) => {
    const label = action === "completed" ? "Approve" : "Reject";
    const result = await Swal.fire({
      title: `${label} Withdrawal?`,
      text: action === "completed"
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

    setUpdatingId(withdrawalId);
    try {
      await axios.post("/api/admin/UpdateWithdrawal", { withdrawalId, action });
      setWithdrawals((prev) =>
        prev.map((w) => (w._id === withdrawalId ? { ...w, status: action } : w))
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

  const filteredWithdrawals = withdrawals.filter((w) =>
    (withdrawalFilter === "all" || w.status === withdrawalFilter) &&
    (search.trim() === "" ||
      w.userName.toLowerCase().includes(search.toLowerCase()) ||
      w.mpesaNumber.includes(search) ||
      w.mpesaName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredTransactions = transactions.filter((t) =>
    search.trim() === "" ||
    t.description.toLowerCase().includes(search.toLowerCase())
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

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Icon icon="mdi:shield-account" width={32} className="text-red-500" />
        <h1 className="text-3xl font-extrabold text-gray-900">Admin Wallet</h1>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm font-semibold opacity-80 mb-1">Platform Balance</p>
          <p className="text-3xl font-extrabold">{formatKES(balance)}</p>
          <p className="text-xs opacity-70 mt-2">Accumulated from platform fees</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="mdi:percent" width={22} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-500">Total Fees Collected</p>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{formatKES(totalFees)}</p>
          <p className="text-xs text-gray-400 mt-1">2% platform fee on all confirmed bookings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setTab("withdrawals")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            tab === "withdrawals" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Withdrawal Requests
          {withdrawals.filter((w) => w.status === "pending").length > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {withdrawals.filter((w) => w.status === "pending").length} pending
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("fees")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            tab === "fees" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-800"
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
          placeholder={tab === "withdrawals" ? "Search by name, number..." : "Search transactions..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered w-full pl-8 rounded-xl text-sm"
        />
      </div>

      {/* Withdrawals Tab */}
      {tab === "withdrawals" && (
        <>
          {/* Status filter */}
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
                <Icon icon="mdi:bank-transfer-out" width={48} className="mx-auto mb-3" />
                <p className="font-semibold">No withdrawal requests</p>
              </div>
            ) : (
              filteredWithdrawals.map((w) => (
                <div key={w._id} className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{w.userName}</p>
                      <p className="text-sm text-gray-500">{w.userEmail}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[w.status]}`}>
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                      <p className="font-bold text-gray-900">{formatKES(w.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">M-Pesa Number</p>
                      <p className="font-semibold text-gray-800">{w.mpesaNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Registered Name</p>
                      <p className="font-semibold text-gray-800">{w.mpesaName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Requested</p>
                      <p className="text-gray-600">{formatDate(w.createdAt)}</p>
                    </div>
                    {w.reviewedAt && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Reviewed</p>
                        <p className="text-gray-600">{formatDate(w.reviewedAt)}</p>
                      </div>
                    )}
                  </div>

                  {w.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <button
                        disabled={updatingId === w._id}
                        onClick={() => updateWithdrawal(w._id, "completed")}
                        className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 transition-all disabled:opacity-60"
                      >
                        {updatingId === w._id
                          ? <Icon icon="eva:loader-outline" className="animate-spin" width={16} />
                          : "✓ Mark as Sent"}
                      </button>
                      <button
                        disabled={updatingId === w._id}
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

      {/* Fees Tab */}
      {tab === "fees" && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-md border border-gray-100 p-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <Icon icon="mdi:receipt-text-outline" width={48} className="mx-auto mb-3" />
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
                {filteredTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-all">
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="py-3 pr-4 text-gray-800 max-w-[250px] truncate">
                      {t.description}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[t.status]}`}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
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
    </div>
  );
}