"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Icon } from "@iconify/react";

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

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

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
      setError(data.error);
      return;
    }

    setSuccess("Account created successfully! Redirecting...");
    setTimeout(() => (window.location.href = "/login"), 1500);
  };

  const loginGoogle = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="backdrop-blur-xl bg-white/70 shadow-2xl rounded-3xl p-10 w-full max-w-md border border-gray-200"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-2">
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

        {/* Error/Success */}
        {error && (
          <p className="text-red-600 text-center mb-3 text-sm animate-fadeIn">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-700 text-center mb-3 text-sm animate-fadeIn">
            {success}
          </p>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <p className="text-xs text-gray-400 -mt-2">
            At least 8 characters with letters and numbers
          </p>

          <input
            type="password"
            name="confirm"
            placeholder="Confirm Password"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Create Account
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-500 text-sm">or</span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* Google Login */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={loginGoogle}
          className="w-full flex items-center justify-center gap-3 py-3
                     bg-white border border-gray-300 rounded-xl
                     text-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-150"
        >
          <Icon icon="mdi:google" width={22} height={22} />
          Continue with Google
        </motion.button>

        {/* Terms */}
        <p className="text-center text-gray-500 text-sm mt-6 leading-relaxed">
          By continuing, you agree to PackHub&apos;s{" "}
          <span className="text-blue-600 hover:underline cursor-pointer">
            Terms & Conditions
          </span>{" "}
          and{" "}
          <span className="text-blue-600 hover:underline cursor-pointer">
            Privacy Policy
          </span>
          .
        </p>

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
