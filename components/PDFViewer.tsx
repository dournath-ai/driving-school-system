"use client";

import { Modal, Button } from "react-bootstrap";
import { X, Download } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface PDFViewerProps {
    isOpen: boolean;
    pdfUrl: string;
    fileName: string;
    onClose: () => void;
}

export default function PDFViewer({ isOpen, pdfUrl, fileName, onClose }: PDFViewerProps) {
    const { t } = useLanguage();

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal show={isOpen} onHide={onClose} size="xl" centered className="pdf-viewer-modal">
            <Modal.Header className="bg-dark text-white border-0 d-flex justify-content-between align-items-center">
                <Modal.Title className="text-truncate">{fileName}</Modal.Title>
                <div className="d-flex gap-2">
                    <Button
                        variant="link"
                        size="sm"
                        className="text-white p-0"
                        onClick={handleDownload}
                        title={t("viewer.download") || "Download"}
                    >
                        <Download size={18} />
                    </Button>
                    <Button
                        variant="link"
                        size="sm"
                        className="text-white p-0"
                        onClick={onClose}
                        title={t("viewer.close") || "Close"}
                    >
                        <X size={18} />
                    </Button>
                </div>
            </Modal.Header>

            <Modal.Body className="bg-light p-0" style={{ minHeight: "600px" }}>
                <iframe
                    src={pdfUrl}
                    width="100%"
                    height="600"
                    style={{ border: "none", display: "block" }}
                    title={fileName}
                />
            </Modal.Body>

            <Modal.Footer className="bg-light">
                <small className="text-muted">
                    {t("viewer.pdfHint") || "PDF viewer is embedded. Use your browser's PDF controls or download for better viewing."}
                </small>
                <Button variant="secondary" onClick={onClose}>
                    {t("common.close") || "Close"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
