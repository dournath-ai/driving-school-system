"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';

import { History, Trophy, TrendingUp, Calendar, Clock, CheckCircle2, XCircle, BarChart3, Eye, FileText } from "lucide-react";
import { Card, Badge, Spinner, Alert, Row, Col, ProgressBar, Modal, Button } from "react-bootstrap";
import QuizResultView from "@/components/quiz/QuizResultView";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

type Attempt = {
    id: string;
    score: number;
    totalQuestions: number;
    passed: boolean;
    startTime: string;
    endTime: string | null;
};

export default function ResultsPage() {
    const { t } = useLanguage();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);

    // Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAttemptDetails, setSelectedAttemptDetails] = useState<any | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await fetch("/api/quiz/results");
            const data = await res.json();
            setAttempts(data);
        } catch (error) {
            console.error("Failed to fetch results", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttemptDetails = async (attemptId: string) => {
        setLoadingDetails(true);
        setShowDetailModal(true);
        setSelectedAttemptDetails(null);
        try {
            const res = await fetch(`/api/quiz/results/${attemptId}`);
            const data = await res.json();
            if (res.ok) {
                setSelectedAttemptDetails(data);
            } else {
                console.error(data.error);
            }
        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const passedCount = attempts.filter(a => a.passed).length;
    const totalAttempts = attempts.length;
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => Math.round((a.score / a.totalQuestions) * 100))) : 0;
    const averageScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
        : 0;

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                                    <BarChart3 size={28} className="text-primary" />
                                </div>
                                <div>
                                    <h1 className="h3 mb-1 fw-bold">{t("results.title", "Mes Résultats")}</h1>
                                    <p className="text-muted mb-0">{t("results.subtitle", "Historique de vos tentatives d'examen du code de la route")}</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="danger" />
                    <p className="mt-3 text-muted">{t("results.loading", "Chargement des résultats...")}</p>
                </div>
            ) : attempts.length === 0 ? (
                <Row>
                    <Col lg={8} className="mx-auto">
                        <Card className="border-0 shadow-sm rounded-4">
                            <Card.Body className="p-5 text-center">
                                <div className="bg-light p-4 rounded-circle d-inline-block mb-3">
                                    <History size={48} className="text-muted" />
                                </div>
                                <h3 className="h5 mb-3">{t("results.empty", "Aucun résultat pour le moment")}</h3>
                                <p className="text-muted mb-4">
                                    {t("results.emptyDesc", "Vous n'avez pas encore passé de test. Commencez votre premier examen pour voir vos résultats ici!")}
                                </p>
                                <Link href="/dashboard/student/quiz" className="btn btn-tunisia px-4 py-2">
                                    🚀 {t("results.firstTest", "Passer mon Premier Test")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <>
                    {/* Stats Cards */}
                    <Row className="g-4 mb-4">
                        <Col xs={12} md={3}>
                            <Card className="border-0 shadow-sm rounded-4 stat-card">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <div className="small text-muted mb-1">{t("results.totalAttempts", "Total Tentatives")}</div>
                                            <div className="h3 fw-bold mb-0">{totalAttempts}</div>
                                            <div className="small text-muted">{t("results.examsPassed", "examens passés")}</div>
                                        </div>
                                        <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                                            <History size={24} className="text-primary" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={3}>
                            <Card className="border-0 shadow-sm rounded-4 stat-card">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <div className="small text-muted mb-1">{t("results.passedCount", "Réussis")}</div>
                                            <div className="h3 fw-bold text-success mb-0">{passedCount}</div>
                                            <div className="small text-muted">{t("results.withSuccess", "avec succès")}</div>
                                        </div>
                                        <div className="bg-success bg-opacity-10 p-2 rounded-3">
                                            <CheckCircle2 size={24} className="text-success" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={3}>
                            <Card className="border-0 shadow-sm rounded-4 stat-card">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <div className="small text-muted mb-1">{t("results.bestScore", "Meilleur Score")}</div>
                                            <div className="h3 fw-bold mb-0">{bestScore}%</div>
                                            <div className="small text-muted">{t("results.yourRecord", "votre record")}</div>
                                        </div>
                                        <div className="bg-warning bg-opacity-10 p-2 rounded-3">
                                            <Trophy size={24} className="text-warning" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={3}>
                            <Card className="border-0 shadow-sm rounded-4 stat-card">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <div className="small text-muted mb-1">Moyenne</div>
                                            <div className="h3 fw-bold mb-0">{averageScore}%</div>
                                            <div className="small text-muted">Score moyen</div>
                                        </div>
                                        <div className="bg-info bg-opacity-10 p-2 rounded-3">
                                            <TrendingUp size={24} className="text-info" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Results List */}
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Header className="bg-white border-0 p-4">
                            <h5 className="mb-0 fw-bold">{t("results.title", "Mes Résultats")}</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4 py-3">{t("results.dateTime", "Date & Heure")}</th>
                                            <th className="text-center py-3">{t("results.score", "Score")}</th>
                                            <th className="text-center py-3">{t("results.percentage", "Pourcentage")}</th>
                                            <th className="text-center py-3">{t("results.result", "Résultat")}</th>
                                            <th className="text-end pe-4 py-3">{t("common.actions", "Actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attempts.map((attempt) => {
                                            const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);

                                            return (
                                                <tr key={attempt.id} className="result-row">
                                                    <td className="ps-4 py-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                                                                <Calendar size={16} className="text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="fw-semibold">
                                                                    {format(new Date(attempt.startTime), "d MMMM yyyy", { locale: fr })}
                                                                </div>
                                                                <div className="small text-muted d-flex align-items-center gap-1">
                                                                    <Clock size={12} />
                                                                    {format(new Date(attempt.startTime), "HH:mm")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-3">
                                                        <div className="fw-bold fs-5">{attempt.score}/{attempt.totalQuestions}</div>
                                                    </td>
                                                    <td className="text-center py-3">
                                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                                            <ProgressBar
                                                                now={percentage}
                                                                variant={percentage >= 80 ? "success" : "danger"}
                                                                className="flex-grow-1"
                                                                style={{ maxWidth: "150px", height: "8px" }}
                                                            />
                                                            <span className="fw-bold">{percentage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-3">
                                                        {attempt.passed ? (
                                                            <Badge bg="success" className="px-3 py-2 d-inline-flex align-items-center gap-1">
                                                                <CheckCircle2 size={14} />
                                                                {t("results.passed", "✅ Réussi")}
                                                            </Badge>
                                                        ) : (
                                                            <Badge bg="danger" className="px-3 py-2 d-inline-flex align-items-center gap-1">
                                                                <XCircle size={14} />
                                                                {t("results.failed", "❌ Échoué")}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="text-end pe-4 py-3">
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="rounded-circle p-2"
                                                            onClick={() => fetchAttemptDetails(attempt.id)}
                                                        >
                                                            <Eye size={18} className="text-secondary" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Detail Modal */}
                    <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="xl" centered scrollable>
                        <Modal.Header closeButton className="bg-light">
                            <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                                <FileText size={20} className="text-primary" />
                                {t("quiz.review", "Détail du Résultat")}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="p-0">
                            {loadingDetails ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-3 text-muted">{t("common.loading", "Chargement...")}</p>
                                </div>
                            ) : selectedAttemptDetails ? (
                                <div className="p-3">
                                    <QuizResultView
                                        result={selectedAttemptDetails}
                                        onBack={() => setShowDetailModal(false)}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    {t("common.error", "Erreur lors du chargement")}
                                </div>
                            )}
                        </Modal.Body>
                    </Modal>
                </>
            )}
        </div>
    );
}
