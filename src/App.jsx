import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { AuthProvider } from "./context/AuthContext";
import { CenterProvider } from "./context/CenterContext";
import { ToastProvider } from "./components/ui/Toast";

import LoginPage from "./pages/LoginPage";
import DashboardHome from "./pages/DashboardHome";
import CentersPage from "./pages/CentersPage";
import CenterFormPage from "./pages/CenterFormPage";
import CenterDetailPage from "./pages/CenterDetailPage";
import MembersPage from "./pages/MembersPage";
import PlatformCentersPage from "./pages/PlatformCentersPage";
import PlatformUsersPage from "./pages/PlatformUsersPage";

// Structure only — these render a placeholder until their backend module exists.
import RequestQueuePage from "./pages/RequestQueuePage";
import IntakePage from "./pages/IntakePage";
import CustodyRosterPage from "./pages/CustodyRosterPage";
import ListingsPage from "./pages/ListingsPage";
import BoardingPage from "./pages/BoardingPage";
import CareLogsPage from "./pages/CareLogsPage";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        {/* CenterProvider sits inside AuthProvider because it needs the logged-in user
            to fetch memberships, and inside Router because its children use links.
            ToastProvider wraps the routes so any page can confirm an action. */}
        <CenterProvider>
          <ToastProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />

                {/* Live — backed by CareCenterController */}
                <Route path="centers" element={<CentersPage />} />
                <Route path="centers/new" element={<CenterFormPage mode="create" />} />
                <Route path="centers/:id" element={<CenterDetailPage />} />
                <Route path="centers/:id/edit" element={<CenterFormPage mode="edit" />} />
                <Route path="members" element={<MembersPage />} />

                {/* Structure only — no backend yet */}
                <Route path="requests" element={<RequestQueuePage />} />
                <Route path="intake" element={<IntakePage />} />
                <Route path="custody" element={<CustodyRosterPage />} />
                <Route path="listings" element={<ListingsPage />} />
                <Route path="boarding" element={<BoardingPage />} />
                <Route path="care-logs" element={<CareLogsPage />} />

                {/* Super-admin only, nested so the role check wraps just these */}
                <Route element={<ProtectedRoute requireSuperAdmin />}>
                  <Route path="platform/centers" element={<PlatformCentersPage />} />
                  <Route path="platform/users" element={<PlatformUsersPage />} />
                </Route>
              </Route>
            </Route>

            <Route
              path="*"
              element={
                <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
                  <span className="text-5xl">🐾</span>
                  <p className="text-2xl font-extrabold tracking-tight text-ink-900">
                    404 — page not found
                  </p>
                  <p className="max-w-sm text-sm text-ink-500">
                    That page doesn&apos;t exist, or it moved somewhere else.
                  </p>
                  <a
                    href="/"
                    className="mt-2 rounded-[12px] bg-gradient-to-br from-brand-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(79,70,229,0.28)] transition hover:brightness-110"
                  >
                    Back to dashboard
                  </a>
                </div>
              }
            />
          </Routes>
          </ToastProvider>
        </CenterProvider>
      </AuthProvider>
    </Router>
  );
}
