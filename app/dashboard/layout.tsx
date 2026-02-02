"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Heartbeat from "@/components/Heartbeat";
import { Offcanvas } from "react-bootstrap";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="d-flex bg-light" style={{ minHeight: '100vh', overflow: 'hidden' }}>
            <Heartbeat />

            {/* Mobile Header with Hamburger Menu */}
            <div className="d-md-none position-fixed top-0 start-0 end-0 bg-white border-bottom shadow-sm" style={{ zIndex: 1030, height: '60px' }}>
                <div className="d-flex align-items-center justify-content-between h-100 px-3">
                    <h5 className="mb-0 fw-bold">Tunisia Driving</h5>
                    <button
                        className="btn btn-link text-dark p-2"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="d-none d-md-block" style={{ flexShrink: 0 }}>
                <Sidebar />
            </div>

            {/* Mobile Sidebar - Offcanvas */}
            <Offcanvas
                show={isMobileMenuOpen}
                onHide={() => setIsMobileMenuOpen(false)}
                placement="start"
                className="w-auto"
            >
                <Offcanvas.Header className="border-bottom p-0">
                    <div className="w-100">
                        <Sidebar
                            isMobileMenuOpen={isMobileMenuOpen}
                            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                        />
                    </div>
                </Offcanvas.Header>
            </Offcanvas>

            {/* Main content area - Add top padding on mobile for fixed header */}
            <main className="flex-fill overflow-auto" style={{ height: '100vh', paddingTop: '60px' }}>
                <div className="d-md-none" style={{ height: '0px' }} /> {/* Spacer for mobile header */}
                <div style={{ paddingTop: '0' }} className="d-none d-md-block" /> {/* No padding on desktop */}
                {children}
            </main>
        </div>
    );
}
