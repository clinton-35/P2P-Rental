"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";

export default function Header() {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setStatus("authenticated");
        setUser(session.user);
        setVerified(session.user.verified ?? "unverified");
      } else {
        setStatus("unauthenticated");
      }
    });
  }, []);

  const navigation = [
    { title: "Home", path: "/", icon: "ic:baseline-home" },
    { title: "About Us", path: "/about", icon: "ic:baseline-info" },
    { title: "FAQ", path: "/faq", icon: "ic:baseline-question-answer" },
  ];

  const bannerConfig = {
    unverified: {
      bg: "bg-red-50 border-red-200",
      icon: "mdi:shield-alert-outline",
      iconColor: "text-red-500",
      text: "Your account is not verified. You cannot book items or post listings.",
      action: { label: "Verify Now", href: "/verify" },
      actionStyle: "bg-red-500 hover:bg-red-600 text-white",
    },
    pending: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: "mdi:clock-outline",
      iconColor: "text-yellow-600",
      text: "Your verification is under review. We'll notify you once approved.",
      action: null,
    },
    rejected: {
      bg: "bg-red-50 border-red-200",
      icon: "mdi:shield-remove-outline",
      iconColor: "text-red-500",
      text: "Your verification was rejected. Please resubmit with a valid document.",
      action: { label: "Resubmit", href: "/verify" },
      actionStyle: "bg-red-500 hover:bg-red-600 text-white",
    },
  };

  const banner = status === "authenticated" ? bannerConfig[verified] : null;

  return (
    <>
      {/* Fixed Navbar */}
      <div className="shadow fixed top-0 left-0 right-0 z-[100] bg-base-100">
        <div className="navbar max-w-screen-xl mx-auto">
          {/* Navbar Start */}
          <div className="navbar-start">
            <div className="dropdown dropdown-hover">
              <label tabIndex={0} className="btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </label>
              <ul tabIndex={0} className="dropdown-content font-medium z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-48">
                {navigation.map((item, index) => (
                  <li key={index}>
                    <Link href={item.path} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md">
                      <Icon icon={item.icon} width={25} height={25} />
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navbar Center */}
          <div className="navbar-center cursor-pointer">
            <Link href="/">
              <Image src="/logo.png" width={250} height={80} alt="Park Hub" />
            </Link>
          </div>

          {/* Navbar End */}
          <div className="navbar-end">
            <div className="dropdown dropdown-hover dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-circle">
                {status === "authenticated" && (
                  <div className="relative">
                    <Image
                      src={user.image}
                      width={35}
                      height={35}
                      alt={user.name}
                      className="rounded-full shadow-md"
                    />
                    {/* Verification status dot */}
                    {verified === "verified" && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                    {verified === "pending" && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full" />
                    )}
                    {(verified === "unverified" || verified === "rejected") && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                )}
                {status === "loading" && (
                  <Icon icon="la:spinner" className="animate-spin" width={30} height={30} />
                )}
                {status === "unauthenticated" && (
                  <Icon icon="teenyicons:user-circle-solid" width={35} height={35} />
                )}
              </button>
              <ul tabIndex={0} className="dropdown-content font-medium z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-48">
                {status === "authenticated" && (
                  <>
                    <li>
                      <Link href="/lists" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md">
                        <Image
                          src={user.image}
                          width={25}
                          height={25}
                          alt={user.name}
                          className="rounded-full shadow-md"
                          onError={(e) => { e.target.onerror = null; e.target.src = "/next.svg"; }}
                        />
                        My Listings
                      </Link>
                    </li>
                    <li>
                      <Link href="/inbox" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md">
                        <Icon icon="ic:baseline-chat" width={25} height={25} />
                        Inbox
                      </Link>
                    </li>
                    <li>
                      <Link href="/bookings" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md">
                        <Icon icon="mdi:calendar-check-outline" width={25} height={25} />
                        Bookings
                      </Link>
                    </li>
                    <li>
                      <Link href="/create" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md">
                        <Icon icon="gala:add" width={25} height={25} />
                        Post Ad
                      </Link>
                    </li>
                    {/* Verify link — only for unverified/rejected */}
                    {(verified === "unverified" || verified === "rejected") && (
                      <li>
                        <Link href="/verify" className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-500 rounded-md">
                          <Icon icon="mdi:shield-alert-outline" width={25} height={25} />
                          Verify Account
                        </Link>
                      </li>
                    )}
                    <li>
                      <p onClick={() => signOut()} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer">
                        <Icon icon="material-symbols:logout-rounded" width={25} height={25} />
                        Logout
                      </p>
                    </li>
                  </>
                )}

                {status === "loading" && (
                  <li className="flex items-center gap-2 px-3 py-2">
                    <Icon icon="la:spinner" className="animate-spin" width={25} height={25} />
                    Loading
                  </li>
                )}

                {status === "unauthenticated" && (
                  <>
                    <li>
                      <Link href="/login" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
                        <Icon icon="mdi:login-variant" width={25} height={25} />
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link href="/register" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-600 transition">
                        <Icon icon="mdi:account-plus" width={25} height={25} />
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Verification Banner */}
        {banner && (
          <div className={`border-t ${banner.bg} px-4 py-2`}>
            <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Icon icon={banner.icon} width={18} className={banner.iconColor} />
                <p className="text-sm text-gray-700">{banner.text}</p>
              </div>
              {banner.action && (
                <Link
                  href={banner.action.href}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-xl transition-all ${banner.actionStyle}`}
                >
                  {banner.action.label}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-10"></div>
    </>
  );
}