"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

export default function LoginComponent() {
  const login = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="backdrop-blur-xl bg-white/60 shadow-xl rounded-2xl p-8 sm:p-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            Welcome to
          </h1>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Image
              src="/logo.png"
              width={240}
              height={70}
              alt="PackHub Logo"
              className="mt-3"
            />
          </motion.div>
        </div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={login}
          className="w-full flex items-center justify-center gap-x-3 py-3
                     bg-white border border-gray-300 rounded-xl
                     text-gray-700 font-medium text-sm
                     shadow-sm hover:shadow-md transition-all duration-150"
        >
          <Icon icon="devicon:google" width={20} height={20} />
          Continue with Google
        </motion.button>

        {/* Terms */}
        <p className="text-center text-gray-500 text-sm mt-5 leading-relaxed">
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
      </motion.div>
    </main>
  );
}
