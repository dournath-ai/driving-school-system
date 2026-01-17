"use client";

import { useState, useEffect } from "react";

type Settings = {
    questionsPerQuiz: number;
    quizTimeLimit: number;
    questionTimeLimit: number;
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        questionsPerQuiz: 30,
        quizTimeLimit: 900,
        questionTimeLimit: 30
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            if (data) {
                setSettings({
                    questionsPerQuiz: data.questionsPerQuiz || 30,
                    quizTimeLimit: data.quizTimeLimit || 900,
                    questionTimeLimit: data.questionTimeLimit || 30
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setMessage("✅ Paramètres enregistrés avec succès!");
            } else {
                setMessage("❌ Erreur lors de l'enregistrement");
            }
        } catch (error) {
            setMessage("❌ Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid py-4">
                <div className="text-center py-5">
                    <div className="loader mx-auto"></div>
                    <p className="text-muted mt-3">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col-12">
                    <div className="dashboard-card p-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="traffic-icon">
                                ⚙️
                            </div>
                            <div>
                                <h1 className="h3 mb-1">Configuration</h1>
                                <p className="text-muted mb-0">
                                    Paramètres globaux du système de quiz et examens
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-8 mx-auto">
                    <div className="dashboard-card p-4">
                        <h3 className="h5 mb-4">📋 Paramètres Globaux des Quiz</h3>
                        <p className="text-muted mb-4">
                            Configurez les paramètres par défaut pour tous les quiz et examens sur la plateforme.
                        </p>

                        {message && (
                            <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-tunisia mb-4`}>
                                {message}
                            </div>
                        )}

                        {/* Questions Per Quiz */}
                        <div className="mb-4">
                            <label htmlFor="questionsPerQuiz" className="form-label fw-semibold">
                                📝 Questions par Quiz
                            </label>
                            <input
                                type="number"
                                className="form-control form-control-lg"
                                id="questionsPerQuiz"
                                value={settings.questionsPerQuiz}
                                onChange={(e) => setSettings({ ...settings, questionsPerQuiz: parseInt(e.target.value) || 30 })}
                                min={5}
                                max={100}
                            />
                            <small className="text-muted">
                                Nombre de questions dans chaque quiz (5-100)
                            </small>
                        </div>

                        {/* Quiz Duration */}
                        <div className="mb-4">
                            <label htmlFor="quizTimeLimit" className="form-label fw-semibold">
                                ⏱️ Durée du Quiz (secondes)
                            </label>
                            <input
                                type="number"
                                className="form-control form-control-lg"
                                id="quizTimeLimit"
                                value={settings.quizTimeLimit}
                                onChange={(e) => setSettings({ ...settings, quizTimeLimit: parseInt(e.target.value) || 900 })}
                                min={60}
                                max={7200}
                            />
                            <small className="text-muted">
                                Temps total alloué pour le quiz en secondes (par défaut: 900 = 15 minutes)
                            </small>
                            <div className="mt-2">
                                <span className="badge bg-secondary">
                                    {Math.floor(settings.quizTimeLimit / 60)} minutes {settings.quizTimeLimit % 60} secondes
                                </span>
                            </div>
                        </div>

                        {/* Question Time Limit */}
                        <div className="mb-4">
                            <label htmlFor="questionTimeLimit" className="form-label fw-semibold">
                                ⏰ Limite de Temps par Question (secondes)
                            </label>
                            <input
                                type="number"
                                className="form-control form-control-lg"
                                id="questionTimeLimit"
                                value={settings.questionTimeLimit}
                                onChange={(e) => setSettings({ ...settings, questionTimeLimit: parseInt(e.target.value) || 30 })}
                                min={10}
                                max={120}
                            />
                            <small className="text-muted">
                                Temps maximum par question pour les examens simulés (10-120 secondes)
                            </small>
                        </div>

                        <div className="alert alert-info alert-tunisia">
                            <h6 className="alert-heading">ℹ️ Information</h6>
                            <ul className="mb-0 small">
                                <li>Ces paramètres s'appliquent à tous les nouveaux quiz créés</li>
                                <li>Les quiz en cours ne sont pas affectés par ces modifications</li>
                                <li>Seuls les administrateurs peuvent modifier ces paramètres</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-tunisia btn-lg w-100"
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Enregistrement...
                                </>
                            ) : (
                                "💾 Enregistrer les Paramètres"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
