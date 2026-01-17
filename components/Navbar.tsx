"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <nav className="tunisia-header">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center">
          <Link href="/dashboard" className="text-decoration-none text-white d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.5rem' }}>🚗</span>
            <h1 className="h4 mb-0 fw-bold">{t("brand.title", "Code de la Route Tunisien")}</h1>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {session?.user ? (
              <div className="dropdown">
                <button
                  className="btn btn-light dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '35px', height: '35px' }}>
                    <span className="fw-bold">{session.user.name?.[0] || "U"}</span>
                  </div>
                  <span className="d-none d-md-inline">{session.user.name || session.user.email}</span>
                </button>

                {isMenuOpen && (
                  <div className="dropdown-menu dropdown-menu-end show" style={{ right: 0 }}>
                    <div className="dropdown-header">
                      <div className="fw-semibold">{session.user.name}</div>
                      <small className="text-muted">{session.user.email}</small>
                      <div>
                        <span className="badge bg-danger mt-1">
                          {session.user.role === 'STUDENT' && t("role.student", "Étudiant")}
                          {session.user.role === 'INSTRUCTOR' && t("role.instructor", "Instructeur")}
                          {session.user.role === 'MANAGER' && t("role.manager", "Gestionnaire")}
                          {session.user.role === 'ADMIN' && t("role.admin", "Administrateur")}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button
                      onClick={toggleLanguage}
                      className="dropdown-item d-flex align-items-center gap-2"
                    >
                      <span>🌐</span>
                      <span>{language === "ar" ? t("action.toggleToFrench", "Français") : t("action.toggleToArabic", "العربية")}</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button
                      onClick={() => signOut()}
                      className="dropdown-item text-danger d-flex align-items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>{t("nav.logout", "Déconnexion")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/api/auth/signin" className="btn btn-light">
                {t("action.signIn", "Se Connecter")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
