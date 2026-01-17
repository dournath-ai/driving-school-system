"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Users,
    Settings,
    Car,
    UserCircle
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role;

    const getLinks = () => {
        switch (role) {
            case "STUDENT":
                return [
                    { href: "/dashboard/student", label: "Dashboard", icon: LayoutDashboard },
                    { href: "/dashboard/student/book", label: "Book Lesson", icon: BookOpen },
                    { href: "/dashboard/student/profile", label: "My Profile", icon: UserCircle },
                ];
            case "INSTRUCTOR":
                return [
                    { href: "/dashboard/instructor", label: "Dashboard", icon: LayoutDashboard },
                    { href: "/dashboard/instructor/schedule", label: "My Schedule", icon: Calendar },
                    { href: "/dashboard/instructor/vehicles", label: "Vehicles", icon: Car },
                ];
            case "ADMIN":
                return [
                    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
                    { href: "/dashboard/admin/users", label: "Users", icon: Users },
                    { href: "/dashboard/admin/vehicles", label: "Fleet", icon: Car },
                    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
                ];
            default:
                return [];
        }
    };

    const links = getLinks();

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-800">
                <h1 className="text-xl font-bold">DriveSmart</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center rounded-md px-2 py-2 text-sm font-medium ${isActive
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <Icon className="mr-3 h-6 w-6" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
