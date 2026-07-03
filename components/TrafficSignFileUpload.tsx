"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, Loader } from "lucide-react";
import { Alert, Button, ProgressBar, Spinner } from "react-bootstrap";
import { useLanguage } from "./LanguageProvider";

type UploadedFile = {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
};

interface TrafficSignFileUploadProps {
    trafficSignId: string;
    onFileUploaded?: (file: UploadedFile) => void;
    onError?: (error: string) => void;
    existingFiles?: UploadedFile[];
    onFileDeleted?: (fileId: string) => void;
}

export default function TrafficSignFileUpload({
    trafficSignId,
    onFileUploaded,
    onError,
    existingFiles = [],
    onFileDeleted,
}: TrafficSignFileUploadProps) {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
    const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

    const ALLOWED_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "application/pdf",
    ];

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const isImage = (fileType: string): boolean => fileType.startsWith("image/");

    const getFileIcon = (fileType: string) => {
        return isImage(fileType) ? (
            <ImageIcon size={16} className="me-2" />
        ) : (
            <FileText size={16} className="me-2" />
        );
    };

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return t("trafficSigns.uploadError");
        }
        if (file.size > 10 * 1024 * 1024) {
            return t("trafficSigns.uploadError");
        }
        return null;
    };

    const handleFileSelect = async (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        const file = selectedFiles[0];
        const validationError = validateFile(file);

        if (validationError) {
            setError(validationError);
            onError?.(validationError);
            return;
        }

        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        try {
            setUploading(true);
            setError(null);
            setUploadProgress(0);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("trafficSignId", trafficSignId);

            // Simulate progress (real progress tracking would require XMLHttpRequest)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
            }, 200);

            const res = await fetch("/api/traffic-signs/upload", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || t("trafficSigns.uploadError"));
            }

            const data = await res.json();
            setUploadProgress(100);

            if (data.success && data.file) {
                setFiles([...files, data.file]);
                onFileUploaded?.(data.file);
                setUploadProgress(0);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : t("trafficSigns.uploadError");
            setError(errorMsg);
            onError?.(errorMsg);
            setUploadProgress(0);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!window.confirm(t("trafficSigns.deleteFileConfirm"))) return;

        try {
            setDeletingFileId(fileId);

            const res = await fetch(
                `/api/traffic-signs/${trafficSignId}/files/${fileId}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                throw new Error(t("trafficSigns.uploadError"));
            }

            setFiles(files.filter((f) => f.id !== fileId));
            onFileDeleted?.(fileId);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : t("trafficSigns.uploadError");
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setDeletingFileId(null);
        }
    };

    return (
        <div className="mb-4">
            {/* Error Message */}
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Upload Zone */}
            {!uploading && (
                <div
                    className="border-2 border-dashed rounded p-4 text-center mb-4 bg-light"
                    style={{ cursor: "pointer", borderColor: "#dee2e6" }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                        handleFileSelect(e.dataTransfer.files);
                    }}
                >
                    <Upload size={32} className="mx-auto mb-2 text-primary" />
                    <p className="mb-1 fw-bold">{t("trafficSigns.dragDrop")}</p>
                    <small className="text-muted d-block">{t("trafficSigns.acceptedFormats")}</small>
                    <small className="text-muted d-block">{t("trafficSigns.maxSize")}</small>
                    <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept={ALLOWED_TYPES.join(",")}
                        onChange={(e) => handleFileSelect(e.target.files)}
                        disabled={uploading}
                    />
                </div>
            )}

            {/* Upload Progress */}
            {uploading && (
                <div className="mb-4">
                    <div className="d-flex align-items-center mb-2">
                        <Spinner animation="border" size="sm" className="me-2" />
                        <span>{t("trafficSigns.upload")}</span>
                    </div>
                    <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                </div>
            )}

            {/* Existing Files List */}
            {files.length > 0 && (
                <div>
                    <h6 className="fw-bold mb-2">
                        {t("trafficSigns.files")} ({files.length})
                    </h6>
                    <div className="d-flex flex-column gap-2">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="d-flex align-items-center justify-content-between p-2 bg-light rounded"
                            >
                                <div className="d-flex align-items-center flex-grow-1 min-w-0">
                                    {getFileIcon(file.fileType)}
                                    <div className="min-w-0">
                                        <a
                                            href={file.fileUrl}
                                            download={file.fileName}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-truncate d-block text-decoration-none"
                                            title={file.fileName}
                                        >
                                            {file.fileName.substring(0, 30)}
                                            {file.fileName.length > 30 ? "..." : ""}
                                        </a>
                                        <small className="text-muted">
                                            {formatFileSize(file.fileSize)}
                                        </small>
                                    </div>
                                </div>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger ms-2 p-0"
                                    onClick={() => handleDeleteFile(file.id)}
                                    disabled={deletingFileId === file.id}
                                    title={t("trafficSigns.delete")}
                                >
                                    {deletingFileId === file.id ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        <X size={16} />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
