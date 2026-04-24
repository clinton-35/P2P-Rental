"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/ForgotPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSent(true);

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

          {sent ? (
            // Success State
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:email-check-outline" width={36} className="text-green-400" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">Check Your Email</h2>
              <p className="text-white/60 text-sm mb-6">
                If an account exists for <span className="text-white font-semibold">{email}</span>, 
                a password reset link has been sent. Check your inbox and spam folder.
              </p>
              <p className="text-white/40 text-xs mb-6">
                The link expires in 1 hour.
              </p>
              
               <a href="/login"
                className="text-red-400 text-sm font-semibold hover:text-red-300 transition-all"
              >
                ← Back to Login
              </a>
            </motion.div>
          ) : (
            // Form State
            <>
              <h2 className="text-white font-bold text-xl mb-1 text-center">
                Forgot Password?
              </h2>
              <p className="text-white/50 text-sm text-center mb-6">
                Enter your email and we'll send you a reset link.
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
                <div className="relative">
                  <Icon
                    icon="mdi:email-outline"
                    width={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Icon icon="eva:loader-outline" width={20} className="animate-spin" /> Sending…</>
                  ) : (
                    <><Icon icon="mdi:email-send-outline" width={20} /> Send Reset Link</>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-white/50 text-sm mt-6">
                Remember your password?{" "}
                <a href="/login" className="text-red-400 font-semibold hover:text-red-300 transition-all">
                  Back to Login
                </a>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}