"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type Question = {
    id: string;
    text: string;
    options: string[];
    image?: string;
};

type QuizState = {
    attemptId: string;
    questions: Question[];
    currentIndex: number;
    answers: Record<string, number>;
    timeRemaining: number;
    questionTimeRemaining: number;
    isComplete: boolean;
    config: {
        questionTimeLimit: number;
        quizTimeLimit: number;
    };
};

type QuestionResult = {
    id: string;
    text: string;
    options: string[];
    image?: string;
    correctAnswer: number;
    selectedAnswer: number | null;
    isCorrect: boolean;
    hasAnswer: boolean;
};

type Result = {
    score: number;
    total: number;
    passed: boolean;
    questions?: QuestionResult[];
};

type Series = {
    series: number;
    completed: boolean;
    questionsCount: number;
};

export default function QuizPage() {
    const { t } = useLanguage();
    const [quiz, setQuiz] = useState<QuizState | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(false);
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [loadingSeries, setLoadingSeries] = useState(true);
    const [pageSettings, setPageSettings] = useState({
        questionsPerQuiz: 30,
        quizTimeLimit: 900,
        questionTimeLimit: 30
    });

    // Fetch series list on mount
    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const res = await fetch("/api/quiz/series");
                const data = await res.json();
                if (data && !data.error) {
                    setSeriesList(data.series || []);
                }
            } catch (error) {
                console.error("Failed to fetch series", error);
            } finally {
                setLoadingSeries(false);
            }
        };
        fetchSeries();
    }, []);

    // Fetch settings on mount for the instruction screen
    useEffect(() => {
        const fetchPageSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                const data = await res.json();
                if (data && !data.error) {
                    setPageSettings({
                        questionsPerQuiz: data.questionsPerQuiz || 30,
                        quizTimeLimit: data.quizTimeLimit || 900,
                        questionTimeLimit: data.questionTimeLimit || 30
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchPageSettings();
    }, []);

    // Timer for total quiz time
    useEffect(() => {
        if (!quiz || quiz.isComplete) return;

        const timer = setInterval(() => {
            setQuiz(prev => {
                if (!prev) return null;
                const newTime = prev.timeRemaining - 1;

                if (newTime <= 0) {
                    handleSubmit(prev);
                    return { ...prev, timeRemaining: 0, isComplete: true };
                }

                return { ...prev, timeRemaining: newTime };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz?.isComplete]);

    // Timer for per-question auto-advance
    useEffect(() => {
        if (!quiz || quiz.isComplete) return;

        const timer = setInterval(() => {
            setQuiz(prev => {
                if (!prev) return null;
                const newTime = prev.questionTimeRemaining - 1;

                if (newTime <= 0) {
                    if (prev.currentIndex < prev.questions.length - 1) {
                        return {
                            ...prev,
                            currentIndex: prev.currentIndex + 1,
                            questionTimeRemaining: prev.config.questionTimeLimit
                        };
                    } else {
                        handleSubmit(prev);
                        return { ...prev, isComplete: true };
                    }
                }

                return { ...prev, questionTimeRemaining: newTime };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz?.isComplete, quiz?.currentIndex]);

    const startQuiz = async (series: number) => {
        setLoading(true);
        try {
            const res = await fetch("/api/quiz/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ series })
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                return;
            }

            setQuiz({
                attemptId: data.attemptId,
                questions: data.questions,
                currentIndex: 0,
                answers: {},
                timeRemaining: data.settings.quizTimeLimit,
                questionTimeRemaining: data.settings.questionTimeLimit,
                isComplete: false,
                config: {
                    questionTimeLimit: data.settings.questionTimeLimit,
                    quizTimeLimit: data.settings.quizTimeLimit
                }
            });
        } catch (error) {
            console.error("Failed to start quiz", error);
            alert(t("quiz.error", "Erreur lors du démarrage du quiz"));
        } finally {
            setLoading(false);
        }
    };

    const selectAnswer = (optionIndex: number) => {
        if (!quiz) return;

        const currentQuestion = quiz.questions[quiz.currentIndex];
        setQuiz(prev => {
            if (!prev) return null;
            return {
                ...prev,
                answers: { ...prev.answers, [currentQuestion.id]: optionIndex }
            };
        });

        setTimeout(() => {
            setQuiz(prev => {
                if (!prev || prev.isComplete) return prev;
                if (prev.currentIndex < prev.questions.length - 1) {
                    return {
                        ...prev,
                        currentIndex: prev.currentIndex + 1,
                        questionTimeRemaining: prev.config.questionTimeLimit
                    };
                }
                return prev;
            });
        }, 500);
    };

    const handleSubmit = async (quizState: QuizState) => {
        try {
            const res = await fetch("/api/quiz/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attemptId: quizState.attemptId,
                    answers: quizState.answers,
                    questionIds: quizState.questions.map(q => q.id)
                })
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error("Failed to submit quiz", error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (result) {
        const percentage = Math.round((result.score / result.total) * 100);
        return (
            <div className="container-fluid py-4">
                {/* Summary Card */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className={`card border-0 shadow-sm rounded-4 ${result.passed ? 'border-success' : 'border-danger'}`}>
                            <div className="card-body p-5 text-center">
                                <div className={`mb-3 ${result.passed ? 'text-success' : 'text-danger'}`} style={{ fontSize: '4rem' }}>
                                    {result.passed ? '✅' : '❌'}
                                </div>

                                <h2 className="h3 mb-3 fw-bold">
                                    {result.passed ? t("quiz.congratulations", "Félicitations!") : t("quiz.continue", "Continuez vos efforts!")}
                                </h2>

                                <div className="d-flex justify-content-center align-items-baseline gap-3 mb-3">
                                    <div className="h1 fw-bold">{result.score}</div>
                                    <div className="text-muted fs-4">/</div>
                                    <div className="text-muted fs-4">{result.total}</div>
                                </div>

                                <div className="mb-4">
                                    <div className={`badge fs-5 px-4 py-2 ${result.passed ? 'bg-success' : 'bg-danger'}`}>
                                        {percentage}%
                                    </div>
                                </div>

                                {result.passed ? (
                                    <div className="alert alert-success d-inline-block">
                                        <strong>{t("quiz.success", "Vous avez réussi le quiz!")}</strong>
                                    </div>
                                ) : (
                                    <div className="alert alert-warning d-inline-block">
                                        <strong>{t("quiz.fail", "Vous devez obtenir au moins 80% pour réussir.")}</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Review */}
                {result.questions && result.questions.length > 0 && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-0 p-4">
                                    <h3 className="h5 mb-0 fw-bold d-flex align-items-center gap-2">
                                        <span>📋</span>
                                        {t("quiz.review", "Révision des Questions")}
                                    </h3>
                                </div>
                                <div className="card-body p-0">
                                    <div className="list-group list-group-flush">
                                        {result.questions.map((question, index) => (
                                            <div key={question.id} className="list-group-item border-0 border-bottom p-4">
                                                <div className="d-flex align-items-start gap-3 mb-3">
                                                    <div className={`badge ${question.isCorrect ? 'bg-success' : 'bg-danger'} d-flex align-items-center justify-content-center`} 
                                                         style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '0.875rem' }}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h5 className="fw-bold mb-2">{question.text}</h5>
                                                        {question.image && (
                                                            <img 
                                                                src={question.image} 
                                                                alt="Question" 
                                                                className="img-fluid rounded-3 border mb-3"
                                                                style={{ maxHeight: "200px", objectFit: "contain" }}
                                                            />
                                                        )}
                                                        <div className="row g-2 mt-2">
                                                            {question.options.map((option, optIdx) => {
                                                                const isCorrect = optIdx === question.correctAnswer;
                                                                const isSelected = question.selectedAnswer === optIdx;
                                                                const isSelectedWrong = isSelected && !isCorrect;
                                                                const notAnswered = !question.hasAnswer && isCorrect;

                                                                let className = "p-3 rounded-3 border-2 d-flex align-items-center gap-2 ";
                                                                if (isCorrect) {
                                                                    className += "bg-success bg-opacity-10 border-success text-success fw-bold";
                                                                } else if (isSelectedWrong) {
                                                                    className += "bg-danger bg-opacity-10 border-danger text-danger";
                                                                } else {
                                                                    className += "bg-light border-light text-muted";
                                                                }

                                                                return (
                                                                    <div key={optIdx} className={question.options.length <= 2 ? "col-12" : "col-md-6"}>
                                                                        <div className={className}>
                                                                            <div className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                                                                                {isCorrect && (
                                                                                    <span className="text-success fw-bold">✓</span>
                                                                                )}
                                                                                {isSelectedWrong && (
                                                                                    <span className="text-danger fw-bold">✗</span>
                                                                                )}
                                                                                {!isCorrect && !isSelected && (
                                                                                    <span className="text-muted fw-bold">{String.fromCharCode(65 + optIdx)}</span>
                                                                                )}
                                                                                {notAnswered && (
                                                                                    <span className="text-success fw-bold">✓</span>
                                                                                )}
                                                                            </div>
                                                                            <span className="flex-grow-1">
                                                                                <span className="me-2 fw-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                                                                {option}
                                                                            </span>
                                                                            {isCorrect && (
                                                                                <span className="badge bg-success">Correcte</span>
                                                                            )}
                                                                            {isSelectedWrong && (
                                                                                <span className="badge bg-danger">Votre réponse</span>
                                                                            )}
                                                                            {notAnswered && (
                                                                                <span className="badge bg-warning">Non répondue</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {!question.hasAnswer && (
                                                            <div className="alert alert-warning mt-3 mb-0">
                                                                <small>{t("quiz.notAnswered", "Cette question n'a pas été répondue.")}</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="row mt-4">
                    <div className="col-12 text-center">
                        <button
                            onClick={() => { setQuiz(null); setResult(null); }}
                            className="btn btn-tunisia btn-lg px-5"
                        >
                            {t("quiz.back", "Retour au Dashboard")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="container-fluid py-4">
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="text-center mb-4">
                            <h1 className="h2 fw-bold">{t("quiz.selectSeries", "Sélectionnez une Série")}</h1>
                            <p className="text-muted">
                                {t("quiz.selectSeriesDesc", "Choisissez une série de 30 questions pour commencer votre quiz")}
                            </p>
                        </div>
                    </div>
                </div>

                {loadingSeries ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t("common.loading", "Chargement...")}</span>
                        </div>
                    </div>
                ) : (
                    <div className="row g-3">
                        {seriesList.map((seriesItem) => (
                            <div key={seriesItem.series} className="col-md-4 col-lg-3">
                                <div
                                    className={`card border-2 h-100 transition-all ${
                                        seriesItem.completed
                                            ? "border-success bg-success bg-opacity-5"
                                            : "border-light hover-border-primary"
                                    } ${loading ? "opacity-50" : "cursor-pointer"}`}
                                    onClick={() => !loading && startQuiz(seriesItem.series)}
                                    style={{ cursor: loading ? "not-allowed" : "pointer" }}
                                >
                                    <div className="card-body p-4 text-center">
                                        <div className="mb-3">
                                            <div
                                                className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                                                    seriesItem.completed
                                                        ? "bg-success text-white"
                                                        : "bg-primary text-white"
                                                }`}
                                                style={{ width: "60px", height: "60px", fontSize: "1.5rem", fontWeight: "bold" }}
                                            >
                                                {seriesItem.completed ? "✓" : seriesItem.series}
                                            </div>
                                        </div>
                                        <h5 className="fw-bold mb-2">
                                            {t("quiz.series", "Série").replace("{number}", seriesItem.series.toString())} {seriesItem.series}
                                        </h5>
                                        <p className="text-muted small mb-2">
                                            {seriesItem.questionsCount} {t("quiz.questions", "questions")}
                                        </p>
                                        {seriesItem.completed && (
                                            <span className="badge bg-success">
                                                {t("quiz.completed", "Terminée")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const currentQuestion = quiz.questions[quiz.currentIndex];
    const currentAnswer = quiz.answers[currentQuestion.id];
    const progress = ((quiz.currentIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="quiz-container">
            <div className="quiz-card">
                {/* Header */}
                <div className="quiz-header">
                    <div className="quiz-timer">
                        <div className="timer-item">
                            <span>⏱️</span>
                            <span>{t("quiz.totalTime").replace("{time}", formatTime(quiz.timeRemaining))}</span>
                        </div>
                        <div className={`timer-item ${quiz.questionTimeRemaining <= 10 ? 'timer-warning' : ''}`}>
                            <span>⏰</span>
                            <span>{t("quiz.questionTime").replace("{time}", formatTime(quiz.questionTimeRemaining))}</span>
                        </div>
                    </div>
                    <div>
                        <strong>{t("quiz.question").replace("{current}", (quiz.currentIndex + 1).toString()).replace("{total}", quiz.questions.length.toString())}</strong>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="quiz-progress">
                    <div
                        className="quiz-progress-bar"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Body */}
                <div className="quiz-body">
                    <div className="question-text">
                        {currentQuestion.text}
                    </div>

                    {currentQuestion.image && (
                        <img src={currentQuestion.image} alt="Question" className="question-image" />
                    )}

                    <div>
                        {currentQuestion.options.map((option, idx) => (
                            <div
                                key={idx}
                                onClick={() => selectAnswer(idx)}
                                className={`answer-option ${currentAnswer === idx ? 'selected' : ''}`}
                            >
                                <div className="option-letter">
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <div className="flex-grow-1">{option}</div>
                            </div>
                        ))}
                    </div>

                    {quiz.currentIndex === quiz.questions.length - 1 && currentAnswer !== undefined && (
                        <button
                            onClick={() => handleSubmit(quiz)}
                            className="btn btn-success btn-lg w-100 mt-4"
                        >
                            {t("quiz.submit")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
