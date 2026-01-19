"use client";

import { useState, useEffect } from "react";

interface QuizImageProps {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
    style?: React.CSSProperties;
}

export default function QuizImage({ src, alt, className = "", priority = false, style = {} }: QuizImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [optimizedSrc, setOptimizedSrc] = useState(src);

    useEffect(() => {
        if (!src) return;

        // Cloudinary optimization logic
        // If it's a cloudinary URL, inject optimization params
        let newSrc = src;
        if (src.includes("cloudinary.com") && !src.includes("f_auto")) {
            // Insert params after /upload/
            const parts = src.split("/upload/");
            if (parts.length === 2) {
                newSrc = `${parts[0]}/upload/f_auto,q_auto,w_800/${parts[1]}`;
            }
        }
        setOptimizedSrc(newSrc);
        setIsLoading(true);
        setError(false);
    }, [src]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setError(true);
    };

    if (error) {
        return (
            <div
                className={`d-flex align-items-center justify-content-center bg-light text-muted border rounded-3 ${className}`}
                style={{ ...style, minHeight: '200px' }}
            >
                <div className="text-center p-3">
                    <span style={{ fontSize: '2rem' }}>⚠️</span>
                    <p className="mb-0 small mt-2">Image non disponible</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`position-relative ${className}`} style={style}>
            {isLoading && (
                <div
                    className="position-absolute top-0 start-0 w-100 h-100 bg-secondary bg-opacity-10 rounded-3 placeholder-wave"
                    style={{ zIndex: 1 }}
                >
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                        <div className="spinner-border text-secondary opacity-25" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            )}

            <img
                src={optimizedSrc}
                alt={alt}
                className={`w-100 h-100 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                style={{
                    objectFit: 'contain',
                    transition: 'opacity 0.3s ease-in-out'
                }}
                onLoad={handleLoad}
                onError={handleError}
                loading={priority ? "eager" : "lazy"}
            />
        </div>
    );
}
