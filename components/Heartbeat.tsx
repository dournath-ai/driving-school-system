"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Modal, Button } from "react-bootstrap";
import { AlertCircle, Clock } from "lucide-react";

/**
 * Heartbeat component to track user connection time.
 * Runs every 60 seconds and syncs with the server.
 * Handles auto-logout if account is deactivated or limit is reached.
 */
export default function Heartbeat() {
    const { data: session, status } = useSession();
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ title: "", message: "", type: "" });

    useEffect(() => {
        if (status !== "authenticated") return;

        const sendHeartbeat = async () => {
            try {
                const res = await fetch("/api/auth/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });

                if (!res.ok) {
                    const data = await res.json();
                    if (data.status === "DEACTIVATED" || data.status === "LIMIT_EXCEEDED") {
                        setModalData({
                            title: data.status === "DEACTIVATED" ? "Compte Désactivé" : "Limite Atteinte",
                            message: data.message || "Votre session a expiré.",
                            type: data.status
                        });
                        setShowModal(true);
                    }
                }
            } catch (error) {
                console.error("Heartbeat sync error:", error);
            }
        };

        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 60000);

        return () => clearInterval(interval);
    }, [status]);

    const handleLogout = () => {
        signOut({ callbackUrl: "/auth/signin" });
    };

    return (
        <Modal
            show={showModal}
            onHide={() => { }} // Prevent closing without action
            centered
            backdrop="static"
            keyboard={false}
            className="heartbeat-modal"
        >
            <Modal.Header className="bg-danger text-white border-0">
                <Modal.Title className="d-flex align-items-center gap-2">
                    {modalData.type === "LIMIT_EXCEEDED" ? <Clock size={24} /> : <AlertCircle size={24} />}
                    {modalData.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 text-center">
                <div className="mb-3 text-danger">
                    {modalData.type === "LIMIT_EXCEEDED" ? (
                        <Clock size={48} />
                    ) : (
                        <AlertCircle size={48} />
                    )}
                </div>
                <h5 className="fw-bold mb-3">{modalData.message}</h5>
                <p className="text-muted">
                    Vous allez être redirigé vers la page de connexion.
                </p>
            </Modal.Body>
            <Modal.Footer className="border-0 justify-content-center pb-4">
                <Button variant="danger" className="px-5 rounded-pill" onClick={handleLogout}>
                    Retour à la connexion
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
