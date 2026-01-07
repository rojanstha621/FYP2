import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Layout } from './components/Layout';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';

// Common Pages
import { ProfilePage } from './pages/ProfilePage';

// Patient Pages
import { MedicalHistoryPage } from './pages/MedicalHistoryPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ProgressPage } from './pages/ProgressPage';

// Therapist Pages
import { PatientsPage } from './pages/PatientsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';

// Admin Pages
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Navigation />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

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
                path="/medical-history"
                element={
                  <ProtectedRoute requiredRole="PATIENT">
                    <MedicalHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exercises"
                element={
                  <ProtectedRoute requiredRole="PATIENT">
                    <ExercisesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute requiredRole="PATIENT">
                    <ProgressPage />
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
                path="/assignments"
                element={
                  <ProtectedRoute requiredRole="THERAPIST">
                    <AssignmentsPage />
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
          <Footer />
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
