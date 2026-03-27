"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

const typeConfig = {
  booking_payment: {
    label: "Booking Payment",
    icon: "mdi:calendar-arrow-right",
    color: "text-red-500",
    sign: "-",
  },
  booking_earning: {
    label: "Booking Earning",
    icon: "mdi:calendar-arrow-left",
    color: "text-green-600",
    sign: "+",
  },
  platform_fee: {
    label: "Platform Fee",
    icon: "mdi:percent",
    color: "text-gray-500",
    sign: "-",
  },
  deposit: {
    label: "Deposit",
    icon: "mdi:bank-transfer-in",
    color: "text-blue-500",
    sign: "+",
  },
  withdrawal: {
    label: "Withdrawal",
    icon: "mdi:bank-transfer-out",
    color: "text-orange-500",
    sign: "-",
  },
  refund: {
    label: "Refund",
    icon: "mdi:cash-refund",
    color: "text-purple-500",
    sign: "+",
  },
};

const statusColors = {
  pending:   "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed:    "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-600",
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

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Deposit state
  const [depositModal, setDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // Withdrawal state
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [mpesaName, setMpesaName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchWallet();

      const params = new URLSearchParams(window.location.search);
      if (params.get("deposit") === "success") {
        Swal.fire({
          title: "Deposit Successful!",
          text: "Your wallet has been credited.",
          icon: "success",
          confirmButtonText: "OK",
        });
        window.history.replaceState({}, "", "/wallet");
      }
      if (params.get("deposit") === "cancelled") {
        Swal.fire({
          title: "Deposit Cancelled",
          text: "Your deposit was not completed.",
          icon: "info",
          confirmButtonText: "OK",
        });
        window.history.replaceState({}, "", "/wallet");
      }
    }
  }, [status]);

  const fetchWallet = async () => {
    try {
      const res = await axios.get("/api/GetWallet");
      setBalance(res.data.balance);
      setTotalEarned(res.data.totalEarned);
      setTotalSpent(res.data.totalSpent);
      setTransactions(res.data.transactions);
    } catch (err) {
      Swal.fire({ title: "Error", text: "Failed to load wallet.", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 100) {
      Swal.fire({ title: "Invalid Amount", text: "Minimum deposit is KES 100.", icon: "warning" });
      return;
    }
    setDepositLoading(true);
    try {
      const res = await axios.post("/api/stripe/CreateCheckout", { amount });
      window.location.href = res.data.url;
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.error || "Something went wrong.",
        icon: "error",
      });
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 1000) {
      Swal.fire({ title: "Invalid Amount", text: "Minimum withdrawal is KES 1,000.", icon: "warning" });
      return;
    }
    if (amount > balance) {
      Swal.fire({ title: "Insufficient Balance", text: "You don't have enough balance.", icon: "warning" });
      return;
    }
    if (!mpesaNumber || !mpesaName) {
      Swal.fire({ title: "Missing Details", text: "Please enter your M-Pesa number and name.", icon: "warning" });
      return;
    }

    setWithdrawLoading(true);
    try {
      await axios.post("/api/RequestWithdrawal", {
        amount,
        mpesaNumber,
        mpesaName,
      });

      setWithdrawModal(false);
      setWithdrawAmount("");
      setMpesaNumber("");
      setMpesaName("");

      Swal.fire({
        title: "Withdrawal Requested!",
        text: "Your request is being reviewed. M-Pesa payment will be sent within 24 hours.",
        icon: "success",
        confirmButtonText: "OK",
      });

      // Refresh wallet data
      fetchWallet();

    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.error || "Something went wrong.",
        icon: "error",
      });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesSearch =
      search.trim() === "" ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

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
        <Icon icon="mdi:wallet-outline" width={32} className="text-red-500" />
        <h1 className="text-3xl font-extrabold text-gray-900">My Wallet</h1>
      </div>

      {/* Balance + Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

        {/* Balance */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm font-semibold opacity-80 mb-1">Available Balance</p>
          <p className="text-3xl font-extrabold">{formatKES(balance)}</p>
          <p className="text-xs opacity-70 mt-2 mb-4">{session?.user?.name}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDepositModal(true)}
              className="flex-1 bg-white text-red-600 font-bold py-2 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-1 text-sm"
            >
              <Icon icon="mdi:plus-circle-outline" width={16} />
              Deposit
            </button>
            <button
              onClick={() => setWithdrawModal(true)}
              disabled={balance < 1000}
              className="flex-1 bg-white/20 text-white font-bold py-2 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="mdi:minus-circle-outline" width={16} />
              Withdraw
            </button>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="mdi:trending-up" width={22} className="text-green-500" />
            <p className="text-sm font-semibold text-gray-500">Total Earned</p>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{formatKES(totalEarned)}</p>
          <p className="text-xs text-gray-400 mt-1">As item owner</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="mdi:trending-down" width={22} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-500">Total Spent</p>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{formatKES(totalSpent)}</p>
          <p className="text-xs text-gray-400 mt-1">As renter</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select select-bordered rounded-xl text-sm"
          >
            <option value="all">All Types</option>
            <option value="booking_payment">Booking Payment</option>
            <option value="booking_earning">Booking Earning</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="refund">Refund</option>
          </select>
        </div>

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
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.map((t) => {
                  const config = typeConfig[t.type] ?? {
                    label: t.type,
                    icon: "mdi:circle",
                    color: "text-gray-500",
                    sign: "",
                  };
                  return (
                    <tr key={t._id} className="hover:bg-gray-50 transition-all">
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="py-3 pr-4 text-gray-800 max-w-[200px] truncate">
                        {t.description}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1">
                          <Icon icon={config.icon} width={16} className={config.color} />
                          <span className={`font-semibold ${config.color}`}>
                            {config.label}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-bold ${config.sign === "+" ? "text-green-600" : "text-red-500"}`}>
                        {config.sign}{formatKES(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {depositModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Deposit Funds</h2>
              <button onClick={() => setDepositModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="maki:cross" width={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              You'll be redirected to Stripe to complete the payment securely.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (KES) *</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                min={100}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="input input-bordered w-full rounded-xl"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum deposit: KES 100</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDepositModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositLoading}
                className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {depositLoading ? (
                  <><Icon icon="eva:loader-outline" width={18} className="animate-spin" /> Redirecting…</>
                ) : (
                  <><Icon icon="mdi:credit-card-outline" width={18} /> Pay with Card</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Withdraw Funds</h2>
              <button onClick={() => setWithdrawModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="maki:cross" width={18} />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex gap-2">
              <Icon icon="mdi:information-outline" width={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                Withdrawals are processed manually via M-Pesa within 24 hours. Your balance will be deducted immediately.
              </p>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (KES) *</label>
              <input
                type="number"
                placeholder="e.g. 2000"
                min={1000}
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="input input-bordered w-full rounded-xl"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum: KES 1,000 — Available: {formatKES(balance)}
              </p>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">M-Pesa Number *</label>
              <input
                type="text"
                placeholder="e.g. 0712345678"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
                className="input input-bordered w-full rounded-xl"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">M-Pesa Registered Name *</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={mpesaName}
                onChange={(e) => setMpesaName(e.target.value)}
                className="input input-bordered w-full rounded-xl"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setWithdrawModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {withdrawLoading ? (
                  <><Icon icon="eva:loader-outline" width={18} className="animate-spin" /> Processing…</>
                ) : (
                  <><Icon icon="mdi:bank-transfer-out" width={18} /> Request Withdrawal</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}