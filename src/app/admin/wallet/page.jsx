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
  cancelled: "bg-gray-100 text-gray-600",
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
  const [search, setSearch] = useState("");

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
      fetchWallet();
    }
  }, [status, session]);

  const fetchWallet = async () => {
    try {
      const res = await axios.get("/api/admin/GetWallet");
      setBalance(res.data.balance);
      setTotalFees(res.data.totalFees);
      setTransactions(res.data.transactions);
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to load admin wallet.", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

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

      {/* Balance + Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">

        {/* Platform Balance */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm font-semibold opacity-80 mb-1">Platform Balance</p>
          <p className="text-3xl font-extrabold">{formatKES(balance)}</p>
          <p className="text-xs opacity-70 mt-2">Accumulated from platform fees</p>
        </div>

        {/* Total Fees Collected */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="mdi:percent" width={22} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-500">Total Fees Collected</p>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{formatKES(totalFees)}</p>
          <p className="text-xs text-gray-400 mt-1">2% platform fee on all confirmed bookings</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Fee Transactions</h2>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon icon="akar-icons:search" width={16} />
          </span>
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-8 rounded-xl text-sm"
          />
        </div>

        {/* Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <Icon icon="mdi:receipt-text-outline" width={48} className="mx-auto mb-3" />
            <p className="font-semibold">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
          </div>
        )}
      </div>
    </div>
  );
}