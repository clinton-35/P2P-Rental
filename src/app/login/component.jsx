"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      window.location.href = "/";
    }
  };

  const loginGoogle = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4 pt-10">
      {/* pt-24 pushes content below the fixed header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="backdrop-blur-xl bg-white/70 shadow-2xl rounded-3xl p-10 w-full max-w-md border border-gray-200"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-2">
            Welcome to
          </h1>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Image src="/logo.png" width={240} height={70} alt="PackHub Logo" />
          </motion.div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="text-red-500 text-center text-sm mb-3 animate-fadeIn">
            {errorMsg}
          </p>
        )}

        {/* Login Form */}
        <form onSubmit={handleEmailPasswordLogin} className="space-y-4 mt-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-gray-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-gray-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Login
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
          </span>.
        </p>
      </motion.div>
    </main>
  );
}
