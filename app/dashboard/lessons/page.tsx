"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

type Instructor = {
    id: string;
    name: string;
    email: string;
};

type Vehicle = {
    id: string;
    model: string;
    plateNumber: string;
};

type Lesson = {
    id: string;
    startTime: string;
    endTime: string;
    instructorId: string;
    vehicleId: string;
};

export default function LessonsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [selectedInstructor, setSelectedInstructor] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const timeSlots = [
        "08:00", "09:00", "10:00", "11:00", "12:00",
        "14:00", "15:00", "16:00", "17:00", "18:00"
    ];

    useEffect(() => {
        fetchInstructors();
        fetchVehicles();
    }, []);

    const fetchInstructors = async () => {
        try {
            const res = await fetch("/api/instructors");
            const data = await res.json();
            setInstructors(data);
        } catch (error) {
            console.error("Failed to fetch instructors", error);
        }
    };

    const fetchVehicles = async () => {
        try {
            const res = await fetch("/api/vehicles");
            const data = await res.json();
            setVehicles(data);
        } catch (error) {
            console.error("Failed to fetch vehicles", error);
        }
    };

    const handleBooking = async () => {
        if (!selectedDate || !selectedInstructor || !selectedVehicle || !selectedTime) {
            setMessage("⚠️ Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

            const res = await fetch("/api/lessons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instructorId: selectedInstructor,
                    vehicleId: selectedVehicle,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                }),
            });

            if (res.ok) {
                setMessage("✅ Leçon réservée avec succès!");
                setSelectedInstructor("");
                setSelectedVehicle("");
                setSelectedTime("");
            } else {
                const error = await res.json();
                setMessage(`❌ Erreur: ${error.error || "Impossible de réserver"}`);
            }
        } catch (error) {
            setMessage("❌ Erreur lors de la réservation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col-12">
                    <div className="dashboard-card p-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="traffic-icon">
                                🚗
                            </div>
                            <div>
                                <h1 className="h3 mb-1">Réserver une Leçon de Conduite</h1>
                                <p className="text-muted mb-0">
                                    Choisissez votre instructeur, véhicule et créneau horaire
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-8 mx-auto">
                    <div className="dashboard-card p-4">
                        {message && (
                            <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-tunisia mb-4`}>
                                {message}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="form-label fw-semibold">📅 Date de la Leçon</label>
                            <input
                                type="date"
                                className="form-control form-control-lg"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={format(new Date(), "yyyy-MM-dd")}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-semibold">👨‍🏫 Instructeur</label>
                            <select
                                className="form-select form-select-lg"
                                value={selectedInstructor}
                                onChange={(e) => setSelectedInstructor(e.target.value)}
                            >
                                <option value="">Sélectionnez un instructeur</option>
                                {instructors.map((instructor) => (
                                    <option key={instructor.id} value={instructor.id}>
                                        {instructor.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-semibold">🚙 Véhicule</label>
                            <select
                                className="form-select form-select-lg"
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                            >
                                <option value="">Sélectionnez un véhicule</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.model} - {vehicle.plateNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-semibold">⏰ Créneau Horaire</label>
                            <div className="row g-2">
                                {timeSlots.map((time) => (
                                    <div key={time} className="col-6 col-md-4">
                                        <button
                                            type="button"
                                            className={`btn w-100 ${selectedTime === time ? 'btn-tunisia' : 'btn-outline-danger'}`}
                                            onClick={() => setSelectedTime(time)}
                                        >
                                            {time}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleBooking}
                            disabled={loading || !selectedDate || !selectedInstructor || !selectedVehicle || !selectedTime}
                            className="btn btn-tunisia btn-lg w-100"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Réservation en cours...
                                </>
                            ) : (
                                "✅ Confirmer la Réservation"
                            )}
                        </button>

                        <div className="alert alert-info alert-tunisia mt-4">
                            <h6 className="alert-heading">ℹ️ Informations</h6>
                            <ul className="mb-0 small">
                                <li>Chaque leçon dure 1 heure</li>
                                <li>Vous pouvez annuler jusqu'à 24h avant</li>
                                <li>Soyez à l'heure pour profiter pleinement de votre leçon</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
