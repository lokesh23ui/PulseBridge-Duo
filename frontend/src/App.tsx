import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MonitoringProvider } from './context/MonitoringContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PulseBridgeAssistant } from './components/PulseBridgeAssistant';
import { SystemAnnouncementBanner } from './components/SystemAnnouncementBanner';
import { HomePage } from './pages/HomePage';
import { DevicesExplorerPage } from './pages/DevicesExplorerPage';
import { RingPage } from './pages/RingPage';
import { WatchPage } from './pages/WatchPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { HealthInsightsPage } from './pages/HealthInsightsPage';
import { AboutPage } from './pages/AboutPage';

// Patient & Caregiver Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FamilyCarePage } from './pages/FamilyCarePage';
import { PatientMonitoringPage } from './pages/PatientMonitoringPage';
import { MedicalReportsPage } from './pages/MedicalReportsPage';

// Disease Intelligence Pages
import { AFibOverviewPage } from './pages/AFibOverviewPage';
import { DiseaseAnalysisPage } from './pages/DiseaseAnalysisPage';

// Admin Console Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPatientsPage } from './pages/admin/AdminPatientsPage';
import { AdminCaregiversPage } from './pages/admin/AdminCaregiversPage';
import { AdminAFibPage } from './pages/admin/AdminAFibPage';
import { AdminSymptomsPage } from './pages/admin/AdminSymptomsPage';
import { AdminParametersPage } from './pages/admin/AdminParametersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MonitoringProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/20">
            <Header />
            <SystemAnnouncementBanner />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/devices" element={<DevicesExplorerPage />} />
                <Route path="/devices/ring" element={<RingPage />} />
                <Route path="/devices/watch" element={<WatchPage />} />
                <Route path="/simulation" element={<Navigate to="/monitor" replace />} />
                <Route path="/monitor" element={<LiveMonitoringPage />} />
                <Route path="/insights" element={<HealthInsightsPage />} />
                <Route path="/afib" element={<AFibOverviewPage />} />
                <Route path="/diabetes" element={<AFibOverviewPage />} />
                <Route path="/disease-analysis" element={<DiseaseAnalysisPage />} />
                <Route path="/technology" element={<AboutPage />} />
                <Route path="/about" element={<AboutPage />} />

                {/* Patient-Caregiver Platform Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/family" element={<FamilyCarePage />} />
                <Route path="/patient-monitor/:patientId" element={<PatientMonitoringPage />} />
                <Route path="/reports" element={<MedicalReportsPage />} />

                {/* PulseBridge Admin Console Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="patients" element={<AdminPatientsPage />} />
                  <Route path="caregivers" element={<AdminCaregiversPage />} />
                  <Route path="afib-knowledge" element={<AdminAFibPage />} />
                  <Route path="symptoms" element={<AdminSymptomsPage />} />
                  <Route path="parameters" element={<AdminParametersPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="notifications" element={<AdminNotificationsPage />} />
                  <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="security" element={<AdminSecurityPage />} />
                </Route>
              </Routes>
            </main>
            <Footer />
            <PulseBridgeAssistant />
          </div>
        </BrowserRouter>
      </MonitoringProvider>
    </AuthProvider>
  );
};

export default App;
