"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { signIn } from "next-auth/react";

export default function LoginComponent() {
  const login = async () => {
    await signIn("google", {
      callbackUrl: "/",
    });
  }

  return (
   <main className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
  <div className="bg-white shadow-lg rounded-xl p-8 sm:p-10 w-full max-w-md mx-auto">
    {/* Header */}
    <div className="flex flex-col items-center mb-6">
      <h1 className="text-3xl font-extrabold text-gray-800">Welcome to</h1>
      <Image
        src="/logo.png"
        width={250}
        height={80}
        alt="PackHub Logo"
        className="mt-2"
      />
    </div>

    {/* Login Button */}
    <div className="mt-8">
      <button
        className="w-full flex items-center justify-center gap-x-3 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-100 hover:shadow-md transition-all duration-150 active:bg-gray-200"
        onClick={login}
      >
        <Icon icon="devicon:google" width={20} height={20} />
        Continue with Google
      </button>
    </div>

    {/* Optional Info */}
    <p className="text-center text-gray-500 text-sm mt-4">
      By continuing, you agree to PackHub&apos;s 
      <span className="text-blue-500 hover:underline cursor-pointer"> Terms & Conditions</span> 
      and <span className="text-blue-500 hover:underline cursor-pointer">Privacy Policy</span>.
    </p>
  </div>
</main>

  );
}