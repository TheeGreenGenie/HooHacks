"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Menu, Transition } from "@headlessui/react";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function AuthenticationNavigation() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div className="h-8 w-8 rounded-full animate-pulse" style={{ background: "rgba(217,119,6,0.2)" }} />;

  if (!user) {
    return (
      <Link
        href="/api/auth/login"
        className="btn-3d flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors"
        style={{ background: "rgba(146,64,14,0.5)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.35)" }}
      >
        <ArrowLeftOnRectangleIcon className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  return (
    <Menu as="div" className="relative z-50">
      <Menu.Button className="flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/50">
        <img
          className="h-8 w-8 rounded-full object-cover"
          style={{ border: "2px solid rgba(217,119,6,0.5)", boxShadow: "0 0 10px rgba(217,119,6,0.3)" }}
          src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=92400e&color=fde68a`}
          alt={user.name || "User"}
        />
      </Menu.Button>
      <Transition
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="dropdown-shadow absolute right-0 z-10 mt-2 w-52 origin-top-right rounded-xl overflow-hidden focus:outline-none"
          style={{
            background: "rgba(10, 3, 0, 0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(217,119,6,0.22)",
          }}
        >
          <div
            className="h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(217,119,6,0.5), transparent)" }}
          />
          <div className="px-4 py-2.5 text-xs truncate" style={{ color: "#7A5020", borderBottom: "1px solid rgba(217,119,6,0.08)" }}>
            {user.email}
          </div>
          <Menu.Item>
            {({ active }) => (
              <Link
                href="/settings"
                className="block px-4 py-2.5 text-sm transition-colors"
                style={{ color: active ? "#F59E0B" : "#C8A870", background: active ? "rgba(255,255,255,0.04)" : "transparent" }}
              >
                Settings
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <a
                href="/api/auth/logout"
                className="block px-4 py-2.5 text-sm transition-colors"
                style={{ color: active ? "#F87171" : "#C8A870", background: active ? "rgba(255,255,255,0.04)" : "transparent" }}
              >
                Sign out
              </a>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
