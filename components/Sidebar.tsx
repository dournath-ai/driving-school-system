"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    School,
    Users,
    BookOpen,
    Settings,
    LogOut,
    Car,
    FileText,
    History as HistoryIcon,
    Languages,
    AlertCircle
} from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface SidebarProps {
    isMobileMenuOpen?: boolean;
    onCloseMobileMenu?: () => void;
}

export default function Sidebar({ isMobileMenuOpen = false, onCloseMobileMenu }: SidebarProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const role = session?.user?.role;
    const { language, toggleLanguage, t } = useLanguage();
    const [allSeriesCompleted, setAllSeriesCompleted] = useState(false);

    // Fetch series completion status for students
    useEffect(() => {
        if (role === "STUDENT") {
            const fetchSeriesStatus = async () => {
                try {
                    const res = await fetch("/api/quiz/series");
                    const data = await res.json();
                    if (data && !data.error) {
                        setAllSeriesCompleted(data.allCompleted || false);
                    }
                } catch (error) {
                    console.error("Failed to fetch series status", error);
                }
            };
            fetchSeriesStatus();
        }
    }, [role]);

    const navigation = [
        { key: "nav.dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "INSTRUCTOR", "STUDENT"] },
        { key: "nav.quiz", name: "Quiz / Tests", href: "/dashboard/student/quiz", icon: BookOpen, roles: ["STUDENT"] },
        { key: "nav.mock", name: "Examen Blanc", href: "/dashboard/student/mock", icon: FileText, roles: ["STUDENT"], condition: () => allSeriesCompleted },
        { key: "nav.studentResults", name: "Resultats", href: "/dashboard/student/results", icon: HistoryIcon, roles: ["STUDENT"] },
        { key: "nav.schools", name: "Driving Schools", href: "/dashboard/admin/schools", icon: School, roles: ["ADMIN"] },
        { key: "nav.manageStudents", name: "Gestion Étudiants", href: "/dashboard/manager/users", icon: Users, roles: ["MANAGER"] },
        { key: "nav.manageResults", name: "Résultats", href: "/dashboard/manager/results", icon: HistoryIcon, roles: ["MANAGER"] },
        { key: "nav.users", name: "Utilisateurs", href: "/dashboard/manager/users", icon: Users, roles: ["ADMIN"] },
        { key: "nav.questions", name: "Banque de Questions", href: "/dashboard/manager/questions", icon: BookOpen, roles: ["ADMIN", "MANAGER"] },
        { key: "nav.themes", name: "Quiz par Thème", href: "/dashboard/manager/themes", icon: BookOpen, roles: ["ADMIN", "MANAGER"] },
        { key: "nav.trafficSigns", name: "Signaux Routiers", href: "/dashboard/traffic-signs", icon: AlertCircle, roles: ["ADMIN", "MANAGER", "STUDENT"] },
        { key: "nav.settings", name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["ADMIN"] },
    ];

    const filteredNavigation = navigation.filter(item => {
        if (!role || !item.roles.includes(role)) return false;
        if (item.condition && !item.condition()) return false;
        return true;
    });

    return (
        <div className="d-flex flex-column bg-white h-100 border-end" style={{ width: '280px', minHeight: '100vh' }}>
            {/* Logo Section */}
            <div className="p-4 border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary text-white p-2 rounded-3">
                        <Car size={24} />
                    </div>
                    <div className="text-nowrap">
                        <h2 className="h6 mb-0 fw-bold">{t("brand.title", "Tunisia Driving")}</h2>
                        <small className="text-muted">{t("brand.subtitle", "Admin Panel")}</small>
                    </div>
                </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-fill py-4 px-3 overflow-auto">
                <div className="d-flex align-items-center justify-content-between mb-3 px-3">
                    <div className="small text-muted text-uppercase fw-semibold" style={{ letterSpacing: '0.05em' }}>
                        {t("nav.navigation", "Navigation")}
                    </div>
                    <button
                        type="button"
                        onClick={toggleLanguage}
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                    >
                        <Languages size={16} />
                        <span>{language === "ar" ? t("action.toggleToFrench", "Français") : t("action.toggleToArabic", "العربية")}</span>
                    </button>
                </div>
                <nav className="nav flex-column gap-1">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => onCloseMobileMenu?.()}
                                className={`nav-link d-flex align-items-center gap-3 py-2 px-3 rounded-2 transition-all ${isActive
                                    ? 'bg-light text-primary fw-semibold'
                                    : 'text-secondary bg-transparent'
                                    } hover-bg-light`}
                            >
                                <Icon size={20} />
                                <span>{t(item.key, item.name)}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Profile Section */}
            <div className="p-3 border-top mt-auto">
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light">
                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center border"
                            style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                            <span className="fw-bold text-primary">{session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}</span>
                        </div>
                        <div className="overflow-hidden">
                            <div className="fw-bold text-truncate small">{session?.user?.name || "User"}</div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{session?.user?.email}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                        className="btn btn-link text-secondary p-1 hover-text-danger"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
