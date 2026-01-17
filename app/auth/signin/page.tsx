"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { language, toggleLanguage, t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            if (result.error === "ACCOUNT_INACTIVE") {
                setError(t("auth.error.inactive", "Votre compte est inactif. Veuillez contacter votre administration."));
            } else if (result.error === "CONNECTION_LIMIT_EXCEEDED") {
                setError(t("auth.error.limit", "Votre limite de temps de connexion est atteinte."));
            } else {
                setError(t("auth.error.generic", "Email ou mot de passe invalide"));
            }
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="traffic-icon">
                        🚗
                    </div>
                    <h2>{t("brand.title", "Code de la Route Tunisien")}</h2>
                    <p className="mb-0 mt-2">{t("brand.subtitle", "Système de Gestion")}</p>
                    <button
                        type="button"
                        onClick={toggleLanguage}
                        className="btn btn-light btn-sm mt-3 d-inline-flex align-items-center gap-2"
                    >
                        <span role="img" aria-label="language">🌐</span>
                        <span>{language === "ar" ? t("action.toggleToFrench", "Français") : t("action.toggleToArabic", "العربية")}</span>
                    </button>
                </div>

                <div className="login-body">
                    {error && (
                        <div className="alert alert-danger alert-tunisia" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="form-label fw-semibold">
                                📧 {t("auth.email", "Adresse Email")}
                            </label>
                            <input
                                type="email"
                                className="form-control form-control-lg"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemple@email.com"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="form-label fw-semibold">
                                🔒 {t("auth.password", "Mot de Passe")}
                            </label>
                            <input
                                type="password"
                                className="form-control form-control-lg"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-tunisia w-100 btn-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {t("auth.loading", "Connexion...")}
                                </>
                            ) : (
                                t("auth.login", "Se Connecter")
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-muted mb-0">
                            <small>{t("auth.noAccount", "Pas encore de compte? Contactez votre administrateur")}</small>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .login-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
      `}</style>
        </div>
    );
}
