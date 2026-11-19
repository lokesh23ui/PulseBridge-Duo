import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MonitoringProvider } from './context/MonitoringContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MonitoringProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
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
                <Route path="/technology" element={<TechnologyPage />} />
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
          </div>
        </BrowserRouter>
      </MonitoringProvider>
    </AuthProvider>
  );
};

export default App;
