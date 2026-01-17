"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    School,
    Users,
    BookOpen,
    Plus,
    ArrowRight,
    Clock,
    Activity,
    Search,
    Sun,
    FileText,
    History
} from "lucide-react";
import { Card, Button, Badge, Spinner, Row, Col } from "react-bootstrap";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const { t } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role === "ADMIN") {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/stats");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (!session) {
        redirect("/auth/signin");
    }

    const userRole = session?.user?.role;

    if (userRole === "STUDENT") {
        return (
            <div className="p-4 bg-light min-vh-100">
                <header className="mb-5">
                    <h1 className="h3 fw-bold">{t("dashboard.student.title")}</h1>
                    <p className="text-muted">{t("dashboard.student.welcome").replace("{name}", session?.user?.name || "")}</p>
                </header>

                <Row className="g-4 mb-5">
                    <Col md={6}>
                        <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                            <Card.Body className="d-flex flex-column align-items-center text-center">
                                <div className="text-danger mb-3 p-3 bg-danger bg-opacity-10 rounded-4">
                                    <BookOpen size={40} />
                                </div>
                                <h4 className="fw-bold mb-2">{t("dashboard.student.training")}</h4>
                                <p className="text-muted small mb-4">{t("dashboard.student.trainingDesc")}</p>
                                <Link href="/dashboard/student/quiz" className="btn btn-tunisia w-100 py-2">
                                    {t("dashboard.student.startTest")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                            <Card.Body className="d-flex flex-column align-items-center text-center">
                                <div className="text-primary mb-3 p-3 bg-primary bg-opacity-10 rounded-4">
                                    <FileText size={40} />
                                </div>
                                <h4 className="fw-bold mb-2">{t("dashboard.student.mockExam")}</h4>
                                <p className="text-muted small mb-4">{t("dashboard.student.mockDesc")}</p>
                                <Link href="/dashboard/student/mock" className="btn btn-outline-primary w-100 py-2">
                                    {t("dashboard.student.launchExam")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className="dashboard-card p-4 bg-white rounded-4 border-0 shadow-sm">
                    <h3 className="h5 fw-bold mb-4">{t("dashboard.student.recentActivity")}</h3>
                    <div className="text-center py-4 text-muted">
                        <Activity size={32} className="opacity-25 mb-2" />
                        <p className="small mb-0">{t("dashboard.student.noActivity")}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (userRole === "MANAGER") {
        return (
            <div className="p-4 bg-light min-vh-100">
                <header className="mb-5">
                    <h1 className="h3 fw-bold">{t("dashboard.manager.title")}</h1>
                    <p className="text-muted">{t("dashboard.manager.welcome").replace("{name}", session?.user?.name || "")}</p>
                </header>

                <Row className="g-4 mb-5">
                    <Col md={4}>
                        <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                            <Card.Body className="text-center">
                                <div className="text-primary mb-3 bg-primary bg-opacity-10 p-3 rounded-4 d-inline-block">
                                    <Users size={32} />
                                </div>
                                <h5 className="fw-bold mb-2">{t("dashboard.manager.myStudents")}</h5>
                                <p className="text-muted small mb-3">{t("dashboard.manager.studentsDesc")}</p>
                                <Link href="/dashboard/manager/users" className="btn btn-outline-primary w-100">
                                    {t("dashboard.manager.manageStudents")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                            <Card.Body className="text-center">
                                <div className="text-danger mb-3 bg-danger bg-opacity-10 p-3 rounded-4 d-inline-block">
                                    <History size={32} />
                                </div>
                                <h5 className="fw-bold mb-2">{t("dashboard.manager.quizResults")}</h5>
                                <p className="text-muted small mb-3">{t("dashboard.manager.resultsDesc")}</p>
                                <Link href="/dashboard/manager/results" className="btn btn-outline-danger w-100">
                                    {t("dashboard.manager.viewResults")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                            <Card.Body className="text-center">
                                <div className="text-success mb-3 bg-success bg-opacity-10 p-3 rounded-4 d-inline-block">
                                    <BookOpen size={32} />
                                </div>
                                <h5 className="fw-bold mb-2">{t("dashboard.manager.questionBank")}</h5>
                                <p className="text-muted small mb-3">{t("dashboard.manager.questionsDesc")}</p>
                                <Link href="/dashboard/manager/questions" className="btn btn-outline-success w-100">
                                    {t("dashboard.manager.questionBank")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className="dashboard-card p-4 bg-white rounded-4 border-0 shadow-sm">
                    <h3 className="h5 fw-bold mb-4">{t("dashboard.manager.systemInfo")}</h3>
                    <div className="row">
                        <div className="col-md-6">
                            <Link href="/dashboard/settings" className="btn btn-light w-100 text-start d-flex align-items-center justify-content-between p-3 rounded-3">
                                <span>{t("dashboard.manager.appSettings")}</span>
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (userRole !== "ADMIN") {
        // Fallback for INSTRUCTOR
        return (
            <div className="p-4 bg-light min-vh-100">
                <h1 className="h3 fw-bold">{t("dashboard.admin.title")} {userRole}</h1>
                <p>{t("dashboard.manager.welcome").replace("{name}", session?.user?.name || "")}</p>
                <div className="alert alert-info">{t("common.loading")}</div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-light min-vh-100">
            {/* Header */}
            <header className="d-flex justify-content-between align-items-center mb-5">
                <div className="d-flex align-items-center gap-2">
                    <div className="bg-white p-2 rounded-3 border">
                        <LayoutDashboard size={20} className="text-secondary" />
                    </div>
                    <h1 className="h4 mb-0 fw-bold">{t("dashboard.admin.title")}</h1>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-white bg-white border p-2 rounded-circle shadow-sm">
                        <Sun size={20} className="text-secondary" />
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <Row className="g-4 mb-5">
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <small className="text-muted fw-semibold d-block mb-1">{t("dashboard.admin.drivingSchools")}</small>
                                    <h2 className="display-6 fw-bold mb-0">{stats?.stats?.schools || 0}</h2>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                                    <School size={20} className="text-primary" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <small className="text-muted fw-semibold d-block mb-1">{t("dashboard.admin.managers")}</small>
                                    <h2 className="display-6 fw-bold mb-0">{stats?.stats?.managers || 0}</h2>
                                </div>
                                <div className="bg-info bg-opacity-10 p-2 rounded-3">
                                    <Users size={20} className="text-info" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <small className="text-muted fw-semibold d-block mb-1">{t("dashboard.admin.students")}</small>
                                    <h2 className="display-6 fw-bold mb-0">{stats?.stats?.students || 0}</h2>
                                </div>
                                <div className="bg-success bg-opacity-10 p-2 rounded-3">
                                    <Users size={20} className="text-success" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm p-4 rounded-4 h-100 stat-card">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <small className="text-muted fw-semibold d-block mb-1">{t("dashboard.admin.questions")}</small>
                                    <h2 className="display-6 fw-bold mb-0">{stats?.stats?.questions || 0}</h2>
                                </div>
                                <div className="bg-danger bg-opacity-10 p-2 rounded-3">
                                    <BookOpen size={20} className="text-danger" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Quick Actions */}
            <div className="mb-5">
                <h3 className="h5 fw-bold mb-4">{t("dashboard.admin.quickActions")}</h3>
                <Row className="g-4">
                    <Col md={4}>
                        <Card className="border-0 shadow-sm p-4 rounded-4 text-center h-100 stat-card">
                            <Card.Body className="d-flex flex-column align-items-center">
                                <div className="bg-primary bg-opacity-10 p-3 rounded-4 mb-3">
                                    <School size={32} className="text-primary" />
                                </div>
                                <h4 className="h6 fw-bold mb-2">{t("dashboard.admin.addSchool")}</h4>
                                <p className="text-muted small mb-4">{t("dashboard.admin.addSchoolDesc")}</p>
                                <Link href="/dashboard/admin/schools?add=true" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2">
                                    <Plus size={18} />
                                    {t("dashboard.admin.addSchoolBtn")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-0 shadow-sm p-4 rounded-4 text-center h-100 stat-card">
                            <Card.Body className="d-flex flex-column align-items-center">
                                <div className="bg-info bg-opacity-10 p-3 rounded-4 mb-3">
                                    <Users size={32} className="text-info" />
                                </div>
                                <h4 className="h6 fw-bold mb-2">{t("dashboard.admin.manageUsers")}</h4>
                                <p className="text-muted small mb-4">{t("dashboard.admin.manageUsersDesc")}</p>
                                <Link href="/dashboard/manager/users" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2">
                                    <ArrowRight size={18} />
                                    {t("dashboard.admin.viewUsers")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-0 shadow-sm p-4 rounded-4 text-center h-100 stat-card">
                            <Card.Body className="d-flex flex-column align-items-center">
                                <div className="bg-danger bg-opacity-10 p-3 rounded-4 mb-3">
                                    <BookOpen size={32} className="text-danger" />
                                </div>
                                <h4 className="h6 fw-bold mb-2">{t("dashboard.admin.questionBank")}</h4>
                                <p className="text-muted small mb-4">{t("dashboard.admin.questionBankDesc")}</p>
                                <Link href="/dashboard/manager/questions" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2">
                                    <ArrowRight size={18} />
                                    {t("dashboard.admin.viewQuestions")}
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Recent Sections */}
            <div className="row g-4">
                <div className="col-lg-7">
                    <Card className="border-0 shadow-sm p-4 rounded-4 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 className="h6 fw-bold mb-0">{t("dashboard.admin.recentSchools")}</h3>
                            <Link href="/dashboard/admin/schools" className="small text-muted text-decoration-none">{t("dashboard.admin.viewAll")}</Link>
                        </div>
                        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                            {stats?.recentSchools?.length > 0 ? (
                                <div className="w-100">
                                    {stats.recentSchools.map((school: any) => (
                                        <div key={school.id} className="d-flex align-items-center justify-content-between p-3 border-bottom">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-light p-2 rounded-circle">
                                                    <School size={20} className="text-primary" />
                                                </div>
                                                <span className="fw-medium">{school.name}</span>
                                            </div>
                                            <small className="text-muted">{new Date(school.createdAt).toLocaleDateString()}</small>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <School size={48} className="mb-3 opacity-25" />
                                    <p className="mb-0">{t("dashboard.admin.noSchools")}</p>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
                <div className="col-lg-5">
                    <Card className="border-0 shadow-sm p-4 rounded-4 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 className="h6 fw-bold mb-0">{t("dashboard.admin.recentActivity")}</h3>
                            <Activity size={16} className="text-muted" />
                        </div>
                        <div className="d-flex flex-column gap-3">
                            {stats?.recentUsers?.map((user: any) => (
                                <div key={user.id} className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-light p-2 rounded-circle">
                                            <Users size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <div className="fw-bold small">{user.name || user.email.split('@')[0]}</div>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.role}</div>
                                        </div>
                                    </div>
                                    <div className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                </div>
                            ))}
                            {(!stats?.recentUsers || stats?.recentUsers?.length === 0) && (
                                <div className="text-center py-5 text-muted small">{t("dashboard.admin.noActivity")}</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
