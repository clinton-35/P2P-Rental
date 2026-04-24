"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/ResetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen relative flex items-center justify-center px-4">

      {/* Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 50 + 8,
              height: Math.random() * 50 + 8,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.08 + 0.02,
            }}
            animate={{ y: [0, -30, 0], x: [0, 10, -10, 0] }}
            transition={{
              duration: Math.random() * 8 + 6,
              delay: Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-lg mb-3">
              <Image src="/logo.png" width={180} height={55} alt="Logo" />
            </div>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:check-circle-outline" width={36} className="text-green-400" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">Password Reset!</h2>
              <p className="text-white/60 text-sm mb-2">
                Your password has been updated successfully.
              </p>
              <p className="text-white/40 text-xs">
                Redirecting to login in 3 seconds…
              </p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-white font-bold text-xl mb-1 text-center">
                Set New Password
              </h2>
              <p className="text-white/50 text-sm text-center mb-6">
                Enter and confirm your new password below.
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
                >
                  <Icon icon="mdi:alert-circle-outline" width={18} />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="relative">
                  <Icon
                    icon="mdi:lock-outline"
                    width={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width={18} />
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Icon
                    icon="mdi:lock-check-outline"
                    width={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Password strength hint */}
                <p className="text-white/30 text-xs px-1">
                  Minimum 8 characters required.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !!error && !password}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Icon icon="eva:loader-outline" width={20} className="animate-spin" /> Updating…</>
                  ) : (
                    <><Icon icon="mdi:lock-reset" width={20} /> Reset Password</>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-white/50 text-sm mt-6">
                <a href="/login" className="text-red-400 font-semibold hover:text-red-300 transition-all">
                  ← Back to Login
                </a>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <Icon icon="eva:loader-outline" className="animate-spin text-white" width={48} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}