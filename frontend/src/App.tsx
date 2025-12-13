import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { RegisterPage } from '@/components/pages/RegisterPage';
import { LoginPage } from '@/components/pages/LoginPage';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { TransparencyMapPage } from '@/components/pages/TransparencyMapPage';
import { ProjectDetailsPage } from '@/components/pages/ProjectDetailsPage';
import { GovernorDashboardPage } from '@/components/pages/GovernorDashboardPage';
import { GovernorLoginPage } from '@/components/pages/GovernorLoginPage';
import { GovernorMapDashboard } from '@/components/pages/GovernorMapDashboard';
import { ContractorDashboard } from '@/components/pages/ContractorDashboard';
import { MilestoneSubmission } from '@/components/pages/MilestoneSubmission';
import { ContractorProjectView } from '@/components/pages/ContractorProjectView';
import { ActiveProjectsPage } from '@/components/pages/ActiveProjectsPage';
import { AppFlowGuide } from '@/components/pages/AppFlowGuide';

const HomePage = () => (
  <div className="relative flex h-auto min-h-screen w-full flex-col">
    <Header />
    <main className="flex-1 flex flex-col items-center w-full">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transparency-map" element={<TransparencyMapPage />} />
        <Route path="/project/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/governor" element={<GovernorDashboardPage />} />
        <Route path="/governor/login" element={<GovernorLoginPage />} />
        <Route path="/governor/dashboard" element={<GovernorMapDashboard />} />
        <Route path="/governor/projects" element={<ActiveProjectsPage />} />
        <Route path="/guide" element={<AppFlowGuide />} />
        <Route path="/contractor" element={<ContractorDashboard />} />
        <Route path="/contractor/milestone/:milestoneId" element={<MilestoneSubmission />} />
        <Route path="/contractor/project/:projectId" element={<ContractorProjectView />} />
      </Routes>
    </Router>
  );
}

export default App;