import {  BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPVerificationPage from './pages/auth/OTPVerificationPage';

// Applicant Pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard';
import InstitutionProfile from './pages/applicant/InstitutionProfile';
import FormCatalog from './pages/applicant/FormCatalog';
import FormRequirements from './pages/applicant/FormRequirements';
import NewApplication from './pages/applicant/NewApplication';
import ApplicationsList from './pages/applicant/ApplicationsList';
import ApplicationTracking from './pages/applicant/ApplicationTracking';
import CertificatesPage from './pages/applicant/CertificatesPage';

// Payment Pages
import PaymentSuccess from './pages/payment/PaymentSuccess';

// Inspector Pages
import InspectorDashboard from './pages/inspector/InspectorDashboard';
import InspectionsList from './pages/inspector/InspectionsList';
import InspectionDetail from './pages/inspector/InspectionDetail';
import InspectionReport from './pages/inspector/InspectionReport';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerApplicationsList from './pages/officer/OfficerApplicationsList';
import ApplicationReview from './pages/officer/ApplicationReview';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import InspectorsManagement from './pages/admin/InspectorsManagement';
import LicensingOffices from './pages/admin/LicensingOffices';
import FormsManagement from './pages/admin/FormsManagement';
import SystemLogs from './pages/admin/SystemLogs';
import UsersManagement from './pages/admin/UsersManagement';
import JurisdictionsManagement from './pages/admin/JurisdictionsManagement';
import ApplicationsCompliance from './pages/admin/ApplicationsCompliance';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect based on user role
  const getRoleBasedRedirect = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'applicant':
        return '/applicant/dashboard';
      case 'inspector':
        return '/inspector/dashboard';
      case 'officer':
        return '/officer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={getRoleBasedRedirect()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Applicant Routes */}
        <Route
          path="/applicant"
          element={
            <ProtectedRoute allowedRoles={['applicant']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ApplicantDashboard />} />
          <Route path="institution" element={<InstitutionProfile />} />
          <Route path="forms" element={<FormCatalog />} />
          <Route path="forms/:formId/requirements" element={<FormRequirements />} />
          <Route path="forms/:formCode/fill" element={<NewApplication />} />
          <Route path="application/new" element={<NewApplication />} />
          <Route path="applications" element={<ApplicationsList />} />
          <Route path="applications/:id" element={<ApplicationTracking />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="payment/success" element={<PaymentSuccess />} />
        </Route>

        {/* Inspector Routes */}
        <Route
          path="/inspector"
          element={
            <ProtectedRoute allowedRoles={['inspector']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<InspectorDashboard />} />
          <Route path="inspections" element={<InspectionsList />} />
          <Route path="inspections/:id" element={<InspectionDetail />} />
          <Route path="inspections/:id/report" element={<InspectionReport />} />
        </Route>

        {/* Officer Routes */}
        <Route
          path="/officer"
          element={
            <ProtectedRoute allowedRoles={['officer']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<OfficerDashboard />} />
          <Route path="applications" element={<OfficerApplicationsList />} />
          <Route path="applications/:id" element={<ApplicationReview />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="inspectors" element={<InspectorsManagement />} />
          <Route path="jurisdictions" element={<JurisdictionsManagement />} />
          <Route path="offices" element={<LicensingOffices />} />
          <Route path="forms" element={<FormsManagement />} />
          <Route path="applications" element={<ApplicationsCompliance />} />
          <Route path="logs" element={<SystemLogs />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
