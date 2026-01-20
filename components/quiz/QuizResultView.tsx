"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import QuizImage from "@/components/quiz/QuizImage";

interface QuestionResult {
    id: string;
    text: string;
    image?: string;
    options: string[];
    correctAnswer: number;
    selectedAnswer: number | null;
    isCorrect: boolean;
    hasAnswer: boolean;
}

interface ResultData {
    score: number;
    total: number;
    passed: boolean;
    questions?: QuestionResult[];
}

interface QuizResultViewProps {
    result: ResultData;
    onBack: () => void;
}

export default function QuizResultView({ result, onBack }: QuizResultViewProps) {
    const { t, language } = useLanguage();
    const [activeQuestion, setActiveQuestion] = useState(0);

    const getOptionLabel = (index: number) => {
        if (language === "ar") {
            const arabicLetters = ["أ", "ب", "ج", "د", "ه", "و"];
            return arabicLetters[index] || String.fromCharCode(65 + index);
        }
        return String.fromCharCode(65 + index);
    };

    const scrollToQuestion = (index: number) => {
        const element = document.getElementById(`question-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            setActiveQuestion(index);
        }
    };

    // Optional: Add scroll listener to update active question (ScrollSpy)
    // For simplicity MVP, we just rely on click setting active, 
    // but a real scroll spy would be nicer. Let's keep it simple for now or add a basic one.
    useEffect(() => {
        const handleScroll = () => {
            // Basic logic to find which question is in view
            // This can be performance intensive if not debounced, but for 30 items it's okay
            // We'll skip complex scroll spy for now to ensure stability, 
            // relying on click to navigate.
        };
        // window.addEventListener("scroll", handleScroll);
        // return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            {/* Sticky Navigation Bar */}
            <div
                className="sticky-top bg-white border-bottom shadow-sm z-3"
                style={{ top: 0, overflowX: "auto", whiteSpace: "nowrap" }}
            >
                <div className="container-fluid py-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <h5 className="mb-0 fw-bold">{t("quiz.review", "Révision")}</h5>
                        <div className="badge bg-dark rounded-pill px-3">
                            {result.score}/{result.total}
                        </div>
                    </div>
                    <div className="d-flex gap-2 pb-1" style={{ overflowX: "auto" }}>
                        {(result.questions || []).map((q, idx) => {
                            let btnClass = "btn btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold ";
                            if (q.isCorrect) btnClass += "btn-success text-white";
                            else if (!q.hasAnswer) btnClass += "btn-warning text-dark"; // Unanswered
                            else btnClass += "btn-danger text-white"; // Incorrect

                            // Highlight active
                            const isActive = activeQuestion === idx;
                            const borderStyle = isActive ? "3px solid #000" : "none";

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => scrollToQuestion(idx)}
                                    className={btnClass}
                                    style={{ width: "40px", height: "40px", border: borderStyle, transition: "all 0.2s" }}
                                    aria-label={`Question ${idx + 1}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-fluid py-4 flex-grow-1">
                <div className="row g-4 justify-content-center">
                    <div className="col-12 col-lg-8">

                        {/* Summary Card */}
                        <div className="card border-0 shadow-sm rounded-4 mb-4 text-center">
                            <div className="card-body p-4">
                                <h2 className="mb-3">
                                    {result.passed
                                        ? <span className="text-success">🎉 {t("quiz.success", "Félicitations!")}</span>
                                        : <span className="text-danger">😕 {t("quiz.fail", "Échec")}</span>
                                    }
                                </h2>
                                <p className="lead mb-4">
                                    {t("quiz.scoreMessage", "Vous avez obtenu")} <strong>{result.score}</strong> {t("common.outOf", "sur")} <strong>{result.total}</strong>
                                </p>
                                <button onClick={onBack} className="btn btn-outline-primary px-4 rounded-pill">
                                    {t("quiz.back", "Retour au Dashboard")}
                                </button>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="d-flex flex-column gap-4">
                            {(result.questions || []).map((question, index) => (
                                <div
                                    key={question.id}
                                    id={`question-${index}`}
                                    className={`card border-0 shadow-sm rounded-4 scroll-mt-5 ${activeQuestion === index ? 'ring-2 ring-primary' : ''}`}
                                    style={{ scrollMarginTop: "140px" }}
                                >
                                    <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                                        <span className="badge bg-secondary rounded-pill px-3 py-2">Question {index + 1}</span>
                                        <div>
                                            {question.isCorrect ? (
                                                <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                                                    <span className="me-1">✓</span> Correct
                                                </span>
                                            ) : !question.hasAnswer ? (
                                                <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill">
                                                    <span className="me-1">⚠</span> Non répondue
                                                </span>
                                            ) : (
                                                <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">
                                                    <span className="me-1">✗</span> Incorrect
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="card-body p-4 pt-0">
                                        <h5 className="fw-bold mb-3">{question.text}</h5>

                                        {question.image && (
                                            <div className="mb-4">
                                                <QuizImage
                                                    src={question.image}
                                                    alt={`Question ${index + 1}`}
                                                    className="rounded-3 border bg-dark bg-opacity-10"
                                                    style={{ height: "250px", width: "100%", maxHeight: "300px" }}
                                                />
                                            </div>
                                        )}

                                        <div className="d-flex flex-column gap-2">
                                            {question.options.map((option, optIdx) => {
                                                const isCorrect = optIdx === question.correctAnswer;
                                                const isSelected = question.selectedAnswer === optIdx;
                                                const isSelectedWrong = isSelected && !isCorrect;

                                                let baseClass = "p-3 rounded-3 border d-flex align-items-center gap-3 transition-all ";
                                                if (isCorrect) baseClass += "bg-success bg-opacity-10 border-success text-success fw-semibold";
                                                else if (isSelectedWrong) baseClass += "bg-danger bg-opacity-10 border-danger text-danger";
                                                else baseClass += "bg-light border-light text-muted opacity-75";

                                                // Option letter color
                                                const letterColors = ["#dc3545", "#ffc107", "#198754", "#0dcaf0"]; // Red, Yellow, Green
                                                const letterColor = letterColors[optIdx] || "#6c757d";
                                                const letterTextColor = optIdx === 1 ? "#000" : "#fff"; // Black text for yellow

                                                return (
                                                    <div key={optIdx} className={baseClass}>
                                                        <div
                                                            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold shadow-sm"
                                                            style={{
                                                                width: "32px",
                                                                height: "32px",
                                                                backgroundColor: letterColor,
                                                                color: letterTextColor,
                                                                fontSize: "0.9rem"
                                                            }}
                                                        >
                                                            {getOptionLabel(optIdx)}
                                                        </div>
                                                        <div className="flex-grow-1">{option}</div>
                                                        {isCorrect && <span className="badge bg-success rounded-pill">Correct</span>}
                                                        {isSelectedWrong && <span className="badge bg-danger rounded-pill">Votre choix</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
