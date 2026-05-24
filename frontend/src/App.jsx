import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { Layout } from './components/Layout';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { HomePage } from './pages/HomePage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Common Pages
import { ProfilePage } from './pages/ProfilePage';

// Patient Pages
import { MedicalHistoryPage } from './pages/MedicalHistoryPage';
import ApprovedTherapistsPage from './pages/ApprovedTherapistsPage';
import TherapistDetailPage from './pages/TherapistDetailPage';
import AdminPendingTherapistsPage from './pages/AdminPendingTherapistsPage';
import TherapistPendingRequestsPage from './pages/TherapistPendingRequestsPage';
import PatientDashboardPage from './pages/PatientDashboardPage';
import PatientVideosPage from './pages/PatientVideosPage';
import FeedbackPage from './pages/patient/FeedbackPage';

// Therapist Pages
import { PatientsPage } from './pages/PatientsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import TherapistVideosPage from './pages/TherapistVideosPage';
import TherapistOverviewPage from './pages/therapist/TherapistOverviewPage';
import SendFeedbackPage from './pages/therapist/SendFeedbackPage';
import TherapistNurseAssignmentsPage from './pages/therapist/TherapistNurseAssignmentsPage';

// Nurse Pages
import { NurseDashboardPage } from './pages/NurseDashboardPage';
import { NursePatientsPage } from './pages/NursePatientsPage';
import { NurseAppointmentsPage } from './pages/NurseAppointmentsPage';

// Admin Pages
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import AdminMedicalHistoriesPage from './pages/AdminMedicalHistoriesPage';
import AdminPendingAssignmentsPage from './pages/AdminPendingAssignmentsPage';
import AdminVideosPage from './pages/AdminVideosPage';

function AppContent() {
  const { user } = useAuth();

  return (
    <Layout>
      <Navigation />
      <div className="flex flex-1 min-h-0">
        {user && <Sidebar />}
        <main className="flex-1 min-w-0">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
        <Route
          path="/therapists"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <ApprovedTherapistsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapists/:id"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <TherapistDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pending-therapists"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminPendingTherapistsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapist/pending-requests"
          element={
            <ProtectedRoute allowedRoles={["THERAPIST"]}>
              <TherapistPendingRequestsPage />
            </ProtectedRoute>
          }
        />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes - All Roles */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Patient Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="PATIENT">
                  <PatientDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-history"
              element={
                <ProtectedRoute requiredRole="PATIENT">
                  <MedicalHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/feedback"
              element={
                <ProtectedRoute requiredRole="PATIENT">
                  <FeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/videos"
              element={
                <ProtectedRoute requiredRole="PATIENT">
                  <PatientVideosPage />
                </ProtectedRoute>
              }
            />

            {/* Therapist Routes */}
            <Route
              path="/patients"
              element={
                <ProtectedRoute requiredRole="THERAPIST">
                  <PatientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/therapist/videos"
              element={
                <ProtectedRoute requiredRole="THERAPIST">
                  <TherapistVideosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute requiredRole="THERAPIST">
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/therapist/overview"
              element={
                <ProtectedRoute requiredRole="THERAPIST">
                  <TherapistOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/therapist/nurse-assignments"
              element={
                <ProtectedRoute requiredRole="THERAPIST">
                  <TherapistNurseAssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/therapist/feedback"
              element={
                <ProtectedRoute requiredRole="THERAPIST">
                  <SendFeedbackPage />
                </ProtectedRoute>
              }
            />

            {/* Nurse Routes */}
            <Route
              path="/nurse"
              element={
                <ProtectedRoute allowedRoles={["NURSE", "ADMIN"]}>
                  <NurseDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/*"
              element={
                <ProtectedRoute allowedRoles={["NURSE", "ADMIN"]}>
                  <NurseDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/dashboard"
              element={
                <ProtectedRoute allowedRoles={["NURSE", "ADMIN"]}>
                  <Navigate to="/nurse" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/patients"
              element={
                <ProtectedRoute allowedRoles={["NURSE", "ADMIN"]}>
                  <NursePatientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/appointments"
              element={
                <ProtectedRoute allowedRoles={["NURSE", "ADMIN"]}>
                  <NurseAppointmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/videos"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminVideosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/medical-histories"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminMedicalHistoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pending-assignments"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminPendingAssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
