import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

import { LeafletMap } from '@/components/ui/LeafletMap';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface LocalProject {
  id: string;
  name: string;
  status: 'verified' | 'alert' | 'pending' | 'draft';
  location: string;
  completion: number;
  description?: string;
  place?: {
    location: { latitude: number; longitude: number };
  };
}

const mockProjects: LocalProject[] = [
  {
    id: '8821',
    name: 'Central Highway Repair',
    status: 'verified',
    location: 'Sector 7',
    completion: 75,
    description: 'Gemini AI Verified',
    place: { location: { latitude: 6.5244, longitude: 3.3792 } }
  },
  {
    id: '9923',
    name: 'District 9 Water Supply',
    status: 'alert',
    location: 'North Zone',
    completion: 40,
    description: 'Material Shortage',
    place: { location: { latitude: 9.0579, longitude: 7.4951 } }
  },
  {
    id: '1029',
    name: 'City Bridge Alpha',
    status: 'pending',
    location: 'Downtown',
    completion: 15,
    description: 'Waiting for visual proof',
    place: { location: { latitude: 4.8156, longitude: 7.0498 } }
  },
  {
    id: '1044',
    name: 'Solar Grid Extension',
    status: 'draft',
    location: 'West Sector',
    completion: 0,
    description: 'Not started',
    place: { location: { latitude: 7.3775, longitude: 3.9470 } }
  }
];

export const GovernorMapDashboard = () => {
  const [selectedProject, setSelectedProject] = useState<LocalProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return { bg: 'bg-[#38e07b]/20', text: 'text-[#38e07b]', border: 'border-[#38e07b]/20' };
      case 'alert': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/20' };
      case 'pending': return { bg: 'bg-amber-400/20', text: 'text-amber-400', border: 'border-amber-400/20' };
      case 'draft': return { bg: 'bg-gray-700/50', text: 'text-gray-300', border: 'border-gray-700/50' };
      default: return { bg: 'bg-gray-700/50', text: 'text-gray-300', border: 'border-gray-700/50' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return 'verified';
      case 'alert': return 'warning';
      case 'pending': return 'hourglass_top';
      case 'draft': return 'fiber_new';
      default: return 'radio_button_unchecked';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-[#38e07b]';
      case 'alert': return 'bg-red-500';
      case 'pending': return 'bg-amber-400';
      case 'draft': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  if (isNavigating) {
    return <LoadingScreen message="Loading Project Creator..." />;
  }

  return (
    <div className="bg-[#102216] text-white h-screen flex flex-col overflow-hidden font-display">
      {/* Top Navigation */}
      <motion.header 
        className="flex items-center justify-between border-b border-[#28392e] bg-[#102216] px-6 py-3 shrink-0 z-20 relative shadow-md"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          <motion.div 
            className="size-8 text-[#38e07b] flex items-center justify-center bg-[#38e07b]/10 rounded-lg"
            whileHover={{ scale: 1.1 }}
          >
            <Icon name="policy" />
          </motion.div>
          <h1 className="text-white text-xl font-bold tracking-tight">
            Optic-Gov 
            <span className="text-xs font-normal text-gray-400 ml-2 border border-[#28392e] px-2 py-0.5 rounded-full">
              Governor View
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Blockchain Sync Status */}
          <motion.div 
            className="hidden md:flex items-center gap-2 text-xs font-mono text-[#9db9a6] bg-[#1a2c20] px-3 py-1.5 rounded-full border border-[#28392e]"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div 
              className="size-2 rounded-full bg-[#38e07b]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Ethereum Mainnet: Block #19244291
          </motion.div>
          {/* Wallet & User Actions */}
          <div className="flex gap-3">
            <motion.button 
              className="flex items-center gap-2 h-9 px-4 bg-[#38e07b]/10 border border-[#38e07b]/20 hover:bg-[#38e07b]/20 text-[#38e07b] text-sm font-bold rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon name="account_balance_wallet" size="sm" />
              <span>0x71C...9A2</span>
            </motion.button>
            <motion.button 
              className="size-9 flex items-center justify-center rounded-lg bg-[#1a2c20] text-white hover:bg-[#28392e] transition-colors relative"
              whileHover={{ scale: 1.1 }}
            >
              <Icon name="notifications" size="sm" />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-[#102216]" />
            </motion.button>
            <motion.button 
              className="size-9 flex items-center justify-center rounded-lg bg-[#1a2c20] text-white hover:bg-[#28392e] transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              <Icon name="settings" size="sm" />
            </motion.button>
            <div className="size-9 rounded-full bg-cover bg-center border border-[#28392e] cursor-pointer ml-2" 
                 style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face')" }} />
          </div>
        </div>
      </motion.header>

      {/* Main Dashboard Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Interactive Map */}
        <main className="flex-1 relative bg-[#0b120e]">
          <LeafletMap 
            projects={mockProjects}
            selectedProject={selectedProject}
            onProjectSelect={(project) => setSelectedProject(project)}
            center={[9.0820, 8.6753]}
            zoom={6}
          />
        </main>

        {/* Right Panel: Sidebar / Command Center */}
        <motion.aside 
          className="w-[400px] flex flex-col bg-[#102216] border-l border-[#28392e] z-10 shadow-2xl"
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Sticky Header Section */}
          <div className="p-6 border-b border-[#28392e] bg-[#102216]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-bold">Dashboard Control</h2>
              <motion.span 
                className="text-xs text-[#9db9a6]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Updated 2m ago
              </motion.span>
            </div>
            {/* Primary Action */}
            <motion.button 
              className="w-full h-12 bg-[#38e07b] hover:bg-[#22c55a] text-[#111813] font-bold rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,224,123,0.2)] transition-all mb-6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsNavigating(true);
                setTimeout(() => {
                  window.location.href = '/governor';
                }, 1500);
              }}
            >
              <Icon name="add_circle" />
              Create New Project
            </motion.button>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <motion.div 
                className="bg-[#1a2c20] p-3 rounded-lg border border-[#28392e]"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-[#9db9a6] text-xs font-medium uppercase mb-1">Total Projects</p>
                <p className="text-white text-xl font-bold font-display">12</p>
              </motion.div>
              <motion.div 
                className="bg-[#1a2c20] p-3 rounded-lg border border-[#28392e]"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-[#9db9a6] text-xs font-medium uppercase mb-1">Deployed</p>
                <p className="text-white text-xl font-bold font-display">$4.5M</p>
              </motion.div>
              <motion.div 
                className="bg-[#1a2c20] p-3 rounded-lg border border-[#28392e]"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-[#9db9a6] text-xs font-medium uppercase mb-1">Verify Pending</p>
                <p className="text-amber-400 text-xl font-bold font-display">3</p>
              </motion.div>
              <motion.div 
                className="bg-[#1a2c20] p-3 rounded-lg border border-[#28392e]"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-[#9db9a6] text-xs font-medium uppercase mb-1">Active Alerts</p>
                <p className="text-red-400 text-xl font-bold font-display">2</p>
              </motion.div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-6">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9db9a6]">
                  <Icon name="search" />
                </span>
                <input 
                  className="w-full bg-[#1a2c20] border border-[#28392e] text-white text-sm rounded-lg focus:ring-1 focus:ring-[#38e07b] focus:border-[#38e07b] block pl-10 p-3 placeholder-[#5d7364]" 
                  placeholder="Search projects by ID or Name..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Project List */}
              <div className="space-y-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Monitored Projects</h3>
                
                {mockProjects.map((project) => {
                  const statusStyle = getStatusColor(project.status);
                  const progressColor = getProgressColor(project.status);
                  
                  return (
                    <motion.div 
                      key={project.id}
                      className={`bg-[#1a2c20] border border-[#28392e] hover:border-[#38e07b]/50 rounded-lg p-4 transition-colors cursor-pointer group ${
                        selectedProject?.id === project.id ? 'border-[#38e07b]/50 bg-[#38e07b]/5' : ''
                      }`}
                      onClick={() => setSelectedProject(project)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-bold text-sm group-hover:text-[#38e07b] transition-colors">
                            {project.name}
                          </h4>
                          <p className="text-[#9db9a6] text-xs">{project.location} • ID: #{project.id}</p>
                        </div>
                        <div className={`${statusStyle.bg} ${statusStyle.text} text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1 border ${statusStyle.border}`}>
                          <Icon name={getStatusIcon(project.status)} size="sm" />
                          {project.status}
                        </div>
                      </div>
                      <div className="w-full bg-[#102216] h-1.5 rounded-full mb-3 overflow-hidden">
                        <motion.div 
                          className={`${progressColor} h-1.5 rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${project.completion}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white">{project.completion}% Complete</span>
                        {project.description && (
                          <div className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                            {project.status === 'verified' && <Icon name="smart_toy" size="sm" />}
                            {project.description}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Bottom User/Help */}
          <div className="p-4 border-t border-[#28392e] bg-[#0b120e]">
            <motion.button 
              className="flex items-center justify-between w-full text-left text-[#9db9a6] hover:text-white text-xs group"
              whileHover={{ x: 5 }}
            >
              <span className="flex items-center gap-2">
                <Icon name="help" size="sm" />
                Need help with smart contracts?
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Icon name="arrow_forward" size="sm" />
              </motion.div>
            </motion.button>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};