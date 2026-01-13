import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBlockNumber } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

// UI Components
import { Icon } from '@/components/ui/Icon';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { projectService } from '@/services/projectService';

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

export const GovernorMapDashboard = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  const [selectedProject, setSelectedProject] = useState<LocalProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAllProjects();
      const transformedProjects = response.projects.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        status: p.status || 'pending',
        location: `${p.project_latitude?.toFixed(4)}, ${p.project_longitude?.toFixed(4)}`,
        completion: 0,
        description: p.description,
        place: {
          location: {
            latitude: p.project_latitude || 0,
            longitude: p.project_longitude || 0
          }
        }
      }));
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return { bg: 'bg-[#38e07b]/20', text: 'text-[#38e07b]', border: 'border-[#38e07b]/20' };
      case 'alert': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/20' };
      case 'pending': return { bg: 'bg-amber-400/20', text: 'text-amber-400', border: 'border-amber-400/20' };
      case 'draft': return { bg: 'bg-gray-700/50', text: 'text-gray-300', border: 'border-gray-700/50' };
      default: return { bg: 'bg-gray-700/50', text: 'text-gray-300', border: 'border-gray-700/50' };
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
          {/* Live Blockchain Sync Status */}
          <motion.div 
            className="hidden md:flex items-center gap-2 text-xs font-mono text-[#9db9a6] bg-[#1a2c20] px-3 py-1.5 rounded-full border border-[#28392e]"
          >
            <motion.div 
              className={`size-2 rounded-full ${isConnected ? 'bg-[#38e07b]' : 'bg-red-500'}`}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Mantle Sepolia: Block #{blockNumber?.toString() || '---'}
          </motion.div>

          {/* Wallet & User Actions */}
          <div className="flex gap-3">
            <ConnectKitButton.Custom>
              {({ isConnected, show, truncatedAddress }) => (
                <motion.button 
                  onClick={show}
                  className={`flex items-center gap-2 h-9 px-4 text-sm font-bold rounded-lg transition-colors border ${
                    isConnected 
                      ? "bg-[#38e07b]/10 border-[#38e07b]/20 text-[#38e07b] hover:bg-[#38e07b]/20" 
                      : "bg-[#38e07b] border-transparent text-[#111814] hover:bg-[#22c565]"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon name="account_balance_wallet" size="sm" />
                  <span>{isConnected ? truncatedAddress : "Connect Wallet"}</span>
                </motion.button>
              )}
            </ConnectKitButton.Custom>

            <motion.button 
              className="size-9 flex items-center justify-center rounded-lg bg-[#1a2c20] text-white hover:bg-[#28392e] transition-colors relative"
              whileHover={{ scale: 1.1 }}
            >
              <Icon name="notifications" size="sm" />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-[#102216]" />
            </motion.button>
            
            <div className="size-9 rounded-full bg-cover bg-center border border-[#28392e] cursor-pointer ml-2 bg-gray-700" 
                 style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=governor')" }} />
          </div>
        </div>
      </motion.header>

      {/* Main Dashboard Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 relative bg-[#0b120e]">
          <LeafletMap 
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={(project) => setSelectedProject(project)}
            center={[9.0820, 8.6753]}
            zoom={6}
          />
        </main>

        <motion.aside 
          className="w-[400px] flex flex-col bg-[#102216] border-l border-[#28392e] z-10 shadow-2xl"
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="p-6 border-b border-[#28392e] bg-[#102216]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-bold">Dashboard Control</h2>
              <motion.span 
                className="text-xs text-[#9db9a6]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Network Live
              </motion.span>
            </div>

            <motion.button 
              className="w-full h-12 bg-[#38e07b] hover:bg-[#22c55a] text-[#111813] font-bold rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,224,123,0.2)] transition-all mb-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsNavigating(true);
                setTimeout(() => navigate('/governor'), 1500);
              }}
            >
              <Icon name="add_circle" />
              Create New Project
            </motion.button>

            <motion.button 
              className="w-full h-10 bg-[#1a2c20] hover:bg-[#28392e] text-white font-medium rounded-lg flex items-center justify-center gap-2 border border-[#28392e] transition-all mb-6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/governor/projects')}
            >
              <Icon name="folder_open" size="sm" />
              View All Projects
            </motion.button>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <motion.div className="bg-[#1a2c20] p-3 rounded-lg border border-[#28392e]">
                <p className="text-[#9db9a6] text-xs font-medium uppercase mb-1">Total Projects</p>
                <p className="text-white text-xl font-bold">{projects.length}</p>
              </motion.div>
              <motion.div className="bg-[#1a2c20] p-3 rounded-lg border border-[#28392e]">
                <p className="text-[#9db9a6] text-xs font-medium uppercase mb-1">Currency</p>
                <p className="text-white text-xl font-bold">MNT</p>
              </motion.div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="relative mb-6">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9db9a6]">
                  <Icon name="search" />
                </span>
                <input 
                  className="w-full bg-[#1a2c20] border border-[#28392e] text-white text-sm rounded-lg focus:ring-1 focus:ring-[#38e07b] focus:border-[#38e07b] block pl-10 p-3 placeholder-[#5d7364]" 
                  placeholder="Search projects..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Monitored Projects</h3>
                {isLoading ? (
                  <div className="text-center py-8 text-[#9db9a6]">Loading projects...</div>
                ) : (
                  projects.map((project) => (
                    <motion.div 
                      key={project.id}
                      className={`bg-[#1a2c20] border border-[#28392e] rounded-lg p-4 cursor-pointer group ${
                        selectedProject?.id === project.id ? 'border-[#38e07b]/50 bg-[#38e07b]/5' : ''
                      }`}
                      onClick={() => setSelectedProject(project)}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-bold text-sm group-hover:text-[#38e07b]">{project.name}</h4>
                          <p className="text-[#9db9a6] text-xs">ID: #{project.id}</p>
                        </div>
                        <div className={`${getStatusColor(project.status).bg} ${getStatusColor(project.status).text} text-[10px] font-bold px-2 py-1 rounded border ${getStatusColor(project.status).border}`}>
                          {project.status}
                        </div>
                      </div>
                      <div className="w-full bg-[#102216] h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          className={`${getProgressColor(project.status)} h-1.5 rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${project.completion}%` }}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};