import Sidebar from "@/components/Sidebar";
import Heartbeat from "@/components/Heartbeat";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="d-flex bg-light" style={{ minHeight: '100vh', overflow: 'hidden' }}>
            <Heartbeat />
            {/* Sidebar remains fixed on the left */}
            <div className="d-none d-md-block" style={{ flexShrink: 0 }}>
                <Sidebar />
            </div>

            {/* Main content area */}
            <main className="flex-fill overflow-auto" style={{ height: '100vh' }}>
                {children}
            </main>
        </div>
    );
}
