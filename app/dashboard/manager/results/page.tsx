"use client";

import { useState, useEffect } from "react";

import { History as HistoryIcon, Search, User, Filter, CheckCircle2, XCircle, Clock, Calendar, TrendingUp, BarChart3, Eye, FileText } from "lucide-react";
import { Card, Table, Form, InputGroup, Badge, Spinner, Alert, Row, Col, ProgressBar, Modal, Button } from "react-bootstrap";
import QuizResultView from "@/components/quiz/QuizResultView";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/LanguageProvider";

interface QuizAttempt {
    id: string;
    userId: string;
    score: number;
    totalQuestions: number;
    passed: boolean;
    startTime: string;
    user: {
        name: string;
        email: string;
    };
}

export default function ManagerResultsPage() {
    const { data: session } = useSession();
    const { t } = useLanguage();
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

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
            if (res.ok) {
                const data = await res.json();
                setAttempts(data);
            }
        } catch (error) {
            console.error("Error fetching results:", error);
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

    const filteredAttempts = attempts.filter(attempt => {
        const matchesSearch =
            attempt.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            attempt.user.email?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === "ALL" ||
            (filter === "PASSED" && attempt.passed) ||
            (filter === "FAILED" && !attempt.passed);

        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: filteredAttempts.length,
        passed: filteredAttempts.filter(a => a.passed).length,
        failed: filteredAttempts.filter(a => !a.passed).length,
        averageScore: filteredAttempts.length > 0
            ? Math.round(filteredAttempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / filteredAttempts.length)
            : 0
    };

    return (
        <div className="p-4 bg-light min-vh-100">
            {/* Header */}
            <div className="mb-4">
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-danger bg-opacity-10 p-3 rounded-4">
                                <BarChart3 size={28} className="text-danger" />
                            </div>
                            <div>
                                <h1 className="h3 mb-1 fw-bold">{t("managerResults.title", "Résultats des Étudiants")}</h1>
                                <p className="text-muted mb-0">{t("managerResults.subtitle", "Consultez les scores et la progression de vos élèves.")}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm rounded-4 stat-card">
                        <Card.Body className="p-3">
                            <div className="text-center">
                                <div className="small text-muted mb-1">Total</div>
                                <div className="h4 fw-bold mb-0">{stats.total}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm rounded-4 stat-card border-success">
                        <Card.Body className="p-3">
                            <div className="text-center">
                                <div className="small text-muted mb-1">{t("managerResults.passed", "Réussis")}</div>
                                <div className="h4 fw-bold text-success mb-0">{stats.passed}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm rounded-4 stat-card border-danger">
                        <Card.Body className="p-3">
                            <div className="text-center">
                                <div className="small text-muted mb-1">{t("managerResults.failed", "Échecs")}</div>
                                <div className="h4 fw-bold text-danger mb-0">{stats.failed}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm rounded-4 stat-card border-info">
                        <Card.Body className="p-3">
                            <div className="text-center">
                                <div className="small text-muted mb-1">Moyenne</div>
                                <div className="h4 fw-bold text-info mb-0">{stats.averageScore}%</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Search and Filter */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0">
                                    <Search size={18} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder={t("managerResults.search", "Rechercher un étudiant...")}
                                    className="border-start-0 shadow-none"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={6} className="text-md-end">
                            <Form.Select
                                className="border shadow-sm"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="ALL">{t("managerResults.all", "Tous les résultats")}</option>
                                <option value="PASSED">{t("managerResults.passed", "Réussis")}</option>
                                <option value="FAILED">{t("managerResults.failed", "Échecs")}</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Results Table */}
            <Card className="border-0 shadow-sm rounded-4">
                <Card.Header className="bg-white border-0 p-4">
                    <h5 className="mb-0 fw-bold">{t("managerResults.title", "Résultats des Étudiants")}</h5>
                </Card.Header>
                {loading ? (
                    <Card.Body className="text-center py-5">
                        <Spinner animation="border" variant="danger" />
                        <p className="mt-2 text-muted">{t("managerResults.loading", "Chargement des résultats...")}</p>
                    </Card.Body>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="table-responsive d-none d-md-block">
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4 py-3">{t("managerResults.student", "Étudiant")}</th>
                                        <th className="py-3">{t("managerResults.score", "Score")}</th>
                                        <th className="py-3">{t("managerResults.status", "Statut")}</th>
                                        <th className="py-3">{t("managerResults.date", "Date")}</th>
                                        <th className="text-end pe-4 py-3">{t("common.actions", "Actions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttempts.map((attempt) => {
                                        const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                                        return (
                                            <tr key={attempt.id} className="result-row">
                                                <td className="ps-4 py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                                                            <User size={18} className="text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">{attempt.user.name || t("managerResults.student", "Étudiant")}</div>
                                                            <div className="small text-muted">{attempt.user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="fw-bold">{attempt.score} / {attempt.totalQuestions}</div>
                                                    <ProgressBar
                                                        now={percentage}
                                                        variant={attempt.passed ? "success" : "danger"}
                                                        className="mt-1"
                                                        style={{ height: "6px", width: "80px" }}
                                                    />
                                                </td>
                                                <td className="py-3">
                                                    {attempt.passed ? (
                                                        <Badge bg="success" className="bg-opacity-10 text-success border-success border d-inline-flex align-items-center gap-1 px-3 py-2">
                                                            <CheckCircle2 size={12} /> {t("managerResults.passed", "Réussi")}
                                                        </Badge>
                                                    ) : (
                                                        <Badge bg="danger" className="bg-opacity-10 text-danger border-danger border d-inline-flex align-items-center gap-1 px-3 py-2">
                                                            <XCircle size={12} /> {t("managerResults.failed", "Échec")}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    <div className="d-flex align-items-center gap-1 text-muted small">
                                                        <Calendar size={14} />
                                                        {new Date(attempt.startTime).toLocaleDateString()}
                                                    </div>
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
                                    {filteredAttempts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5 text-muted">
                                                {t("managerResults.notFound", "Aucun résultat trouvé.")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="d-md-none p-3">
                            {filteredAttempts.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    {t("managerResults.notFound", "Aucun résultat trouvé.")}
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {filteredAttempts.map((attempt) => {
                                        const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                                        return (
                                            <Card key={attempt.id} className="border shadow-sm">
                                                <Card.Body className="p-3">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                                                                <User size={16} className="text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold small">{attempt.user.name || t("managerResults.student", "Étudiant")}</div>
                                                                <div className="text-muted" style={{ fontSize: "0.75rem" }}>{attempt.user.email}</div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="rounded-circle p-2"
                                                            onClick={() => fetchAttemptDetails(attempt.id)}
                                                        >
                                                            <Eye size={16} className="text-secondary" />
                                                        </Button>
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <div>
                                                            <div className="text-muted small">{t("managerResults.score", "Score")}</div>
                                                            <div className="fw-bold">{attempt.score} / {attempt.totalQuestions}</div>
                                                        </div>
                                                        <div>
                                                            {attempt.passed ? (
                                                                <Badge bg="success" className="px-2 py-1">
                                                                    <CheckCircle2 size={10} className="me-1" />
                                                                    {t("managerResults.passed", "Réussi")}
                                                                </Badge>
                                                            ) : (
                                                                <Badge bg="danger" className="px-2 py-1">
                                                                    <XCircle size={10} className="me-1" />
                                                                    {t("managerResults.failed", "Échec")}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <ProgressBar
                                                        now={percentage}
                                                        variant={attempt.passed ? "success" : "danger"}
                                                        className="mb-2"
                                                        style={{ height: "6px" }}
                                                    />

                                                    <div className="d-flex align-items-center gap-1 text-muted small">
                                                        <Calendar size={12} />
                                                        {new Date(attempt.startTime).toLocaleDateString()} {new Date(attempt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
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
        </div>
    );
}
