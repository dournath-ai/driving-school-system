"use client";

import { useState, useEffect } from "react";
import { User, Check, X, Search, Plus, Edit, Trash2, Shield, Clock, Mail, Filter, MoreVertical } from "lucide-react";
import { Modal, Button, Form, Table, Badge, InputGroup, Spinner, Alert, Dropdown, Card, Row, Col } from "react-bootstrap";
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
        </div>
    );
}
