"use client";

import { useState, useEffect } from "react";
import { User, Check, X, Search, Plus, Edit, Trash2, Shield, Clock, Mail, Filter, MoreVertical, Eye, FileText, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Modal, Button, Form, Table, Badge, InputGroup, Spinner, Alert, Dropdown, Card, Row, Col, ProgressBar } from "react-bootstrap";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import QuizResultView from "@/components/quiz/QuizResultView";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/LanguageProvider";

type UserData = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MANAGER" | "INSTRUCTOR" | "STUDENT";
    isActive: boolean;
    connectionLimit: number | null;
};

type Attempt = {
    id: string;
    score: number;
    totalQuestions: number;
    passed: boolean;
    startTime: string;
    endTime: string | null;
    user?: {
        name: string;
        email: string;
    };
};

export default function UserManagement() {
    const { data: session } = useSession();
    const { t } = useLanguage();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("ALL");
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);

    useEffect(() => {
        if (session?.user?.role === "MANAGER") {
            setRoleFilter("STUDENT");
        }
    }, [session]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [currentUser, setCurrentUser] = useState<Partial<UserData>>({});
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Results Modal states
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [selectedStudentForResults, setSelectedStudentForResults] = useState<UserData | null>(null);
    const [studentAttempts, setStudentAttempts] = useState<Attempt[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [selectedAttemptDetails, setSelectedAttemptDetails] = useState<any | null>(null); // For QuizResultView
    const [fetchingDetails, setFetchingDetails] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentAttempts = async (userId: string) => {
        setLoadingResults(true);
        setStudentAttempts([]);
        try {
            const res = await fetch(`/api/quiz/results?userId=${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setStudentAttempts(data);
            }
        } catch (error) {
            console.error("Failed to fetch attempts", error);
            setMessage({ text: t("common.error", "Erreur lors du chargement des résultats"), type: 'danger' });
        } finally {
            setLoadingResults(false);
        }
    };

    const fetchAttemptDetails = async (attemptId: string) => {
        setFetchingDetails(true);
        try {
            const res = await fetch(`/api/quiz/results/${attemptId}`);
            const data = await res.json();
            if (res.ok) {
                setSelectedAttemptDetails(data);
            } else {
                alert(data.error || "Error fetching details");
            }
        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setFetchingDetails(false);
        }
    };

    const openResultsModal = (user: UserData) => {
        setSelectedStudentForResults(user);
        setSelectedAttemptDetails(null);
        setShowResultsModal(true);
        fetchStudentAttempts(user.id);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // Si l'utilisateur est un MANAGER, forcer le rôle à STUDENT
        if (session?.user?.role === "MANAGER") {
            currentUser.role = "STUDENT" as any;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...currentUser, role: session?.user?.role === "MANAGER" ? "STUDENT" : currentUser.role, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ text: t("users.created", "Utilisateur créé avec succès!"), type: 'success' });
                setShowAddModal(false);
                setCurrentUser({});
                setPassword("");
                fetchUsers();
            } else {
                setMessage({ text: data.error || t("users.error", "Erreur lors de la création"), type: 'danger' });
            }
        } catch (error) {
            setMessage({ text: t("users.error", "Erreur de connexion au serveur"), type: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // Si l'utilisateur est un MANAGER, s'assurer qu'il ne modifie que des étudiants
        if (session?.user?.role === "MANAGER") {
            // Vérifier que l'utilisateur actuel est bien un étudiant
            const userToEdit = users.find(u => u.id === currentUser.id);
            if (userToEdit && userToEdit.role !== "STUDENT") {
                setMessage({ text: t("users.managerEditError", "Vous ne pouvez modifier que les étudiants."), type: 'danger' });
                return;
            }
            // Forcer le rôle à STUDENT pour les managers
            currentUser.role = "STUDENT" as any;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/users/${currentUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentUser,
                    role: session?.user?.role === "MANAGER" ? "STUDENT" : currentUser.role
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ text: t("users.updated", "Utilisateur mis à jour avec succès!"), type: 'success' });
                setShowEditModal(false);
                setCurrentUser({});
                fetchUsers();
            } else {
                setMessage({ text: data.error || t("users.error", "Erreur lors de la modification"), type: 'danger' });
            }
        } catch (error) {
            setMessage({ text: t("users.error", "Erreur de connexion au serveur"), type: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/users/${currentUser.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setMessage({ text: t("users.deleted", "Utilisateur supprimé!"), type: 'success' });
                setShowDeleteModal(false);
                setCurrentUser({});
                fetchUsers();
            } else {
                const data = await res.json();
                setMessage({ text: data.error || t("users.error", "Erreur lors de la suppression"), type: 'danger' });
            }
        } catch (error) {
            setMessage({ text: t("users.error", "Erreur de connexion au serveur"), type: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (user: UserData) => {
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Badge bg="danger"><Shield size={12} className="me-1" /> {t("role.admin", "Administrateur")}</Badge>;
            case 'MANAGER': return <Badge bg="primary"><Shield size={12} className="me-1" /> {t("role.manager", "Gestionnaire")}</Badge>;
            case 'INSTRUCTOR': return <Badge bg="info"><User size={12} className="me-1" /> {t("role.instructor", "Instructeur")}</Badge>;
            case 'STUDENT': return <Badge bg="success"><User size={12} className="me-1" /> {t("role.student", "Étudiant")}</Badge>;
            default: return <Badge bg="secondary">{role}</Badge>;
        }
    };

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                            <User size={28} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="h3 mb-1 fw-bold">{t("users.title", "Gestion des Utilisateurs")}</h1>
                            <p className="text-muted mb-0">{t("users.subtitle", "Gérez les comptes, les rôles et les accès du système.")}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 text-md-end mt-3 mt-md-0">
                    <Button className="btn-tunisia px-4 py-2 d-flex align-items-center gap-2" onClick={() => {
                        const defaultRole = session?.user?.role === "MANAGER" ? "STUDENT" : "STUDENT";
                        setCurrentUser({ role: defaultRole as any });
                        setShowAddModal(true);
                    }}>
                        <Plus size={18} />
                        {t("users.newUser", "Nouvel Utilisateur")}
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {message && (
                <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="alert-tunisia mb-4">
                    {message.text}
                </Alert>
            )}

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
                                    placeholder={t("users.search", "Rechercher par nom ou email...")}
                                    className="border-start-0 shadow-none"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={6} className="text-md-end">
                            <Dropdown>
                                <Dropdown.Toggle variant="white" className="border shadow-sm d-inline-flex align-items-center gap-2">
                                    <Filter size={18} />
                                    {roleFilter === "ALL" ? t("users.allRoles", "Tous les Rôles") :
                                        roleFilter === "STUDENT" ? t("users.students", "Étudiants") :
                                            roleFilter === "MANAGER" ? t("users.managers", "Managers") :
                                                roleFilter === "INSTRUCTOR" ? t("users.instructors", "Instructeurs") : t("users.admins", "Administrateurs")}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {session?.user?.role === "ADMIN" && (
                                        <>
                                            <Dropdown.Item onClick={() => setRoleFilter("ALL")}>{t("users.allRoles", "Tous les Rôles")}</Dropdown.Item>
                                            <Dropdown.Item onClick={() => setRoleFilter("ADMIN")}>{t("users.admins", "Administrateurs")}</Dropdown.Item>
                                            <Dropdown.Item onClick={() => setRoleFilter("MANAGER")}>{t("users.managers", "Managers")}</Dropdown.Item>
                                            <Dropdown.Item onClick={() => setRoleFilter("INSTRUCTOR")}>{t("users.instructors", "Instructeurs")}</Dropdown.Item>
                                        </>
                                    )}
                                    <Dropdown.Item onClick={() => setRoleFilter("STUDENT")}>{t("users.studentsOnly", "Étudiants uniquement")}</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Users Grid */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="danger" />
                    <p className="mt-3 text-muted">{t("users.loading", "Chargement des utilisateurs...")}</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="text-center py-5">
                        <User size={48} className="text-muted mb-3 opacity-50" />
                        <h5 className="text-muted">{t("users.notFound", "Aucun utilisateur trouvé.")}</h5>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-4">
                    {filteredUsers.map((user) => (
                        <Col key={user.id} xs={12} md={6} lg={4}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 user-card">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                                            <div className={`bg-${user.isActive ? 'success' : 'danger'} bg-opacity-10 p-3 rounded-3`}>
                                                <User size={24} className={`text-${user.isActive ? 'success' : 'danger'}`} />
                                            </div>
                                            <div className="flex-grow-1">
                                                <h5 className="mb-1 fw-bold">{user.name || t("users.noName", "Sans nom")}</h5>
                                                <p className="small text-muted mb-0">{user.email}</p>
                                            </div>
                                        </div>
                                        <Dropdown>
                                            <Dropdown.Toggle variant="link" className="text-muted p-0 border-0" id={`dropdown-${user.id}`}>
                                                <MoreVertical size={20} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu align="end">
                                                <Dropdown.Item
                                                    onClick={() => openResultsModal(user)}
                                                    disabled={user.role !== "STUDENT"}
                                                >
                                                    <Eye size={16} className="me-2" />
                                                    {t("dashboard.manager.viewResults", "Voir les Résultats")}
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                                <Dropdown.Item
                                                    onClick={() => {
                                                        // Pour les managers, vérifier que l'utilisateur est un étudiant
                                                        if (session?.user?.role === "MANAGER" && user.role !== "STUDENT") {
                                                            setMessage({ text: t("users.managerEditError", "Vous ne pouvez modifier que les étudiants."), type: 'danger' });
                                                            return;
                                                        }
                                                        setCurrentUser(user);
                                                        setShowEditModal(true);
                                                    }}
                                                    disabled={session?.user?.role === "MANAGER" && user.role !== "STUDENT"}
                                                >
                                                    <Edit size={16} className="me-2" />
                                                    {t("users.edit", "Modifier")}
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                                <Dropdown.Item
                                                    onClick={() => {
                                                        // Pour les managers, vérifier que l'utilisateur est un étudiant
                                                        if (session?.user?.role === "MANAGER" && user.role !== "STUDENT") {
                                                            setMessage({ text: t("users.managerEditError", "Vous ne pouvez supprimer que les étudiants."), type: 'danger' });
                                                            return;
                                                        }
                                                        setCurrentUser(user);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    disabled={session?.user?.role === "MANAGER" && user.role !== "STUDENT"}
                                                    className="text-danger"
                                                >
                                                    <Trash2 size={16} className="me-2" />
                                                    {t("users.delete", "Supprimer")}
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>

                                    <div className="mb-3">
                                        {getRoleBadge(user.role)}
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <Clock size={16} className="text-muted" />
                                            <span className="small text-muted">
                                                {user.connectionLimit ? `${user.connectionLimit} min` : t("users.default", "Par défaut")}
                                            </span>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            id={`status-${user.id}`}
                                            checked={user.isActive}
                                            onChange={() => toggleStatus(user)}
                                            label={user.isActive ? t("users.active", "Actif") : t("users.inactive", "Inactif")}
                                            className={user.isActive ? "text-success fw-medium" : "text-danger fw-medium"}
                                        />
                                    </div>

                                    <div className="d-flex gap-2 pt-3 border-top">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="flex-grow-1"
                                            onClick={() => {
                                                // Pour les managers, vérifier que l'utilisateur est un étudiant
                                                if (session?.user?.role === "MANAGER" && user.role !== "STUDENT") {
                                                    setMessage({ text: t("users.managerEditError", "Vous ne pouvez modifier que les étudiants."), type: 'danger' });
                                                    return;
                                                }
                                                setCurrentUser(user);
                                                setShowEditModal(true);
                                            }}
                                            disabled={session?.user?.role === "MANAGER" && user.role !== "STUDENT"}
                                        >
                                            <Edit size={14} className="me-1" />
                                            {t("users.edit", "Modifier")}
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="flex-grow-1"
                                            onClick={() => {
                                                // Pour les managers, vérifier que l'utilisateur est un étudiant
                                                if (session?.user?.role === "MANAGER" && user.role !== "STUDENT") {
                                                    setMessage({ text: t("users.managerEditError", "Vous ne pouvez supprimer que les étudiants."), type: 'danger' });
                                                    return;
                                                }
                                                setCurrentUser(user);
                                                setShowDeleteModal(true);
                                            }}
                                            disabled={session?.user?.role === "MANAGER" && user.role !== "STUDENT"}
                                        >
                                            <Trash2 size={14} className="me-1" />
                                            {t("users.delete", "Supprimer")}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Add User Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Plus size={20} />
                        {t("users.addTitle", "Ajouter un Utilisateur")}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddUser}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("users.fullName", "Nom Complet")}</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={currentUser.name || ""}
                                onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                                placeholder={t("users.fullNamePlaceholder", "ex: Ahmed Ben Ali")}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Email</Form.Label>
                            <Form.Control
                                type="email"
                                required
                                value={currentUser.email || ""}
                                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                                placeholder={t("users.emailPlaceholder", "email@exemple.com")}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("users.password", "Mot de Passe")}</Form.Label>
                            <Form.Control
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">{t("users.role", "Rôle")}</Form.Label>
                                    {session?.user?.role === "MANAGER" ? (
                                        <>
                                            <Form.Control
                                                type="text"
                                                value={t("role.student", "Étudiant")}
                                                disabled
                                                className="bg-light"
                                            />
                                            <Form.Text className="text-muted small">
                                                {t("users.managerNote", "En tant que responsable, vous ne pouvez ajouter que des étudiants.")}
                                            </Form.Text>
                                        </>
                                    ) : (
                                        <Form.Select
                                            value={currentUser.role}
                                            onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value as any })}
                                        >
                                            <option value="STUDENT">{t("role.student", "Étudiant")}</option>
                                            <option value="INSTRUCTOR">{t("role.instructor", "Instructeur")}</option>
                                            <option value="MANAGER">{t("role.manager", "Gestionnaire")}</option>
                                            <option value="ADMIN">{t("role.admin", "Administrateur")}</option>
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">{t("users.limit", "Limite (min)")}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={currentUser.connectionLimit || ""}
                                        onChange={(e) => setCurrentUser({ ...currentUser, connectionLimit: parseInt(e.target.value) || null })}
                                        placeholder={t("users.optional", "Optionnel")}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 p-4 pt-0">
                        <Button variant="light" onClick={() => setShowAddModal(false)} className="px-4">{t("common.cancel", "Annuler")}</Button>
                        <Button variant="danger" type="submit" disabled={submitting} className="px-4">
                            {submitting ? <Spinner size="sm" /> : t("users.create", "Créer l'utilisateur")}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Edit size={20} />
                        {t("users.editTitle", "Modifier l'Utilisateur")}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditUser}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("users.fullName", "Nom Complet")}</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={currentUser.name || ""}
                                onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Email</Form.Label>
                            <Form.Control
                                type="email"
                                required
                                value={currentUser.email || ""}
                                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">{t("users.role", "Rôle")}</Form.Label>
                                    {session?.user?.role === "MANAGER" ? (
                                        <>
                                            <Form.Control
                                                type="text"
                                                value={currentUser.role === "STUDENT" ? t("role.student", "Étudiant") : currentUser.role || ""}
                                                disabled
                                                className="bg-light"
                                            />
                                            <Form.Text className="text-muted small">
                                                {t("users.managerEditNote", "En tant que responsable, vous ne pouvez modifier que les étudiants.")}
                                            </Form.Text>
                                        </>
                                    ) : (
                                        <Form.Select
                                            value={currentUser.role}
                                            onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value as any })}
                                        >
                                            <option value="STUDENT">{t("role.student", "Étudiant")}</option>
                                            <option value="INSTRUCTOR">{t("role.instructor", "Instructeur")}</option>
                                            <option value="MANAGER">{t("role.manager", "Gestionnaire")}</option>
                                            <option value="ADMIN">{t("role.admin", "Administrateur")}</option>
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">{t("users.limit", "Limite (min)")}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={currentUser.connectionLimit || ""}
                                        onChange={(e) => setCurrentUser({ ...currentUser, connectionLimit: parseInt(e.target.value) || null })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 p-4 pt-0">
                        <Button variant="light" onClick={() => setShowEditModal(false)} className="px-4">{t("common.cancel", "Annuler")}</Button>
                        <Button variant="primary" type="submit" disabled={submitting} className="px-4">
                            {submitting ? <Spinner size="sm" /> : t("common.save", "Enregistrer")}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Trash2 size={20} />
                        {t("users.deleteTitle", "Confirmer la Suppression")}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 text-center">
                    <div className="text-danger mb-3">
                        <Trash2 size={48} />
                    </div>
                    <h5>{t("users.deleteConfirm", "Êtes-vous sûr ?")}</h5>
                    <p className="text-muted">
                        {t("users.deleteDesc", "Voulez-vous vraiment supprimer l'utilisateur {name} ? Cette action est irréversible.").replace("{name}", currentUser.name || "")}
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button variant="light" onClick={() => setShowDeleteModal(false)} className="px-4">{t("common.cancel", "Annuler")}</Button>
                    <Button variant="danger" onClick={handleDeleteUser} disabled={submitting} className="px-4">
                        {submitting ? <Spinner size="sm" /> : t("common.delete", "Supprimer")}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* User Results Modal */}
            <Modal show={showResultsModal} onHide={() => setShowResultsModal(false)} size="xl" centered scrollable>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <FileText size={20} className="text-primary" />
                        {selectedAttemptDetails ?
                            t("quiz.review", "Détail du Résultat") :
                            `${t("results.title", "Résultats")} - ${selectedStudentForResults?.name}`
                        }
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {selectedAttemptDetails ? (
                        <div className="p-3">
                            <Button
                                variant="link"
                                className="p-0 mb-3 text-decoration-none d-flex align-items-center gap-2"
                                onClick={() => setSelectedAttemptDetails(null)}
                            >
                                ← {t("common.back", "Retour à la liste")}
                            </Button>
                            <QuizResultView
                                result={selectedAttemptDetails}
                                onBack={() => setSelectedAttemptDetails(null)}
                            />
                        </div>
                    ) : (
                        <div className="p-4">
                            {loadingResults ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-3 text-muted">{t("common.loading", "Chargement...")}</p>
                                </div>
                            ) : studentAttempts.length === 0 ? (
                                <div className="text-center py-5">
                                    <FileText size={48} className="text-muted mb-3 opacity-50" />
                                    <h5 className="text-muted">{t("results.empty", "Aucun résultat trouvé")}</h5>
                                    <p className="text-muted small">{t("results.emptyDesc", "L'étudiant n'a pas encore passé de test.")}</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4 text-secondary small text-uppercase">{t("results.dateTime", "Date & Heure")}</th>
                                                <th className="text-center text-secondary small text-uppercase">{t("results.score", "Score")}</th>
                                                <th className="text-center text-secondary small text-uppercase">{t("results.status", "Statut")}</th>
                                                <th className="text-end pe-4 text-secondary small text-uppercase">{t("common.actions", "Actions")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentAttempts.map((attempt) => {
                                                const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                                                return (
                                                    <tr key={attempt.id} style={{ cursor: 'pointer' }} onClick={() => fetchAttemptDetails(attempt.id)}>
                                                        <td className="ps-4">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="bg-light p-2 rounded-3 text-secondary">
                                                                    <Calendar size={18} />
                                                                </div>
                                                                <div>
                                                                    <div className="fw-medium">
                                                                        {format(new Date(attempt.startTime), "d MMMM yyyy", { locale: fr })}
                                                                    </div>
                                                                    <div className="small text-muted">
                                                                        {format(new Date(attempt.startTime), "HH:mm")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <div className="d-flex flex-column align-items-center">
                                                                <span className="fw-bold h5 mb-0 text-dark">{attempt.score}/{attempt.totalQuestions}</span>
                                                                <div className="d-flex align-items-center gap-2 mt-1" style={{ width: '120px' }}>
                                                                    <ProgressBar
                                                                        now={percentage}
                                                                        variant={percentage >= 80 ? "success" : "danger"}
                                                                        className="flex-grow-1"
                                                                        style={{ height: "4px" }}
                                                                    />
                                                                    <span className="small text-muted">{percentage}%</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            {attempt.passed ? (
                                                                <Badge bg="success" className="px-3 py-2 rounded-pill fw-normal">
                                                                    <CheckCircle2 size={14} className="me-1" />
                                                                    {t("results.passed", "Réussi")}
                                                                </Badge>
                                                            ) : (
                                                                <Badge bg="danger" className="px-3 py-2 rounded-pill fw-normal">
                                                                    <XCircle size={14} className="me-1" />
                                                                    {t("results.failed", "Échoué")}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            <Button
                                                                variant="light"
                                                                size="sm"
                                                                className="rounded-circle p-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    fetchAttemptDetails(attempt.id);
                                                                }}
                                                                disabled={fetchingDetails}
                                                            >
                                                                {fetchingDetails && selectedAttemptDetails?.id === attempt.id ? (
                                                                    <Spinner size="sm" animation="border" />
                                                                ) : (
                                                                    <Eye size={18} className="text-secondary" />
                                                                )}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}
