"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Search, HelpCircle, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, PlusCircle, MinusCircle } from "lucide-react";
import { Modal, Button, Form, Badge, InputGroup, Spinner, Alert, Card, Row, Col } from "react-bootstrap";
import { useLanguage } from "@/components/LanguageProvider";

type Question = {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    image?: string | null;
    series?: number;
};

export default function QuestionBank() {
    const { t } = useLanguage();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);

    const [selectedSeries, setSelectedSeries] = useState<number | 'all'>('all');

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
        text: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        image: null,
        series: 1
    });
    const [numberOfOptions, setNumberOfOptions] = useState(4);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch("/api/questions");
            const data = await res.json();
            if (Array.isArray(data)) {
                setQuestions(data);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (q?: Question) => {
        if (q) {
            setCurrentQuestion({ ...q });
            setNumberOfOptions(q.options.length);
            setImagePreview(q.image || null);
            setSelectedImage(null);
        } else {
            setCurrentQuestion({
                text: "",
                options: ["", "", ""],
                correctAnswer: 0,
                image: null,
                series: 1
            });
            setNumberOfOptions(3);
            setImagePreview(null);
            setSelectedImage(null);
        }
        setShowFormModal(true);
    };

    const handleNumberOfOptionsChange = (newNumber: number) => {
        if (newNumber < 2 || newNumber > 6) return;
        
        setNumberOfOptions(newNumber);
        const currentOptions = currentQuestion.options || [];
        const newOptions = [...currentOptions];
        
        // Adjust array size
        while (newOptions.length < newNumber) {
            newOptions.push("");
        }
        while (newOptions.length > newNumber) {
            newOptions.pop();
        }
        
        // Reset correct answer if it's out of bounds
        let correctAnswer = currentQuestion.correctAnswer || 0;
        if (correctAnswer >= newNumber) {
            correctAnswer = 0;
        }
        
        setCurrentQuestion({
            ...currentQuestion,
            options: newOptions,
            correctAnswer
        });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
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

            const res = await fetch("/api/questions/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.path) {
                return data.path;
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate that all options are filled
        const hasEmptyOptions = currentQuestion.options?.some(opt => !opt.trim());
        if (hasEmptyOptions) {
            setMessage({ text: t("questions.emptyOptions", "Veuillez remplir toutes les options"), type: 'danger' });
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
                            series: currentQuestion.series || 1
                        }),
                    });

                    if (!createRes.ok) {
                        const errorData = await createRes.json();
                        throw new Error(errorData.error || "Error creating question");
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
                    image: imagePath
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ text: currentQuestion.id ? t("questions.updated", "Question mise à jour!") : t("questions.added", "Question ajoutée!"), type: 'success' });
                setShowFormModal(false);
                setSelectedImage(null);
                setImagePreview(null);
                fetchQuestions();
            } else {
                setMessage({ text: data.error || t("questions.error", "Une erreur est survenue"), type: 'danger' });
            }
        } catch (error: any) {
            setMessage({ text: error.message || t("questions.error", "Erreur de connexion"), type: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/questions?id=${currentQuestion.id}`, { method: "DELETE" });
            if (res.ok) {
                setMessage({ text: t("questions.deleted", "Question supprimée avec succès!"), type: 'success' });
                setShowDeleteModal(false);
                fetchQuestions();
            } else {
                setMessage({ text: t("questions.error", "Erreur lors de la suppression"), type: 'danger' });
            }
        } catch (error) {
            setMessage({ text: t("questions.error", "Erreur de connexion"), type: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const updateOption = (idx: number, val: string) => {
        const newOptions = [...(currentQuestion.options || [])];
        newOptions[idx] = val;
        setCurrentQuestion({ ...currentQuestion, options: newOptions });
    };

    const filteredQuestions = questions.filter(q => {
        const matchSearch = q.text.toLowerCase().includes(search.toLowerCase()) ||
            q.options.some(opt => opt.toLowerCase().includes(search.toLowerCase()));
        
        const matchSeries = selectedSeries === 'all' || q.series === selectedSeries;

        return matchSearch && matchSeries;
    });

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-danger bg-opacity-10 p-3 rounded-4">
                            <HelpCircle size={28} className="text-danger" />
                        </div>
                        <div>
                            <h1 className="h3 mb-1 fw-bold">{t("questions.title", "Banque de Questions")}</h1>
                            <p className="text-muted mb-0">{t("questions.subtitle", "Gérez les questions du code de la route tunisien.")}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 text-md-end mt-3 mt-md-0">
                    <Button className="btn-tunisia px-4 py-2 d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        {t("questions.new", "Nouvelle Question")}
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {message && (
                <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="alert-tunisia mb-4">
                    {message.text}
                </Alert>
            )}

            {/* Search Bar and Filter */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={8} lg={9}>
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0">
                                    <Search size={18} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder={t("questions.search", "Rechercher une question ou une réponse...")}
                                    className="border-start-0 shadow-none"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={4} lg={3}>
                            <Form.Select 
                                value={selectedSeries} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedSeries(val === 'all' ? 'all' : parseInt(val));
                                }}
                                className="shadow-none"
                            >
                                <option value="all">{t("questions.allSeries", "Toutes les séries")}</option>
                                {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                                    <option key={num} value={num}>
                                        {t("questions.seriesNumber", "Série {number}").replace("{number}", num.toString())}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Questions Grid */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="danger" />
                    <p className="mt-3 text-muted">{t("questions.loading", "Chargement de la banque de questions...")}</p>
                </div>
            ) : filteredQuestions.length === 0 ? (
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="text-center py-5">
                        <AlertCircle size={48} className="text-muted mb-3 opacity-50" />
                        <h5 className="text-muted">{t("questions.notFound", "Aucune question trouvée")}</h5>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-4">
                    {filteredQuestions.map((q) => (
                        <Col key={q.id} xs={12} lg={6}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 question-card">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex gap-3 align-items-start flex-grow-1">
                                            <div className="bg-danger bg-opacity-10 p-2 rounded-3">
                                                <HelpCircle size={24} className="text-danger" />
                                            </div>
                                            <div className="flex-grow-1">
                                                <h5 className="mb-2 fw-bold">{q.text}</h5>
                                                <div className="d-flex gap-2 flex-wrap">
                                                    <Badge bg="light" className="text-dark border">
                                                        {q.options.length} {t("questions.options", "options")}
                                                    </Badge>
                                                    {q.series && (
                                                        <Badge bg="primary" className="text-white">
                                                            {t("questions.seriesNumber", "Série {number}").replace("{number}", q.series.toString())}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="rounded-circle p-2"
                                                onClick={() => handleOpenModal(q)}
                                                title={t("questions.edit", "Modifier")}
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="rounded-circle p-2"
                                                onClick={() => { setCurrentQuestion(q); setShowDeleteModal(true); }}
                                                title={t("questions.delete", "Supprimer")}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>

                                    {q.image && (
                                        <div className="mb-3">
                                            <img 
                                                src={q.image} 
                                                alt="Question" 
                                                className="img-fluid rounded-3 border"
                                                style={{ maxHeight: "200px", objectFit: "contain" }}
                                            />
                                        </div>
                                    )}

                                    <div className="row g-2">
                                        {q.options.map((opt, idx) => (
                                            <div key={idx} className={q.options.length <= 2 ? "col-12" : "col-md-6"}>
                                                <div className={`p-3 rounded-3 border-2 d-flex align-items-center gap-2 transition-all ${
                                                    idx === q.correctAnswer
                                                        ? "bg-success bg-opacity-10 border-success text-success fw-bold"
                                                        : "bg-light border-light text-muted"
                                                }`}>
                                                    <div className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                                                        {idx === q.correctAnswer ? (
                                                            <CheckCircle size={18} className="text-success" />
                                                        ) : (
                                                            <span className="text-muted fw-bold">{String.fromCharCode(65 + idx)}</span>
                                                        )}
                                                    </div>
                                                    <span className="flex-grow-1">{opt}</span>
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

            {/* Form Modal */}
            <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered size="lg">
                <Modal.Header closeButton className={currentQuestion.id ? "bg-primary text-white" : "bg-danger text-white"}>
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        {currentQuestion.id ? <Edit size={20} /> : <Plus size={20} />}
                        {currentQuestion.id ? t("questions.editTitle", "Modifier la Question") : t("questions.addTitle", "Ajouter une Question")}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold fs-5">{t("questions.questionText", "Texte de la Question")}</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                required
                                value={currentQuestion.text || ""}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                placeholder={t("questions.questionPlaceholder", "Entrez la question ici...")}
                                className="fs-5"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">{t("questions.series", "Série")}</Form.Label>
                            <Form.Select
                                value={currentQuestion.series || 1}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, series: parseInt(e.target.value) })}
                                required
                            >
                                {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                                    <option key={num} value={num}>
                                        {t("questions.seriesNumber", "Série {number}").replace("{number}", num.toString())}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                                {t("questions.seriesDesc", "Sélectionnez la série à laquelle appartient cette question (1-15)")}
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold d-flex align-items-center gap-2">
                                <ImageIcon size={18} />
                                {t("questions.image", "Image (optionnel)")}
                            </Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="mb-2"
                            />
                            {imagePreview && (
                                <div className="mt-2">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="img-fluid rounded-3 border"
                                        style={{ maxHeight: "300px", objectFit: "contain" }}
                                    />
                                    {currentQuestion.image && !selectedImage && (
                                        <p className="text-muted small mt-2">{t("questions.currentImage", "Image actuelle")}: {currentQuestion.image}</p>
                                    )}
                                </div>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">{t("questions.options", "Options de Réponse")}</Form.Label>
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <span className="small text-muted">{t("questions.numberOfOptions", "Nombre d'options")}:</span>
                                <div className="d-flex align-items-center gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleNumberOfOptionsChange(numberOfOptions - 1)}
                                        disabled={numberOfOptions <= 2}
                                        className="rounded-circle p-1"
                                    >
                                        <MinusCircle size={18} />
                                    </Button>
                                    <Badge bg="primary" className="px-3 py-2 fs-6">{numberOfOptions}</Badge>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleNumberOfOptionsChange(numberOfOptions + 1)}
                                        disabled={numberOfOptions >= 6}
                                        className="rounded-circle p-1"
                                    >
                                        <PlusCircle size={18} />
                                    </Button>
                                </div>
                                <span className="small text-muted ms-auto">(2-6 {t("questions.options", "options")})</span>
                            </div>
                            <p className="text-muted small mb-3">{t("questions.optionsDesc", "Cochez le bouton radio pour indiquer la réponse correcte.")}</p>

                            <div className="row g-3">
                                {currentQuestion.options?.map((opt, idx) => (
                                    <div key={idx} className={numberOfOptions <= 2 ? "col-12" : "col-md-6"}>
                                        <InputGroup className={currentQuestion.correctAnswer === idx ? "border border-success rounded-3 p-1" : ""}>
                                            <InputGroup.Text className="bg-white border-0">
                                                <Form.Check
                                                    type="radio"
                                                    name="correctAnswer"
                                                    checked={currentQuestion.correctAnswer === idx}
                                                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: idx })}
                                                    className="me-0"
                                                />
                                                <span className="fw-bold ms-2" style={{ minWidth: '24px' }}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                            </InputGroup.Text>
                                            <Form.Control
                                                value={opt}
                                                required
                                                placeholder={t("questions.option", "Option {num}").replace("{num}", (idx + 1).toString())}
                                                onChange={(e) => updateOption(idx, e.target.value)}
                                                className={currentQuestion.correctAnswer === idx ? "fw-bold text-success border-0" : "border-0"}
                                            />
                                        </InputGroup>
                                    </div>
                                ))}
                            </div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="bg-light border-0 p-4 pt-0">
                        <Button variant="light" onClick={() => setShowFormModal(false)} className="px-4">
                            {t("common.cancel", "Annuler")}
                        </Button>
                        <Button variant={currentQuestion.id ? "primary" : "danger"} type="submit" disabled={submitting || uploadingImage} className="px-4">
                            {(submitting || uploadingImage) ? (
                                <Spinner size="sm" />
                            ) : (
                                currentQuestion.id ? t("common.save", "Sauvegarder") : t("questions.add", "Enregistrer")
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
                        <Trash2 size={20} />
                        {t("questions.deleteTitle", "Confirmer la Suppression")}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 text-center">
                    <Trash2 size={48} className="text-danger mb-3" />
                    <h5>{t("questions.deleteConfirm", "Êtes-vous sûr ?")}</h5>
                    <p className="text-muted">
                        {t("questions.deleteDesc", "Voulez-vous vraiment supprimer cette question ?")}
                        <br />
                        {t("questions.deleteWarning", "Cette action est irréversible.")}
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button variant="light" onClick={() => setShowDeleteModal(false)} className="px-4">
                        {t("common.cancel", "Annuler")}
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={submitting} className="px-4">
                        {submitting ? <Spinner size="sm" /> : t("common.delete", "Supprimer")}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
