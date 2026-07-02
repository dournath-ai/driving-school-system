"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Image as ImageIcon, AlertCircle, Loader } from "lucide-react";
import { Card, Container, Row, Col, Badge, Button, Spinner, Alert } from "react-bootstrap";
import { useLanguage } from "@/components/LanguageProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TrafficSignsManagement from "@/app/dashboard/manager/traffic-signs/page";

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

    const getFileIcon = (fileType: string) => {
        return isImage(fileType) ? (
            <ImageIcon size={16} className="me-2" />
        ) : (
            <FileText size={16} className="me-2" />
        );
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
                                        <small className="d-block fw-bold text-secondary mb-2">
                                            {t("trafficSigns.files")} ({sign.files.length})
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
                                                    <a
                                                        href={file.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm btn-link p-0 ms-2"
                                                        title={t("trafficSigns.download")}
                                                    >
                                                        <Download size={14} />
                                                    </a>
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
        </Container>
    );
}
