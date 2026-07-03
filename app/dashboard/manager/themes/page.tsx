"use client";

import { useState, useEffect } from "react";
import {
    Plus, Trash2, Edit, Search, AlertCircle, Image as ImageIcon,
    CheckCircle, HelpCircle, PlusCircle, MinusCircle, ArrowLeft, BookOpen
} from "lucide-react";
import { Modal, Button, Form, Badge, InputGroup, Spinner, Alert, Card, Row, Col } from "react-bootstrap";
import { useLanguage } from "@/components/LanguageProvider";

type Theme = {
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
    _count?: { questions: number };
};

type Question = {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    image?: string | null;
    themeId?: string | null;
};

export default function ThemesManager() {
    const { t } = useLanguage();
    const [themes, setThemes] = useState<Theme[]>([]);
    const [loadingThemes, setLoadingThemes] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [search, setSearch] = useState("");
    const [questionSearch, setQuestionSearch] = useState("");

    const [message, setMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);

    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showDeleteThemeModal, setShowDeleteThemeModal] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<Partial<Theme>>({ name: "", description: "", image: null });
    const [selectedThemeImage, setSelectedThemeImage] = useState<File | null>(null);
    const [themeImagePreview, setThemeImagePreview] = useState<string | null>(null);
    const [uploadingThemeImage, setUploadingThemeImage] = useState(false);

    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showDeleteQuestionModal, setShowDeleteQuestionModal] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
        text: "",
        options: ["", "", ""],
        correctAnswer: 0,
        image: null
    });
    const [numberOfOptions, setNumberOfOptions] = useState(3);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => { fetchThemes(); }, []);

    const fetchThemes = async () => {
        setLoadingThemes(true);
        try {
            const res = await fetch("/api/themes");
            const data = await res.json();
            if (!res.ok || data?.error) throw new Error(data?.error || t("themes.error", "Erreur"));
            setThemes(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setThemes([]);
            setMessage({ text: err.message, type: "danger" });
        } finally {
            setLoadingThemes(false);
        }
    };

    const fetchQuestions = async (themeId: string) => {
        setLoadingQuestions(true);
        try {
            const res = await fetch(`/api/questions?themeId=${themeId}`);
            const data = await res.json();
            if (!res.ok || data?.error) throw new Error(data?.error || t("themes.error", "Erreur"));
            setQuestions(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setQuestions([]);
            setMessage({ text: err.message, type: "danger" });
        } finally {
            setLoadingQuestions(false);
        }
    };

    const handleOpenThemeModal = (theme?: Theme) => {
        if (theme) {
            setCurrentTheme({ ...theme });
            setThemeImagePreview(theme.image || null);
            setSelectedThemeImage(null);
        } else {
            setCurrentTheme({ name: "", description: "", image: null });
            setThemeImagePreview(null);
            setSelectedThemeImage(null);
        }
        setShowThemeModal(true);
    };

    const handleThemeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedThemeImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setThemeImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleThemeImageUpload = async (themeId: string): Promise<string | null> => {
        if (!selectedThemeImage) return null;
        setUploadingThemeImage(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedThemeImage);
            formData.append("themeId", themeId);
            const res = await fetch("/api/themes/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok && data.path) return data.path;
            throw new Error(data.error || "Upload failed");
        } catch {
            return null;
        } finally {
            setUploadingThemeImage(false);
        }
    };

    const handleSaveTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTheme.name?.trim()) return;
        setSubmitting(true);
        setMessage(null);
        try {
            let imagePath = currentTheme.image || null;

            if (selectedThemeImage) {
                if (!currentTheme.id) {
                    const createRes = await fetch("/api/themes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: currentTheme.name,
                            description: currentTheme.description || null
                        })
                    });
                    if (!createRes.ok) {
                        const err = await createRes.json();
                        throw new Error(err.error || t("themes.error", "Erreur"));
                    }
                    const newTheme = await createRes.json();
                    currentTheme.id = newTheme.id;
                    imagePath = await handleThemeImageUpload(newTheme.id);
                } else {
                    imagePath = await handleThemeImageUpload(currentTheme.id);
                }
            }

            const method = currentTheme.id ? "PATCH" : "POST";
            const res = await fetch("/api/themes", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentTheme,
                    image: imagePath
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({
                    text: currentTheme.id ? t("themes.updated", "Thème mis à jour!") : t("themes.added", "Thème ajouté!"),
                    type: "success"
                });
                setShowThemeModal(false);
                setSelectedThemeImage(null);
                fetchThemes();
            } else {
                throw new Error(data.error || t("themes.error", "Erreur"));
            }
        } catch (err: any) {
            setMessage({ text: err.message, type: "danger" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTheme = async () => {
        if (!currentTheme.id) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/themes?id=${currentTheme.id}`, { method: "DELETE" });
            if (res.ok) {
                setMessage({ text: t("themes.deleted", "Thème supprimé!"), type: "success" });
                setShowDeleteThemeModal(false);
                if (selectedTheme?.id === currentTheme.id) {
                    setSelectedTheme(null);
                    setQuestions([]);
                }
                fetchThemes();
            } else {
                const data = await res.json();
                throw new Error(data.error || t("themes.error", "Erreur"));
            }
        } catch (err: any) {
            setMessage({ text: err.message, type: "danger" });
        } finally {
            setSubmitting(false);
        }
    };

    const openThemeQuestions = (theme: Theme) => {
        setSelectedTheme(theme);
        setQuestionSearch("");
        fetchQuestions(theme.id);
    };

    const handleOpenQuestionModal = (q?: Question) => {
        if (q) {
            setCurrentQuestion({ ...q });
            setNumberOfOptions(q.options.length);
            setImagePreview(q.image || null);
            setSelectedImage(null);
        } else {
            setCurrentQuestion({ text: "", options: ["", "", ""], correctAnswer: 0, image: null });
            setNumberOfOptions(3);
            setImagePreview(null);
            setSelectedImage(null);
        }
        setShowQuestionModal(true);
    };

    const handleNumberOfOptionsChange = (newNumber: number) => {
        if (newNumber < 2 || newNumber > 6) return;
        setNumberOfOptions(newNumber);
        const currentOptions = currentQuestion.options || [];
        const newOptions = [...currentOptions];
        while (newOptions.length < newNumber) newOptions.push("");
        while (newOptions.length > newNumber) newOptions.pop();
        let correctAnswer = currentQuestion.correctAnswer || 0;
        if (correctAnswer >= newNumber) correctAnswer = 0;
        setCurrentQuestion({ ...currentQuestion, options: newOptions, correctAnswer });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = async (questionId: string): Promise<string | null> => {
        if (!selectedImage) return null;
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedImage);
            formData.append("questionId", questionId);
            const res = await fetch("/api/questions/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok && data.path) return data.path;
            throw new Error(data.error || "Upload failed");
        } catch {
            return null;
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTheme || !currentQuestion.text?.trim()) return;
        const hasEmptyOptions = currentQuestion.options?.some(opt => !opt.trim());
        if (hasEmptyOptions) {
            setMessage({ text: t("questions.emptyOptions", "Veuillez remplir toutes les options"), type: "danger" });
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            let imagePath = currentQuestion.image || null;

            if (selectedImage) {
                if (!currentQuestion.id) {
                    const createRes = await fetch("/api/questions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            text: currentQuestion.text,
                            options: currentQuestion.options,
                            correctAnswer: currentQuestion.correctAnswer,
                            themeId: selectedTheme.id,
                            series: null
                        })
                    });
                    if (!createRes.ok) {
                        const err = await createRes.json();
                        throw new Error(err.error || t("questions.error", "Erreur"));
                    }
                    const newQuestion = await createRes.json();
                    currentQuestion.id = newQuestion.id;
                    imagePath = await handleImageUpload(newQuestion.id);
                } else {
                    imagePath = await handleImageUpload(currentQuestion.id);
                }
            }

            const method = currentQuestion.id ? "PATCH" : "POST";
            const res = await fetch("/api/questions", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentQuestion,
                    themeId: selectedTheme.id,
                    series: null,
                    image: imagePath
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({
                    text: currentQuestion.id ? t("questions.updated", "Question mise à jour!") : t("questions.added", "Question ajoutée!"),
                    type: "success"
                });
                setShowQuestionModal(false);
                setSelectedImage(null);
                setImagePreview(null);
                fetchQuestions(selectedTheme.id);
                fetchThemes();
            } else {
                throw new Error(data.error || t("questions.error", "Erreur"));
            }
        } catch (err: any) {
            setMessage({ text: err.message, type: "danger" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteQuestion = async () => {
        if (!currentQuestion.id || !selectedTheme) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/questions?id=${currentQuestion.id}`, { method: "DELETE" });
            if (res.ok) {
                setMessage({ text: t("questions.deleted", "Question supprimée avec succès!"), type: "success" });
                setShowDeleteQuestionModal(false);
                fetchQuestions(selectedTheme.id);
                fetchThemes();
            } else {
                throw new Error(t("questions.error", "Erreur"));
            }
        } catch (err: any) {
            setMessage({ text: err.message, type: "danger" });
        } finally {
            setSubmitting(false);
        }
    };

    const updateOption = (idx: number, val: string) => {
        const newOptions = [...(currentQuestion.options || [])];
        newOptions[idx] = val;
        setCurrentQuestion({ ...currentQuestion, options: newOptions });
    };

    const filteredThemes = themes.filter(th =>
        th.name.toLowerCase().includes(search.toLowerCase()) ||
        (th.description || "").toLowerCase().includes(search.toLowerCase())
    );

    const filteredQuestions = questions.filter(q =>
        q.text.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.options.some(opt => opt.toLowerCase().includes(questionSearch.toLowerCase()))
    );

    if (selectedTheme) {
        return (
            <div className="container-fluid py-4">
                <div className="row mb-4 align-items-center">
                    <div className="col-md-8">
                        <Button variant="link" className="p-0 mb-2 text-decoration-none" onClick={() => { setSelectedTheme(null); setQuestions([]); }}>
                            <ArrowLeft size={18} className="me-1" />
                            {t("themes.backToThemes", "Retour aux thèmes")}
                        </Button>
                        <div className="d-flex align-items-center gap-3">
                            {selectedTheme.image ? (
                                <img src={selectedTheme.image} alt={selectedTheme.name} className="rounded-4 border" style={{ width: 64, height: 64, objectFit: "cover" }} />
                            ) : (
                                <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                                    <BookOpen size={28} className="text-primary" />
                                </div>
                            )}
                            <div>
                                <h1 className="h3 mb-1 fw-bold">{selectedTheme.name}</h1>
                                {selectedTheme.description && <p className="text-muted mb-0">{selectedTheme.description}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                        <Button className="btn-tunisia px-4 py-2 d-inline-flex align-items-center gap-2" onClick={() => handleOpenQuestionModal()}>
                            <Plus size={18} />
                            {t("themes.newQuestion", "Nouvelle Question")}
                        </Button>
                    </div>
                </div>

                {message && (
                    <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="mb-4">{message.text}</Alert>
                )}

                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body className="p-4">
                        <InputGroup>
                            <InputGroup.Text className="bg-white border-end-0"><Search size={18} className="text-muted" /></InputGroup.Text>
                            <Form.Control
                                placeholder={t("questions.search", "Rechercher une question ou une réponse...")}
                                className="border-start-0 shadow-none"
                                value={questionSearch}
                                onChange={(e) => setQuestionSearch(e.target.value)}
                            />
                        </InputGroup>
                    </Card.Body>
                </Card>

                {loadingQuestions ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                ) : filteredQuestions.length === 0 ? (
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="text-center py-5">
                            <AlertCircle size={48} className="text-muted mb-3 opacity-50" />
                            <h5 className="text-muted">{t("themes.noQuestions", "Aucune question dans ce thème")}</h5>
                        </Card.Body>
                    </Card>
                ) : (
                    <Row className="g-4">
                        {filteredQuestions.map((q) => (
                            <Col key={q.id} xs={12} lg={6}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
                                    <Card.Body className="p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="d-flex gap-3 align-items-start flex-grow-1">
                                                <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                                                    <HelpCircle size={24} className="text-primary" />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="mb-2 fw-bold">{q.text}</h5>
                                                    <Badge bg="light" className="text-dark border">{q.options.length} {t("questions.options", "options")}</Badge>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Button variant="outline-primary" size="sm" className="rounded-circle p-2" onClick={() => handleOpenQuestionModal(q)}>
                                                    <Edit size={16} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="rounded-circle p-2" onClick={() => { setCurrentQuestion(q); setShowDeleteQuestionModal(true); }}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                        {q.image && (
                                            <div className="mb-3">
                                                <img src={q.image} alt="Question" className="img-fluid rounded-3 border" style={{ maxHeight: "200px", objectFit: "contain" }} />
                                            </div>
                                        )}
                                        <div className="row g-2">
                                            {q.options.map((opt, idx) => (
                                                <div key={idx} className={q.options.length <= 2 ? "col-12" : "col-md-6"}>
                                                    <div className={`p-3 rounded-3 border-2 d-flex align-items-center gap-2 ${idx === q.correctAnswer ? "bg-success bg-opacity-10 border-success text-success fw-bold" : "bg-light border-light text-muted"}`}>
                                                        {idx === q.correctAnswer ? <CheckCircle size={18} /> : <span className="fw-bold">{String.fromCharCode(65 + idx)}</span>}
                                                        <span>{opt}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {renderQuestionModals()}
            </div>
        );
    }

    function renderQuestionModals() {
        return (
            <>
                <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} centered size="lg">
                    <Modal.Header closeButton className={currentQuestion.id ? "bg-primary text-white" : "bg-danger text-white"}>
                        <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                            {currentQuestion.id ? <Edit size={20} /> : <Plus size={20} />}
                            {currentQuestion.id ? t("questions.editTitle", "Modifier la Question") : t("questions.addTitle", "Ajouter une Question")}
                        </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSaveQuestion}>
                        <Modal.Body className="p-4">
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold fs-5">{t("questions.questionText", "Texte de la Question")}</Form.Label>
                                <Form.Control as="textarea" rows={3} required value={currentQuestion.text || ""} onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold d-flex align-items-center gap-2"><ImageIcon size={18} />{t("questions.image", "Image (optionnel)")}</Form.Label>
                                <Form.Control type="file" accept="image/*" onChange={handleImageSelect} className="mb-2" />
                                {imagePreview && <img src={imagePreview} alt="Preview" className="img-fluid rounded-3 border" style={{ maxHeight: "300px", objectFit: "contain" }} />}
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">{t("questions.options", "Options de Réponse")}</Form.Label>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleNumberOfOptionsChange(numberOfOptions - 1)} disabled={numberOfOptions <= 2} className="rounded-circle p-1"><MinusCircle size={18} /></Button>
                                    <Badge bg="primary" className="px-3 py-2 fs-6">{numberOfOptions}</Badge>
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleNumberOfOptionsChange(numberOfOptions + 1)} disabled={numberOfOptions >= 6} className="rounded-circle p-1"><PlusCircle size={18} /></Button>
                                </div>
                                <div className="row g-3">
                                    {currentQuestion.options?.map((opt, idx) => (
                                        <div key={idx} className={numberOfOptions <= 2 ? "col-12" : "col-md-6"}>
                                            <InputGroup className={currentQuestion.correctAnswer === idx ? "border border-success rounded-3 p-1" : ""}>
                                                <InputGroup.Text className="bg-white border-0">
                                                    <Form.Check type="radio" name="correctAnswer" checked={currentQuestion.correctAnswer === idx} onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: idx })} />
                                                    <span className="fw-bold ms-2">{String.fromCharCode(65 + idx)}</span>
                                                </InputGroup.Text>
                                                <Form.Control value={opt} required onChange={(e) => updateOption(idx, e.target.value)} />
                                            </InputGroup>
                                        </div>
                                    ))}
                                </div>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer className="bg-light border-0 p-4 pt-0">
                            <Button variant="light" onClick={() => setShowQuestionModal(false)}>{t("common.cancel", "Annuler")}</Button>
                            <Button variant={currentQuestion.id ? "primary" : "danger"} type="submit" disabled={submitting || uploadingImage}>
                                {(submitting || uploadingImage) ? <Spinner size="sm" /> : t("common.save", "Sauvegarder")}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                <Modal show={showDeleteQuestionModal} onHide={() => setShowDeleteQuestionModal(false)} centered>
                    <Modal.Header closeButton className="bg-dark text-white">
                        <Modal.Title>{t("questions.deleteTitle", "Confirmer la Suppression")}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4 text-center">
                        <Trash2 size={48} className="text-danger mb-3" />
                        <p className="text-muted">{t("questions.deleteDesc", "Voulez-vous vraiment supprimer cette question ?")}</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowDeleteQuestionModal(false)}>{t("common.cancel", "Annuler")}</Button>
                        <Button variant="danger" onClick={handleDeleteQuestion} disabled={submitting}>{submitting ? <Spinner size="sm" /> : t("common.delete", "Supprimer")}</Button>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                            <BookOpen size={28} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="h3 mb-1 fw-bold">{t("themes.title", "Quiz par Thème")}</h1>
                            <p className="text-muted mb-0">{t("themes.subtitle", "Gérez les quiz organisés par thématique")}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 text-md-end mt-3 mt-md-0">
                    <Button className="btn-tunisia px-4 py-2 d-inline-flex align-items-center gap-2" onClick={() => handleOpenThemeModal()}>
                        <Plus size={18} />
                        {t("themes.new", "Nouveau Thème")}
                    </Button>
                </div>
            </div>

            {message && (
                <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="mb-4">{message.text}</Alert>
            )}

            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body className="p-4">
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0"><Search size={18} className="text-muted" /></InputGroup.Text>
                        <Form.Control
                            placeholder={t("themes.search", "Rechercher un thème...")}
                            className="border-start-0 shadow-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            {loadingThemes ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : filteredThemes.length === 0 ? (
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="text-center py-5">
                        <AlertCircle size={48} className="text-muted mb-3 opacity-50" />
                        <h5 className="text-muted">{t("themes.notFound", "Aucun thème trouvé")}</h5>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-4">
                    {filteredThemes.map((th) => (
                        <Col key={th.id} xs={12} md={6} lg={4}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 theme-card" style={{ cursor: "pointer" }} onClick={() => openThemeQuestions(th)}>
                                {th.image ? (
                                    <div style={{ height: 160, overflow: "hidden" }}>
                                        <img src={th.image} alt={th.name} className="w-100 h-100" style={{ objectFit: "cover" }} />
                                    </div>
                                ) : (
                                    <div className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ height: 160 }}>
                                        <ImageIcon size={48} className="text-primary opacity-50" />
                                    </div>
                                )}
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="fw-bold mb-0">{th.name}</h5>
                                        <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="outline-primary" size="sm" className="rounded-circle p-2" onClick={() => handleOpenThemeModal(th)}>
                                                <Edit size={14} />
                                            </Button>
                                            <Button variant="outline-danger" size="sm" className="rounded-circle p-2" onClick={() => { setCurrentTheme(th); setShowDeleteThemeModal(true); }}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                    {th.description && <p className="text-muted small mb-2">{th.description}</p>}
                                    <Badge bg="primary">{th._count?.questions ?? 0} {t("quiz.questions", "questions")}</Badge>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal show={showThemeModal} onHide={() => setShowThemeModal(false)} centered size="lg">
                <Modal.Header closeButton className={currentTheme.id ? "bg-primary text-white" : "bg-danger text-white"}>
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        {currentTheme.id ? <Edit size={20} /> : <Plus size={20} />}
                        {currentTheme.id ? t("themes.editTitle", "Modifier le Thème") : t("themes.addTitle", "Nouveau Thème")}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveTheme}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">{t("themes.name", "Nom")}</Form.Label>
                            <Form.Control required value={currentTheme.name || ""} onChange={(e) => setCurrentTheme({ ...currentTheme, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">{t("themes.description", "Description (optionnel)")}</Form.Label>
                            <Form.Control as="textarea" rows={3} value={currentTheme.description || ""} onChange={(e) => setCurrentTheme({ ...currentTheme, description: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold d-flex align-items-center gap-2"><ImageIcon size={18} />{t("themes.image", "Image du thème")}</Form.Label>
                            <Form.Control type="file" accept="image/*" onChange={handleThemeImageSelect} className="mb-2" />
                            {themeImagePreview && (
                                <img src={themeImagePreview} alt="Preview" className="img-fluid rounded-3 border" style={{ maxHeight: "200px", objectFit: "contain" }} />
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="bg-light border-0 p-4 pt-0">
                        <Button variant="light" onClick={() => setShowThemeModal(false)}>{t("common.cancel", "Annuler")}</Button>
                        <Button variant={currentTheme.id ? "primary" : "danger"} type="submit" disabled={submitting || uploadingThemeImage}>
                            {(submitting || uploadingThemeImage) ? <Spinner size="sm" /> : t("common.save", "Sauvegarder")}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showDeleteThemeModal} onHide={() => setShowDeleteThemeModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white">
                    <Modal.Title>{t("themes.deleteTitle", "Confirmer la Suppression")}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 text-center">
                    <Trash2 size={48} className="text-danger mb-3" />
                    <p className="text-muted">{t("themes.deleteDesc", "Supprimer ce thème et toutes ses questions ?")}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowDeleteThemeModal(false)}>{t("common.cancel", "Annuler")}</Button>
                    <Button variant="danger" onClick={handleDeleteTheme} disabled={submitting}>{submitting ? <Spinner size="sm" /> : t("common.delete", "Supprimer")}</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
