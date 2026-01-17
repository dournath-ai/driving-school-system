"use client";

import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <div className="flex h-16 items-center justify-between bg-white px-4 shadow-sm border-b border-gray-200">
            <div className="flex items-center">
                {/* Placeholder for breadcrumbs or page title */}
                <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    Welcome, <span className="font-semibold">{session?.user?.name || "User"}</span>
                </span>
                <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
