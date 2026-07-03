"use client";

import { useState, useRef, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface ImageViewerProps {
    isOpen: boolean;
    imageSrc: string;
    fileName: string;
    onClose: () => void;
}

export default function ImageViewer({ isOpen, imageSrc, fileName, onClose }: ImageViewerProps) {
    const { t } = useLanguage();
    const [zoom, setZoom] = useState(100);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const maxZoom = 300;
    const minZoom = 50;
    const zoomStep = 10;

    useEffect(() => {
        // Reset zoom and pan when modal opens
        if (isOpen) {
            setZoom(100);
            setPan({ x: 0, y: 0 });
        }
    }, [isOpen]);

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + zoomStep, maxZoom));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - zoomStep, minZoom));
    };

    const handleReset = () => {
        setZoom(100);
        setPan({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (zoom === 100) return; // Don't pan when zoomed out to fit
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPan({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.deltaY > 0) {
            handleZoomOut();
        } else {
            handleZoomIn();
        }
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = imageSrc;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFullscreen = () => {
        if (!imageRef.current) return;
        const elem = containerRef.current as HTMLDivElement & {
            requestFullscreen?: () => Promise<void>;
            webkitRequestFullscreen?: () => Promise<void>;
            mozRequestFullScreen?: () => Promise<void>;
            msRequestFullscreen?: () => Promise<void>;
        };
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        setIsFullscreen(true);
    };

    return (
        <Modal show={isOpen} onHide={onClose} size="xl" centered className="image-viewer-modal">
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
                        onClick={handleFullscreen}
                        title={t("viewer.fullscreen") || "Fullscreen"}
                    >
                        <Maximize2 size={18} />
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

            <Modal.Body
                ref={containerRef}
                className="bg-light p-0 d-flex flex-column position-relative"
                style={{ minHeight: "500px" }}
            >
                {/* Toolbar */}
                <div className="bg-white border-bottom p-2 d-flex gap-2 flex-wrap justify-content-center">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleZoomIn}
                        title={t("viewer.zoomIn") || "Zoom In"}
                    >
                        <ZoomIn size={16} className="me-1" />
                        {t("viewer.zoomIn") || "Zoom In"}
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleZoomOut}
                        title={t("viewer.zoomOut") || "Zoom Out"}
                    >
                        <ZoomOut size={16} className="me-1" />
                        {t("viewer.zoomOut") || "Zoom Out"}
                    </Button>
                    <span className="d-flex align-items-center px-2 bg-light rounded">
                        {zoom}%
                    </span>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleReset}
                        title={t("viewer.reset") || "Reset"}
                    >
                        <RotateCcw size={16} className="me-1" />
                        {t("viewer.reset") || "Reset"}
                    </Button>
                </div>

                {/* Image Container */}
                <div
                    ref={containerRef}
                    className="flex-grow-1 d-flex align-items-center justify-content-center overflow-hidden bg-light"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    style={{
                        cursor: isDragging ? "grabbing" : zoom > 100 ? "grab" : "default",
                        userSelect: "none",
                    }}
                >
                    <img
                        ref={imageRef}
                        src={imageSrc}
                        alt={fileName}
                        style={{
                            transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
                            transition: isDragging ? "none" : "transform 0.2s ease",
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                        }}
                    />
                </div>

                {/* Info Footer */}
                <div className="bg-white border-top p-2 small text-muted text-center">
                    {t("viewer.dragToMove") || "Use mouse wheel to zoom or drag to pan"}
                </div>
            </Modal.Body>
        </Modal>
    );
}
