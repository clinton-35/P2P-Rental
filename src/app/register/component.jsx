"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function RegisterComponent() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  const form = new FormData(e.target);
  const name = form.get("name");
  const email = form.get("email");
  const password = form.get("password");
  const confirm = form.get("confirm");

  if (password !== confirm) {
    setError("Passwords do not match.");
    return;
  }

  const res = await fetch("/api/CreateUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    setError(data.error); // <-- changed from data.message
    return;
  }

  setSuccess("Account created successfully! Redirecting...");
  setTimeout(() => (window.location.href = "/login"), 1500);
};


  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="backdrop-blur-xl bg-white/60 shadow-xl rounded-2xl p-8 sm:p-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            Create Account
          </h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src="/logo.png"
              width={200}
              height={60}
              alt="PackHub Logo"
              className="mt-3"
            />
          </motion.div>
        </div>

        {error && (
          <p className="text-red-600 text-center mb-3 text-sm">{error}</p>
        )}

        {success && (
          <p className="text-green-700 text-center mb-3 text-sm">{success}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Confirm Password */}
          <input
            type="password"
            name="confirm"
            placeholder="Confirm Password"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
          >
            Create Account
          </motion.button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </motion.div>
    </main>
  );
}
