import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

// Layout & UI
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

// Pages
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
import { MilestoneVerificationPage } from '@/components/pages/MilestoneVerificationPage';
import { ContractorProjectView } from '@/components/pages/ContractorProjectView';
import { ActiveProjectsPage } from '@/components/pages/ActiveProjectsPage';
import { AppFlowGuide } from '@/components/pages/AppFlowGuide';
import { ContractorProjectDetailsPage } from './components/pages/ContractorProjectDetailsPage';

// 1. Manually define Mantle Sepolia to bypass Vite import errors
const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.sepolia.mantle.xyz' },
  },
  testnet: true,
};

// 2. Configure Wagmi & ConnectKit
const config = createConfig(
  getDefaultConfig({
    appName: "Optic-Gov",
    chains: [mantleSepolia as any],
    transports: {
      [mantleSepolia.id]: http(),
    },
    walletConnectProjectId: "00000000000000000000000000000000", 
  }),
);

const queryClient = new QueryClient();

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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider mode="dark">
          <ErrorBoundary>
            <Router>
              <ConnectionStatus />
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
                <Route path="/contractor/verify/:milestoneId" element={<MilestoneVerificationPage />} />
                <Route path="/contractor/project/:projectId" element={<ContractorProjectDetailsPage />} />
                <Route path="/contractor/milestone/:milestoneId" element={<MilestoneSubmission />} />
                <Route path="/contractor/project/:projectId" element={<ContractorProjectView />} />
              </Routes>
            </Router>
          </ErrorBoundary>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;