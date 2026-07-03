"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Download, FileText, Image as ImageIcon, AlertCircle, Loader } from "lucide-react";
import { Card, Container, Row, Col, Badge, Button, Spinner, Alert } from "react-bootstrap";
import { useLanguage } from "@/components/LanguageProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TrafficSignsManagement from "@/app/dashboard/manager/traffic-signs/page";
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

export default function TrafficSignsList() {
    const { t } = useLanguage();
    const { data: session } = useSession();
    const [signs, setSigns] = useState<TrafficSign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    // If user is Admin or Manager, show management page instead
    if (session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") {
        return <TrafficSignsManagement />;
    }

    useEffect(() => {
        fetchTrafficSigns();
    }, []);

    const fetchTrafficSigns = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/traffic-signs");

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            setSigns(data || []);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            setError(errorMsg);
            console.error("Error fetching traffic signs:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const isImage = (fileType: string): boolean => {
        return fileType.startsWith("image/");
    };

    const isPDF = (fileType: string): boolean => {
        return fileType === "application/pdf";
    };

    const getFileIcon = (fileType: string) => {
        return isImage(fileType) ? (
            <ImageIcon size={16} className="me-2" />
        ) : (
            <FileText size={16} className="me-2" />
        );
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

    if (loading) {
        return (
            <Container className="py-5">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                    <div className="text-center">
                        <Spinner animation="border" className="mb-3" />
                        <p>{t("trafficSigns.loading")}</p>
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            {/* Header */}
            <div className="mb-4">
                <h1 className="h3 fw-bold mb-2">{t("trafficSigns.title")}</h1>
                <p className="text-muted">{t("trafficSigns.description")}</p>
            </div>

            {/* Error Message */}
            {error && (
                <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
                    <AlertCircle size={18} className="me-2" />
                    {t("trafficSigns.error")}: {error}
                </Alert>
            )}

            {/* No Data Message */}
            {!loading && signs.length === 0 && (
                <Alert variant="info" className="text-center py-5">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="mb-0">{t("trafficSigns.noData")}</p>
                </Alert>
            )}

            {/* Traffic Signs Grid */}
            <Row className="g-4">
                {signs.map((sign) => (
                    <Col key={sign.id} md={6} lg={4} className="d-flex">
                        <Card className="w-100 h-100 shadow-sm hover-shadow" style={{ transition: "all 0.3s ease" }}>
                            {/* Card Header with Category Badge */}
                            <Card.Header className="bg-light border-0 d-flex justify-content-between align-items-start">
                                {sign.category && (
                                    <Badge bg="primary" className="me-2">
                                        {sign.category}
                                    </Badge>
                                )}
                                {sign.code && <Badge bg="secondary">{sign.code}</Badge>}
                            </Card.Header>

                            {/* Card Body */}
                            <Card.Body>
                                <h5 className="card-title fw-bold">{sign.title}</h5>
                                {sign.description && (
                                    <p className="card-text text-muted small mb-3 text-truncate">
                                        {sign.description}
                                    </p>
                                )}

                                {/* Files Section */}
                                {sign.files && sign.files.length > 0 ? (
                                    <div>
                                        <small className="d-block fw-bold text-secondary mb-3">
                                            {t("trafficSigns.files")} ({sign.files.length})
                                        </small>

                                        {/* Thumbnail Gallery */}
                                        <div className="mb-3">
                                            <div className="d-flex flex-wrap gap-2">
                                                {sign.files.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="position-relative"
                                                        style={{
                                                            flex: "0 0 calc(50% - 8px)",
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
                                                                    e.currentTarget.style.transform = "scale(1.02)";
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
                                                                className="bg-light rounded d-flex align-items-center justify-content-center p-3 border"
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
                                                                <FileText size={24} className="text-muted" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* File List with Details */}
                                        <small className="d-block fw-bold text-secondary mb-2">
                                            {t("trafficSigns.details")}
                                        </small>
                                        <div className="d-flex flex-column gap-2">
                                            {sign.files.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="d-flex align-items-center justify-content-between p-2 bg-light rounded small"
                                                >
                                                    <span className="d-flex align-items-center text-truncate">
                                                        {getFileIcon(file.fileType)}
                                                        <span title={file.fileName} className="text-truncate">
                                                            {file.fileName.substring(0, 20)}
                                                            {file.fileName.length > 20 ? "..." : ""}
                                                        </span>
                                                    </span>
                                                    <small className="text-muted ms-1">
                                                        ({formatFileSize(file.fileSize)})
                                                    </small>
                                                    <div className="d-flex gap-1 ms-2">
                                                        <button
                                                            className="btn btn-sm btn-link p-0"
                                                            onClick={() => handleFileClick(file)}
                                                            title={t("trafficSigns.view")}
                                                            style={{ color: "#0d6efd" }}
                                                        >
                                                            <ImageIcon size={14} />
                                                        </button>
                                                        <a
                                                            href={file.fileUrl}
                                                            download={file.fileName}
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
                                ) : (
                                    <small className="text-muted d-block">
                                        {t("trafficSigns.noFiles")}
                                    </small>
                                )}
                            </Card.Body>

                            {/* Card Footer with Meta Info */}
                            <Card.Footer className="bg-light border-0 small text-muted">
                                <div className="d-flex justify-content-between text-truncate">
                                    <span>
                                        {t("trafficSigns.createdBy")}: {sign.createdBy?.name || sign.createdBy?.email || "Unknown"}
                                    </span>
                                </div>
                                <div className="text-muted small mt-1">
                                    {new Date(sign.createdAt).toLocaleDateString()}
                                </div>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>

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
        </Container>
    );
}
