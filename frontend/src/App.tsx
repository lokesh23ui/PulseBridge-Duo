import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MonitoringProvider } from './context/MonitoringContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PulseBridgeAssistant } from './components/PulseBridgeAssistant';
import { HomePage } from './pages/HomePage';
import { DevicesExplorerPage } from './pages/DevicesExplorerPage';
import { RingPage } from './pages/RingPage';
import { WatchPage } from './pages/WatchPage';
import { SimulationStudioPage } from './pages/SimulationStudioPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { HealthInsightsPage } from './pages/HealthInsightsPage';
import { TechnologyPage } from './pages/TechnologyPage';
import { AboutPage } from './pages/AboutPage';

// Patient & Caregiver Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FamilyCarePage } from './pages/FamilyCarePage';
import { PatientMonitoringPage } from './pages/PatientMonitoringPage';
import { MedicalReportsPage } from './pages/MedicalReportsPage';

// Disease Intelligence Pages
import { DiabetesOverviewPage } from './pages/DiabetesOverviewPage';
import { DiseaseAnalysisPage } from './pages/DiseaseAnalysisPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MonitoringProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/20">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/devices" element={<DevicesExplorerPage />} />
                <Route path="/devices/ring" element={<RingPage />} />
                <Route path="/devices/watch" element={<WatchPage />} />
                <Route path="/simulation" element={<SimulationStudioPage />} />
                <Route path="/monitor" element={<LiveMonitoringPage />} />
                <Route path="/insights" element={<HealthInsightsPage />} />
                <Route path="/diabetes" element={<DiabetesOverviewPage />} />
                <Route path="/disease-analysis" element={<DiseaseAnalysisPage />} />
                <Route path="/technology" element={<AboutPage />} />
                <Route path="/about" element={<AboutPage />} />

                {/* Patient-Caregiver Platform Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/family" element={<FamilyCarePage />} />
                <Route path="/patient-monitor/:patientId" element={<PatientMonitoringPage />} />
                <Route path="/reports" element={<MedicalReportsPage />} />
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
