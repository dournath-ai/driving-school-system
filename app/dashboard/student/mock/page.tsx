"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import QuizImage from "@/components/quiz/QuizImage";
import QuizResultView from "@/components/quiz/QuizResultView";

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

export default function MockExamPage() {
    const { t, language } = useLanguage();
    const [quiz, setQuiz] = useState<QuizState | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageSettings, setPageSettings] = useState({
        questionsPerQuiz: 30,
        quizTimeLimit: 900,
        questionTimeLimit: 30
    });

    // Helper for option labels
    const getOptionLabel = (index: number) => {
        if (language === 'ar') {
            const arabicLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
            return arabicLetters[index] || String.fromCharCode(65 + index);
        }
        return String.fromCharCode(65 + index);
    };

    // Helper for option colors
    const getOptionColor = (index: number) => {
        switch (index) {
            case 0: return '#dc3545'; // Red (A/أ)
            case 1: return '#ffc107'; // Yellow (B/ب)
            case 2: return '#198754'; // Green (C/ج)
            default: return '#dc3545'; // Default to Red
        }
    };

    // Fetch settings on mount
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

    const startMockExam = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/quiz/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isMockExam: true })
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
            console.error("Failed to start mock exam", error);
            alert(t("mockExam.error", "Erreur lors du démarrage de l'examen blanc"));
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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (result) {
        return (
            <QuizResultView
                result={result}
                onBack={() => { setQuiz(null); setResult(null); }}
            />
        );
    }

    if (!quiz) {
        return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="dashboard-card p-5">
                            <div className="text-center mb-4">
                                <div className="traffic-icon mb-3">📝</div>
                                <h1 className="h2">{t("mockExam.title", "Examen Blanc")}</h1>
                                <p className="text-muted">
                                    {t("mockExam.subtitle", "Un test de 30 questions généré aléatoirement à partir de toutes les questions disponibles")}
                                </p>
                            </div>

                            <div className="alert alert-warning alert-tunisia mb-4">
                                <h5 className="alert-heading">{t("mockExam.instructions", "Instructions")}</h5>
                                <ul className="mb-0">
                                    <li>{t("mockExam.totalQuestions", "30 questions au total")}</li>
                                    <li>{t("mockExam.timeLimit", "{minutes} minutes de temps limite total").replace("{minutes}", Math.floor(pageSettings.quizTimeLimit / 60).toString())}</li>
                                    <li>{t("mockExam.questionTimeLimit", "{seconds} secondes par question (avance automatique)").replace("{seconds}", pageSettings.questionTimeLimit.toString())}</li>
                                    <li>{t("mockExam.passRate", "Vous devez obtenir 80% pour réussir")}</li>
                                </ul>
                            </div>

                            <button
                                onClick={startMockExam}
                                disabled={loading}
                                className="btn btn-tunisia btn-lg w-100"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t("mockExam.starting", "Démarrage...")}
                                    </>
                                ) : (
                                    t("mockExam.start", "🚀 Commencer l'Examen Blanc")
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[quiz.currentIndex];
    const currentAnswer = quiz.answers[currentQuestion.id];
    const progress = ((quiz.currentIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="container-fluid vh-100 p-0 d-flex flex-column bg-light" style={{ overflow: 'hidden' }}>
            {/* Header - Fixed Height */}
            <div className="quiz-header flex-shrink-0">
                <div className="quiz-timer">
                    <div className="timer-item">
                        <span>⏱️</span>
                        <span>{t("quiz.totalTime", "Total: {time}").replace("{time}", formatTime(quiz.timeRemaining))}</span>
                    </div>
                    <div className={`timer-item ${quiz.questionTimeRemaining <= 10 ? 'timer-warning' : ''}`}>
                        <span>⏰</span>
                        <span>{t("quiz.questionTime", "Question: {time}").replace("{time}", formatTime(quiz.questionTimeRemaining))}</span>
                    </div>
                </div>
                <div>
                    <strong>{t("quiz.question", "Question {current}/{total}").replace("{current}", (quiz.currentIndex + 1).toString()).replace("{total}", quiz.questions.length.toString())}</strong>
                </div>
            </div>

            {/* Progress Bar - Fixed Height */}
            <div className="quiz-progress flex-shrink-0">
                <div
                    className="quiz-progress-bar h-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Body - Flexible Height */}
            <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, overflowY: 'auto' }}>

                {/* Image Section - Takes all available space */}
                {currentQuestion.image ? (
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-dark bg-opacity-10" style={{ minHeight: '55vh' }}>
                        <QuizImage
                            src={currentQuestion.image}
                            alt="Question"
                            className="rounded-3"
                            priority={true}
                            style={{
                                maxHeight: '100%',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex-grow-1"></div>
                )}

                {/* Content Section - Bottom anchored if possible, or just below image */}
                <div className="flex-shrink-0 p-3 p-md-4 bg-white border-top shadow-sm">
                    {/* Question Text */}
                    <div className="text-center mb-3 mb-md-4">
                        <h4 className="fw-bold mb-0">{currentQuestion.text}</h4>
                    </div>

                    {/* Answers */}
                    <div className="row g-2 g-md-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        {currentQuestion.options.map((option, idx) => (
                            <div key={idx} className={currentQuestion.options.length <= 2 ? "col-12" : "col-12 col-md-6"}>
                                <div
                                    onClick={() => selectAnswer(idx)}
                                    className={`answer-option h-100 mb-0 py-2 py-md-3 ${currentAnswer === idx ? 'selected' : ''}`}
                                    style={{ minHeight: '60px' }}
                                >
                                    <div className="option-letter" style={{
                                        width: '30px',
                                        height: '30px',
                                        fontSize: '1rem',
                                        backgroundColor: getOptionColor(idx),
                                        color: idx === 1 ? '#000' : '#fff'
                                    }}>
                                        {getOptionLabel(idx)}
                                    </div>
                                    <div className="flex-grow-1 lh-sm">{option}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    {quiz.currentIndex === quiz.questions.length - 1 && currentAnswer !== undefined && (
                        <div className="mt-3">
                            <button
                                onClick={() => handleSubmit(quiz)}
                                className="btn btn-success btn-lg w-100"
                            >
                                {t("quiz.submit", "✅ Soumettre le Test")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
