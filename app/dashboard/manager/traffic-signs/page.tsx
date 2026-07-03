"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Search, AlertCircle, X, ImageIcon as Image, FileText, Download } from "lucide-react";
import { Modal, Button, Form, Badge, InputGroup, Spinner, Alert, Card, Row, Col } from "react-bootstrap";
import { useLanguage } from "@/components/LanguageProvider";
import TrafficSignFileUpload from "@/components/TrafficSignFileUpload";
import ImageViewer from "@/components/ImageViewer";
import PDFViewer from "@/components/PDFViewer";

type TrafficSignFile = {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    uploadedBy?: { name?: string; email: string };
};

type TrafficSign = {
    id: string;
    title: string;
    description?: string;
    category?: string;
    code?: string;
    files: TrafficSignFile[];
    createdBy?: { name?: string; email: string };
    createdAt: string;
};

export default function TrafficSignsManagement() {
    const { t } = useLanguage();
    const [signs, setSigns] = useState<TrafficSign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [viewerState, setViewerState] = useState<{
        type: 'image' | 'pdf' | null;
        isOpen: boolean;
        fileUrl: string;
        fileName: string;
    }>({
        type: null,
        isOpen: false,
        fileUrl: '',
        fileName: '',
    });

    const [currentSign, setCurrentSign] = useState<Partial<TrafficSign>>({
        title: "",
        description: "",
        category: "",
        code: "",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSigns();
    }, []);

    const fetchSigns = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/traffic-signs");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setSigns(data || []);
        } catch (err) {
            console.error("Error fetching signs:", err);
            setMessage({ text: t("trafficSigns.error"), type: "danger" });
        } finally {
            setLoading(false);
        }
    };

    const isImage = (fileType: string): boolean => {
        return fileType.startsWith("image/");
    };

    const isPDF = (fileType: string): boolean => {
        return fileType === "application/pdf";
    };

    const handleFileClick = (file: TrafficSignFile) => {
        if (isImage(file.fileType)) {
            setViewerState({
                type: 'image',
                isOpen: true,
                fileUrl: file.fileUrl,
                fileName: file.fileName,
            });
        } else if (isPDF(file.fileType)) {
            setViewerState({
                type: 'pdf',
                isOpen: true,
                fileUrl: file.fileUrl,
                fileName: file.fileName,
            });
        }
    };

    const closeViewers = () => {
        setViewerState({ ...viewerState, isOpen: false });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const handleOpenFormModal = (sign?: TrafficSign) => {
        if (sign) {
            setCurrentSign(sign);
        } else {
            setCurrentSign({
                title: "",
                description: "",
                category: "",
                code: "",
            });
        }
        setShowFormModal(true);
    };

    const handleCloseFormModal = () => {
        setShowFormModal(false);
        setCurrentSign({
            title: "",
            description: "",
            category: "",
            code: "",
        });
    };

    const handleSaveSign = async () => {
        if (!currentSign.title?.trim()) {
            setMessage({ text: "Title is required", type: "danger" });
            return;
        }

        try {
            setSubmitting(true);
            const method = currentSign.id ? "PATCH" : "POST";
            const url = "/api/traffic-signs";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentSign.id,
                    title: currentSign.title?.trim(),
                    description: currentSign.description?.trim() || null,
                    category: currentSign.category?.trim() || null,
                    code: currentSign.code?.trim() || null,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error saving");
            }

            const savedSign = await res.json();

            if (currentSign.id) {
                setSigns(signs.map((s) => (s.id === savedSign.id ? savedSign : s)));
                setMessage({ text: t("trafficSigns.updated"), type: "success" });
            } else {
                setSigns([savedSign, ...signs]);
                setMessage({ text: t("trafficSigns.created"), type: "success" });
            }

            handleCloseFormModal();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : t("trafficSigns.error");
            setMessage({ text: errorMsg, type: "danger" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (sign: TrafficSign) => {
        setCurrentSign(sign);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!currentSign.id) return;

        try {
            setSubmitting(true);
            const res = await fetch(`/api/traffic-signs?id=${currentSign.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            setSigns(signs.filter((s) => s.id !== currentSign.id));
            setMessage({ text: t("trafficSigns.deleted"), type: "success" });
            setShowDeleteModal(false);
        } catch (err) {
            setMessage({ text: t("trafficSigns.error"), type: "danger" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadClick = (sign: TrafficSign) => {
        setCurrentSign(sign);
        setShowUploadModal(true);
    };

    const filteredSigns = signs.filter((sign) =>
        sign.title.toLowerCase().includes(search.toLowerCase()) ||
        sign.code?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="h3 fw-bold mb-1">{t("trafficSigns.title")}</h2>
                    <p className="text-muted mb-0">{t("trafficSigns.description")}</p>
                </div>
                <Button variant="primary" onClick={() => handleOpenFormModal()}>
                    <Plus size={18} className="me-2" />
                    {t("trafficSigns.addNew")}
                </Button>
            </div>

            {/* Message Alert */}
            {message && (
                <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="mb-4">
                    {message.text}
                </Alert>
            )}

            {/* Search Bar */}
            <InputGroup className="mb-4">
                <InputGroup.Text>
                    <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                    placeholder={t("trafficSigns.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </InputGroup>

            {/* Traffic Signs List */}
            {filteredSigns.length === 0 ? (
                <Alert variant="info" className="text-center py-5">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="mb-0">{t("trafficSigns.noData")}</p>
                </Alert>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {filteredSigns.map((sign) => (
                        <Card key={sign.id} className="shadow-sm">
                            <Card.Body>
                                <Row className="align-items-start mb-3">
                                    <Col md={8}>
                                        <div className="d-flex align-items-center mb-2 gap-2">
                                            <h5 className="mb-0 fw-bold">{sign.title}</h5>
                                            {sign.category && (
                                                <Badge bg="primary">{sign.category}</Badge>
                                            )}
                                            {sign.code && <Badge bg="secondary">{sign.code}</Badge>}
                                        </div>
                                        {sign.description && (
                                            <p className="text-muted small mb-2">{sign.description}</p>
                                        )}
                                        <div className="text-muted small">
                                            <span>
                                                {t("trafficSigns.files")}: <strong>{sign.files.length}</strong>
                                            </span>
                                            <span className="ms-3">
                                                {t("trafficSigns.createdAt")}:{" "}
                                                <strong>
                                                    {new Date(sign.createdAt).toLocaleDateString()}
                                                </strong>
                                            </span>
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-end">
                                        <div className="d-flex gap-2 justify-content-md-end flex-wrap">
                                            <Button
                                                variant="warning"
                                                size="sm"
                                                onClick={() => handleUploadClick(sign)}
                                                title={t("trafficSigns.upload")}
                                            >
                                                <Plus size={16} />
                                            </Button>
                                            <Button
                                                variant="info"
                                                size="sm"
                                                onClick={() => handleOpenFormModal(sign)}
                                                title={t("trafficSigns.edit")}
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDeleteClick(sign)}
                                                title={t("trafficSigns.delete")}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Files Section */}
                                {sign.files && sign.files.length > 0 && (
                                    <div className="border-top pt-3">
                                        <small className="d-block fw-bold text-secondary mb-2">
                                            {t("trafficSigns.details")}
                                        </small>

                                        {/* Thumbnail Gallery */}
                                        <div className="mb-3">
                                            <div className="d-flex flex-wrap gap-2">
                                                {sign.files.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="position-relative"
                                                        style={{
                                                            flex: "0 0 calc(25% - 8px)",
                                                            minWidth: "80px",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {isImage(file.fileType) ? (
                                                            <div
                                                                onClick={() => handleFileClick(file)}
                                                                className="position-relative bg-light rounded overflow-hidden"
                                                                style={{
                                                                    paddingBottom: "100%",
                                                                    border: "1px solid #dee2e6",
                                                                    transition: "all 0.2s ease",
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                                                                    e.currentTarget.style.transform = "scale(1.05)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.boxShadow = "none";
                                                                    e.currentTarget.style.transform = "scale(1)";
                                                                }}
                                                            >
                                                                <img
                                                                    src={file.fileUrl}
                                                                    alt={file.fileName}
                                                                    className="position-absolute top-0 start-0 w-100 h-100"
                                                                    style={{ objectFit: "cover" }}
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = "none";
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={() => handleFileClick(file)}
                                                                className="bg-light rounded d-flex align-items-center justify-content-center p-2 border"
                                                                style={{
                                                                    minHeight: "80px",
                                                                    cursor: "pointer",
                                                                    transition: "all 0.2s ease",
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                                                                    e.currentTarget.style.backgroundColor = "#e9ecef";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.boxShadow = "none";
                                                                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                                                                }}
                                                            >
                                                                <FileText size={20} className="text-muted" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* File List with Details */}
                                        <div className="d-flex flex-column gap-1">
                                            {sign.files.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="d-flex align-items-center justify-content-between p-2 bg-light rounded small"
                                                >
                                                    <span className="d-flex align-items-center text-truncate flex-grow-1">
                                                        {isImage(file.fileType) ? (
                                                            <Image size={14} className="me-2 flex-shrink-0" />
                                                        ) : (
                                                            <FileText size={14} className="me-2 flex-shrink-0" />
                                                        )}
                                                        <span title={file.fileName} className="text-truncate">
                                                            {file.fileName}
                                                        </span>
                                                    </span>
                                                    <small className="text-muted ms-2 flex-shrink-0">
                                                        ({formatFileSize(file.fileSize)})
                                                    </small>
                                                    <div className="d-flex gap-1 ms-2 flex-shrink-0">
                                                        <button
                                                            className="btn btn-sm btn-link p-0"
                                                            onClick={() => handleFileClick(file)}
                                                            title={t("trafficSigns.view")}
                                                            style={{ color: "#0d6efd" }}
                                                        >
                                                            <Image size={14} />
                                                        </button>
                                                        <a
                                                            href={file.fileUrl}
                                                            download
                                                            className="btn btn-sm btn-link p-0"
                                                            title={t("trafficSigns.download")}
                                                            style={{ color: "#0d6efd" }}
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <Modal show={showFormModal} onHide={handleCloseFormModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {currentSign.id ? t("trafficSigns.editTitle") : t("trafficSigns.addTitle")}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">{t("trafficSigns.title_field")} *</Form.Label>
                        <Form.Control
                            value={currentSign.title || ""}
                            onChange={(e) => setCurrentSign({ ...currentSign, title: e.target.value })}
                            placeholder="e.g., Stop Sign"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">{t("trafficSigns.description_field")}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={currentSign.description || ""}
                            onChange={(e) => setCurrentSign({ ...currentSign, description: e.target.value })}
                            placeholder="Optional description..."
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">{t("trafficSigns.category")}</Form.Label>
                                <Form.Control
                                    value={currentSign.category || ""}
                                    onChange={(e) => setCurrentSign({ ...currentSign, category: e.target.value })}
                                    placeholder="e.g., warning, mandatory"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">{t("trafficSigns.code")}</Form.Label>
                                <Form.Control
                                    value={currentSign.code || ""}
                                    onChange={(e) => setCurrentSign({ ...currentSign, code: e.target.value })}
                                    placeholder="e.g., B1"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseFormModal}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveSign}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                {t("common.save")}
                            </>
                        ) : (
                            t("common.save")
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{t("trafficSigns.deleteTitle")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{t("trafficSigns.deleteDesc")}</p>
                    <Alert variant="warning">
                        <small>{t("trafficSigns.deleteWarning")}</small>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmDelete}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                {t("trafficSigns.delete")}
                            </>
                        ) : (
                            t("trafficSigns.delete")
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Upload Modal */}
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{t("trafficSigns.uploadTitle")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentSign.id && (
                        <TrafficSignFileUpload
                            trafficSignId={currentSign.id}
                            existingFiles={currentSign.files}
                            onFileUploaded={(file) => {
                                if (currentSign.id) {
                                    setCurrentSign({
                                        ...currentSign,
                                        files: [...(currentSign.files || []), file],
                                    });
                                    // Also update in signs list
                                    setSigns(
                                        signs.map((s) =>
                                            s.id === currentSign.id
                                                ? { ...s, files: [...s.files, file] }
                                                : s
                                        )
                                    );
                                }
                            }}
                            onFileDeleted={(fileId) => {
                                if (currentSign.id) {
                                    const updatedFiles = currentSign.files?.filter((f) => f.id !== fileId) || [];
                                    setCurrentSign({
                                        ...currentSign,
                                        files: updatedFiles,
                                    });
                                    // Also update in signs list
                                    setSigns(
                                        signs.map((s) =>
                                            s.id === currentSign.id
                                                ? { ...s, files: updatedFiles }
                                                : s
                                        )
                                    );
                                }
                            }}
                        />
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowUploadModal(false)}
                    >
                        {t("common.close")}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Image Viewer Modal */}
            {viewerState.type === 'image' && (
                <ImageViewer
                    isOpen={viewerState.isOpen}
                    imageSrc={viewerState.fileUrl}
                    fileName={viewerState.fileName}
                    onClose={closeViewers}
                />
            )}

            {/* PDF Viewer Modal */}
            {viewerState.type === 'pdf' && (
                <PDFViewer
                    isOpen={viewerState.isOpen}
                    pdfUrl={viewerState.fileUrl}
                    fileName={viewerState.fileName}
                    onClose={closeViewers}
                />
            )}
        </div>
    );
}
