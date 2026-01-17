"use client";

import { useState, useEffect, Suspense } from "react";
import { School, User, Plus, Search, MapPin, Phone, Mail, Shield, Edit, Trash2, Eye, Users, BarChart3, Calendar, X } from "lucide-react";
import { Modal, Button, Form, Card, Spinner, Alert, Badge, InputGroup, Dropdown, Row, Col } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

interface Manager {
    id: string;
    name: string;
    email: string;
}

interface DrivingSchool {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    users: Manager[];
    createdAt: string;
    _count: {
        users: number;
    };
}

function SchoolsContent() {
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const [schools, setSchools] = useState<DrivingSchool[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    
    const [search, setSearch] = useState("");
    const [selectedSchool, setSelectedSchool] = useState<DrivingSchool | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
        managerId: ""
    });

    useEffect(() => {
        fetchData();
        if (searchParams.get("add") === "true") {
            setShowAddModal(true);
        }
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schoolsRes, managersRes] = await Promise.all([
                fetch("/api/admin/schools"),
                fetch("/api/users?role=MANAGER")
            ]);

            if (schoolsRes.ok && managersRes.ok) {
                const schoolsData = await schoolsRes.json();
                const managersData = await managersRes.json();
                setSchools(schoolsData);
                setManagers(managersData);
            } else {
                setError(t("schools.error", "Erreur lors de la récupération des données"));
            }
        } catch (err) {
            setError(t("schools.error", "Erreur de connexion au serveur"));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            address: "",
            phone: "",
            email: "",
            managerId: ""
        });
    };

    const handleAddSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/admin/schools", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSuccess(t("schools.created", "Auto-école créée avec succès!"));
                setShowAddModal(false);
                resetForm();
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const data = await res.json();
                setError(data.error || t("schools.error", "Erreur lors de la création"));
            }
        } catch (err) {
            setError(t("schools.error", "Erreur de connexion"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;
        
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`/api/admin/schools?id=${selectedSchool.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedSchool.id, ...formData })
            });

            if (res.ok) {
                setSuccess(t("schools.updated", "Auto-école mise à jour avec succès!"));
                setShowEditModal(false);
                setSelectedSchool(null);
                resetForm();
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const data = await res.json();
                setError(data.error || t("schools.error", "Erreur lors de la modification"));
            }
        } catch (err) {
            setError(t("schools.error", "Erreur de connexion"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSchool = async () => {
        if (!selectedSchool) return;
        
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/schools?id=${selectedSchool.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setSuccess(t("schools.deleted", "Auto-école supprimée avec succès!"));
                setShowDeleteModal(false);
                setSelectedSchool(null);
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const data = await res.json();
                setError(data.error || t("schools.error", "Erreur lors de la suppression"));
            }
        } catch (err) {
            setError(t("schools.error", "Erreur de connexion"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignManager = async () => {
        if (!selectedSchool) return;
        
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`/api/admin/schools?id=${selectedSchool.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: selectedSchool.id,
                    name: selectedSchool.name,
                    address: selectedSchool.address,
                    phone: selectedSchool.phone,
                    email: selectedSchool.email,
                    managerId: formData.managerId
                })
            });

            if (res.ok) {
                setSuccess(t("schools.managerAssigned", "Manager assigné avec succès!"));
                setShowAssignModal(false);
                setSelectedSchool(null);
                resetForm();
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const data = await res.json();
                setError(data.error || t("schools.error", "Erreur lors de l'assignation"));
            }
        } catch (err) {
            setError(t("schools.error", "Erreur de connexion"));
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (school: DrivingSchool) => {
        setSelectedSchool(school);
        setFormData({
            name: school.name,
            address: school.address || "",
            phone: school.phone || "",
            email: school.email || "",
            managerId: school.users[0]?.id || ""
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (school: DrivingSchool) => {
        setSelectedSchool(school);
        setShowDeleteModal(true);
    };

    const openDetailsModal = (school: DrivingSchool) => {
        setSelectedSchool(school);
        setShowDetailsModal(true);
    };

    const openAssignModal = (school: DrivingSchool) => {
        setSelectedSchool(school);
        setFormData({
            ...formData,
            managerId: school.users[0]?.id || ""
        });
        setShowAssignModal(true);
    };

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.address?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1 fw-bold">{t("schools.title", "Gestion des Auto-écoles")}</h1>
                    <p className="text-muted mb-0">{t("schools.subtitle", "Ajoutez et gérez les auto-écoles de la plateforme.")}</p>
                </div>
                <Button 
                    className="btn-tunisia px-4 py-2 d-flex align-items-center gap-2" 
                    onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}
                >
                    <Plus size={18} />
                    {t("schools.new", "Nouvelle Auto-école")}
                </Button>
            </div>

            {/* Alerts */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="alert-tunisia mb-3">
                    {error}
                </Alert>
            )}
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="alert-tunisia mb-3">
                    {success}
                </Alert>
            )}

            {/* Search Bar */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body className="p-4">
                    <InputGroup className="max-w-md">
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder={t("schools.search", "Rechercher une école...")}
                            className="border-start-0 shadow-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            {/* Schools Grid */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="danger" />
                    <p className="mt-2 text-muted">{t("schools.loading", "Chargement...")}</p>
                </div>
            ) : filteredSchools.length === 0 ? (
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="text-center py-5">
                        <School size={48} className="text-muted mb-3 opacity-50" />
                        <h5 className="text-muted">{t("schools.notFound", "Aucune auto-école trouvée.")}</h5>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-4">
                    {filteredSchools.map(school => (
                        <Col key={school.id} xs={12} md={6} lg={4}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 school-card">
                                <Card.Body className="p-4">
                                    {/* Header */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-danger bg-opacity-10 p-3 rounded-3">
                                                <School size={24} className="text-danger" />
                                            </div>
                                            <div>
                                                <h5 className="mb-0 fw-bold">{school.name}</h5>
                                                <small className="text-muted">
                                                    <Calendar size={12} className="me-1" />
                                                    {t("schools.createdDate", "Créée le")} {new Date(school.createdAt).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </div>
                                        <Dropdown>
                                            <Dropdown.Toggle variant="link" className="text-muted p-0 border-0" id={`dropdown-${school.id}`}>
                                                <span className="fs-5">⋯</span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu align="end">
                                                <Dropdown.Item onClick={() => openDetailsModal(school)}>
                                                    <Eye size={16} className="me-2" />
                                                    {t("schools.viewDetails", "Voir détails")}
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => openEditModal(school)}>
                                                    <Edit size={16} className="me-2" />
                                                    {t("schools.edit", "Modifier")}
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => openAssignModal(school)}>
                                                    <Shield size={16} className="me-2" />
                                                    {t("schools.assignManager", "Assigner Manager")}
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                                <Dropdown.Item 
                                                    onClick={() => openDeleteModal(school)}
                                                    className="text-danger"
                                                >
                                                    <Trash2 size={16} className="me-2" />
                                                    {t("schools.delete", "Supprimer")}
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>

                                    {/* Manager */}
                                    <div className="mb-3">
                                        {school.users.length > 0 ? (
                                            <div className="d-flex align-items-center gap-2 p-2 bg-primary bg-opacity-10 rounded-3">
                                                <div className="bg-primary bg-opacity-20 p-1 rounded-circle">
                                                    <Shield size={14} className="text-primary" />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="small fw-semibold">{school.users[0].name}</div>
                                                    <div className="small text-muted">{school.users[0].email}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <Badge bg="secondary" className="fw-normal p-2">
                                                {t("schools.noManager", "Aucun manager")}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Contact Info */}
                                    <div className="mb-3">
                                        {school.address && (
                                            <div className="d-flex align-items-center gap-2 mb-2 small text-muted">
                                                <MapPin size={14} />
                                                <span className="text-truncate">{school.address}</span>
                                            </div>
                                        )}
                                        {school.email && (
                                            <div className="d-flex align-items-center gap-2 mb-2 small text-muted">
                                                <Mail size={14} />
                                                <span className="text-truncate">{school.email}</span>
                                            </div>
                                        )}
                                        {school.phone && (
                                            <div className="d-flex align-items-center gap-2 small text-muted">
                                                <Phone size={14} />
                                                <span>{school.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                        <div className="d-flex align-items-center gap-2">
                                            <Users size={16} className="text-muted" />
                                            <span className="small fw-semibold">
                                                {school._count.users} {t("schools.users", "Utilisateurs")}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => openDetailsModal(school)}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <Eye size={14} />
                                            {t("schools.view", "Voir")}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Add School Modal */}
            <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetForm(); }} centered size="lg">
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Plus size={20} />
                        {t("schools.addTitle", "Nouvelle Auto-école")}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddSchool}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("schools.name", "Nom de l'Auto-école")}</Form.Label>
                            <Form.Control
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t("schools.namePlaceholder", "ex: Auto-École Moderne")}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("schools.address", "Adresse")}</Form.Label>
                            <Form.Control
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder={t("schools.addressPlaceholder", "Rue Habib Bourguiba, Tunis")}
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">{t("schools.phone", "Téléphone")}</Form.Label>
                                    <Form.Control
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder={t("schools.phonePlaceholder", "+216 71 000 000")}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder={t("schools.emailPlaceholder", "contact@ecole.tn")}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("schools.assignManager", "Assigner un Manager")}</Form.Label>
                            <Form.Select
                                value={formData.managerId}
                                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                            >
                                <option value="">{t("schools.selectManager", "--- Sélectionner un Manager ---")}</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted small">
                                {t("schools.managerNote", "Vous pouvez créer un nouveau manager dans la section \"Utilisateurs\".")}
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 p-4 pt-0">
                        <Button variant="light" onClick={() => { setShowAddModal(false); resetForm(); }} className="px-4">
                            {t("common.cancel", "Annuler")}
                        </Button>
                        <Button type="submit" className="btn-tunisia px-4" disabled={submitting}>
                            {submitting ? <Spinner size="sm" /> : t("schools.create", "Créer l'Auto-école")}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit School Modal */}
            <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setSelectedSchool(null); resetForm(); }} centered size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Edit size={20} />
                        {t("schools.editTitle", "Modifier l'Auto-école")}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSchool}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("schools.name", "Nom de l'Auto-école")}</Form.Label>
                            <Form.Control
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("schools.address", "Adresse")}</Form.Label>
                            <Form.Control
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">{t("schools.phone", "Téléphone")}</Form.Label>
                                    <Form.Control
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">{t("schools.assignManager", "Assigner un Manager")}</Form.Label>
                            <Form.Select
                                value={formData.managerId}
                                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                            >
                                <option value="">{t("schools.selectManager", "--- Sélectionner un Manager ---")}</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 p-4 pt-0">
                        <Button variant="light" onClick={() => { setShowEditModal(false); setSelectedSchool(null); resetForm(); }} className="px-4">
                            {t("common.cancel", "Annuler")}
                        </Button>
                        <Button type="submit" variant="primary" className="px-4" disabled={submitting}>
                            {submitting ? <Spinner size="sm" /> : t("common.save", "Enregistrer")}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setSelectedSchool(null); }} centered>
                <Modal.Header closeButton className="bg-dark text-white">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Trash2 size={20} />
                        {t("schools.deleteTitle", "Confirmer la Suppression")}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 text-center">
                    <div className="text-danger mb-3">
                        <Trash2 size={48} />
                    </div>
                    <h5>{t("schools.deleteConfirm", "Êtes-vous sûr ?")}</h5>
                    <p className="text-muted">
                        {t("schools.deleteDesc", "Voulez-vous vraiment supprimer l'auto-école")} <strong>{selectedSchool?.name}</strong> ?
                        <br />
                        {t("schools.deleteWarning", "Cette action est irréversible.")}
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button variant="light" onClick={() => { setShowDeleteModal(false); setSelectedSchool(null); }} className="px-4">
                        {t("common.cancel", "Annuler")}
                    </Button>
                    <Button variant="danger" onClick={handleDeleteSchool} disabled={submitting} className="px-4">
                        {submitting ? <Spinner size="sm" /> : t("common.delete", "Supprimer")}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Details Modal */}
            <Modal show={showDetailsModal} onHide={() => { setShowDetailsModal(false); setSelectedSchool(null); }} centered size="lg">
                <Modal.Header closeButton className="bg-info text-white">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Eye size={20} />
                        {t("schools.detailsTitle", "Détails de l'Auto-école")}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedSchool && (
                        <>
                            <div className="text-center mb-4">
                                <div className="bg-danger bg-opacity-10 p-4 rounded-circle d-inline-block mb-3">
                                    <School size={40} className="text-danger" />
                                </div>
                                <h4 className="fw-bold">{selectedSchool.name}</h4>
                            </div>
                            
                            <Row className="g-3 mb-4">
                                <Col md={6}>
                                    <Card className="border-0 bg-light">
                                        <Card.Body className="p-3">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <MapPin size={18} className="text-primary" />
                                                <strong>{t("schools.address", "Adresse")}</strong>
                                            </div>
                                            <p className="mb-0 text-muted">{selectedSchool.address || t("schools.noAddress", "Pas d'adresse")}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="border-0 bg-light">
                                        <Card.Body className="p-3">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <Phone size={18} className="text-success" />
                                                <strong>{t("schools.phone", "Téléphone")}</strong>
                                            </div>
                                            <p className="mb-0 text-muted">{selectedSchool.phone || "N/A"}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="border-0 bg-light">
                                        <Card.Body className="p-3">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <Mail size={18} className="text-warning" />
                                                <strong>Email</strong>
                                            </div>
                                            <p className="mb-0 text-muted">{selectedSchool.email || "N/A"}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="border-0 bg-light">
                                        <Card.Body className="p-3">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <Calendar size={18} className="text-info" />
                                                <strong>{t("schools.createdDate", "Créée le")}</strong>
                                            </div>
                                            <p className="mb-0 text-muted">{new Date(selectedSchool.createdAt).toLocaleDateString()}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Card className="border-0 bg-primary bg-opacity-10 mb-3">
                                <Card.Body className="p-3">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <Shield size={18} className="text-primary" />
                                        <strong>{t("schools.manager", "Manager Assigné")}</strong>
                                    </div>
                                    {selectedSchool.users.length > 0 ? (
                                        <div>
                                            <p className="mb-1 fw-semibold">{selectedSchool.users[0].name}</p>
                                            <p className="mb-0 small text-muted">{selectedSchool.users[0].email}</p>
                                        </div>
                                    ) : (
                                        <p className="mb-0 text-muted">{t("schools.noManager", "Aucun manager")}</p>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="border-0 bg-success bg-opacity-10">
                                <Card.Body className="p-3">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <Users size={18} className="text-success" />
                                        <strong>{t("schools.students", "Étudiants")}</strong>
                                    </div>
                                    <h3 className="mb-0 fw-bold text-success">{selectedSchool._count.users}</h3>
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button variant="light" onClick={() => { setShowDetailsModal(false); setSelectedSchool(null); }} className="px-4">
                        {t("common.close", "Fermer")}
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => {
                            setShowDetailsModal(false);
                            openEditModal(selectedSchool!);
                        }}
                        className="px-4"
                    >
                        <Edit size={16} className="me-2" />
                        {t("schools.edit", "Modifier")}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Assign Manager Modal */}
            <Modal show={showAssignModal} onHide={() => { setShowAssignModal(false); setSelectedSchool(null); resetForm(); }} centered>
                <Modal.Header closeButton className="bg-warning text-dark">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Shield size={20} />
                        {t("schools.assignManager", "Assigner un Manager")}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p className="text-muted mb-3">
                        {t("schools.assignDesc", "Sélectionnez un manager pour")} <strong>{selectedSchool?.name}</strong>
                    </p>
                    <Form.Group>
                        <Form.Label className="fw-bold">{t("schools.selectManager", "Sélectionner un Manager")}</Form.Label>
                        <Form.Select
                            value={formData.managerId}
                            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                        >
                            <option value="">{t("schools.selectManager", "--- Sélectionner un Manager ---")}</option>
                            {managers.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button variant="light" onClick={() => { setShowAssignModal(false); setSelectedSchool(null); resetForm(); }} className="px-4">
                        {t("common.cancel", "Annuler")}
                    </Button>
                    <Button variant="warning" onClick={handleAssignManager} disabled={submitting} className="px-4">
                        {submitting ? <Spinner size="sm" /> : t("schools.assign", "Assigner")}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default function SchoolsManagement() {
    return (
        <Suspense fallback={
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Spinner animation="border" variant="danger" />
            </div>
        }>
            <SchoolsContent />
        </Suspense>
    );
}
