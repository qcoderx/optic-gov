import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types/project';



export const ContractorDashboard = () => {
  const [activeFilter, setActiveFilter] = useState('Active');
  const [isNavigating, setIsNavigating] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeProjects: 0, totalFunds: 0, pendingVerifications: 0, nextDeadline: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAllProjects();
      const projectsArray = response.projects || response || [];
      const transformedProjects = Array.isArray(projectsArray) 
        ? projectsArray.map(project => projectService.transformProject(project))
        : [];
      setProjects(transformedProjects);
      
      // Calculate dynamic stats
      const activeCount = transformedProjects.length;
      const totalBudget = transformedProjects.reduce((sum, p) => sum + (p.total_budget_ngn || p.budget || 0), 0);
      setStats({
        activeProjects: activeCount,
        totalFunds: totalBudget,
        pendingVerifications: Math.floor(activeCount * 0.6),
        nextDeadline: 3
      });
      
      // Generate dynamic activities
      const dynamicActivities = transformedProjects.slice(0, 3).map((project, i) => ({
        type: ['verified', 'payment', 'action'][i] || 'action',
        title: ['Milestone Verified', 'Funds Released', 'Action Required'][i] || 'Update Required',
        description: `${project.name} - ${['AI approved evidence', 'Payment transferred', 'Upload verification needed'][i]}`,
        time: ['2 hours ago', 'Yesterday', '2 days ago'][i] || 'Recently',
        icon: ['verified', 'account_balance_wallet', 'notification_important'][i] || 'info',
        color: ['text-[#38e07b]', 'text-blue-400', 'text-yellow-400'][i] || 'text-gray-400'
      }));
      setActivities(dynamicActivities);
      
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-[#38e07b]';
      case 'in-progress': return 'text-[#9db9a8]';
      default: return 'text-[#9db9a8]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Verification Pending';
      case 'approved': return 'Approved';
      case 'in-progress': return 'In Progress';
      default: return 'Unknown';
    }
  };

  if (isNavigating) {
    return <LoadingScreen message="Loading Milestone Submission..." />;
  }

  return (
    <div className="bg-[#102218] text-white overflow-x-hidden min-h-screen flex flex-col font-display">
      {/* Top Navigation Bar */}
      <motion.header 
        className="w-full border-b border-[#28392f] bg-[#111814] px-4 sm:px-10 py-3 sticky top-0 z-50"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between whitespace-nowrap">
          <div className="flex items-center gap-4 text-white">
            <motion.div 
              className="size-8 bg-[#38e07b]/20 rounded-lg flex items-center justify-center text-[#38e07b]"
              whileHover={{ scale: 1.1 }}
            >
              <Icon name="policy" />
            </motion.div>
            <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Optic-Gov</h2>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-[#38e07b] text-sm font-bold leading-normal" href="#">Dashboard</a>
              <a className="text-white hover:text-[#38e07b] transition-colors text-sm font-medium leading-normal" href="#">Reports</a>
              <a className="text-white hover:text-[#38e07b] transition-colors text-sm font-medium leading-normal" href="#">Settings</a>
            </div>
            <div className="flex gap-3">
              <motion.button 
                className="flex items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#38e07b] text-[#111814] text-sm font-bold leading-normal hover:bg-[#22c565] transition-colors shadow-[0_0_10px_rgba(56,224,123,0.3)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="truncate">0x71C...9A21</span>
              </motion.button>
              <motion.button 
                className="flex size-10 items-center justify-center rounded-lg bg-[#1c2720] border border-[#28392f] text-white hover:text-[#38e07b] transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                <Icon name="notifications" />
              </motion.button>
            </div>
          </div>
          {/* Mobile Menu Icon */}
          <div className="md:hidden text-white">
            <Icon name="menu" />
          </div>
        </div>
      </motion.header>

      {/* Main Content Layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Page Heading & Welcome */}
        <motion.div 
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Contractor Hub</h1>
          <p className="text-[#9db9a8] text-base font-normal">
            Welcome back, Apex Construction. You have <span className="text-[#38e07b] font-bold">2 milestones</span> pending verification.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div 
            className="flex flex-col gap-2 rounded-xl p-6 border border-[#28392f] bg-[#1c2720]/50"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start">
              <p className="text-[#9db9a8] text-sm font-medium">Active Projects</p>
              <Icon name="engineering" className="text-[#38e07b]" />
            </div>
            <p className="text-white text-3xl font-bold leading-tight">{stats.activeProjects}</p>
          </motion.div>
          <motion.div 
            className="flex flex-col gap-2 rounded-xl p-6 border border-[#28392f] bg-[#1c2720]/50"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start">
              <p className="text-[#9db9a8] text-sm font-medium">Total Funds Unlocked</p>
              <Icon name="payments" className="text-[#38e07b]" />
            </div>
            <p className="text-white text-3xl font-bold leading-tight">₦{stats.totalFunds.toLocaleString()}</p>
          </motion.div>
          <motion.div 
            className="flex flex-col gap-2 rounded-xl p-6 border border-[#28392f] bg-[#1c2720]/50"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start">
              <p className="text-[#9db9a8] text-sm font-medium">Pending Verifications</p>
              <Icon name="hourglass_top" className="text-yellow-400" />
            </div>
            <p className="text-white text-3xl font-bold leading-tight">{stats.pendingVerifications}</p>
          </motion.div>
          <motion.div 
            className="flex flex-col gap-2 rounded-xl p-6 border border-[#28392f] bg-[#1c2720]/50"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start">
              <p className="text-[#9db9a8] text-sm font-medium">Next Deadline</p>
              <Icon name="event_busy" className="text-red-400" />
            </div>
            <p className="text-white text-3xl font-bold leading-tight">{stats.nextDeadline} Days</p>
          </motion.div>
        </motion.div>

        {/* Dashboard Split View */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Projects List */}
          <motion.div 
            className="flex-1 w-full flex flex-col gap-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white text-2xl font-bold">Assigned Projects</h2>
              <div className="flex gap-2">
                {['All', 'Active', 'Completed'].map((filter) => (
                  <motion.button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeFilter === filter
                        ? 'text-[#111814] bg-[#38e07b]'
                        : 'text-[#9db9a8] hover:text-white hover:bg-[#1c2720]'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {filter}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Project Cards */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <LoadingScreen message="Loading projects..." />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-[#9db9a8]">
                  <Icon name="folder_open" className="text-4xl mb-4" />
                  <p>No projects assigned yet</p>
                </div>
              ) : (
                projects.map((project, index) => (
                <motion.article
                  key={project.id}
                  className="bg-[#1c2720] rounded-xl border border-[#28392f] overflow-hidden hover:border-[#38e07b]/50 transition-colors group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div 
                      className="md:w-64 h-48 md:h-auto bg-cover bg-center shrink-0 relative"
                      style={{ backgroundImage: `url(${project.image})` }}
                    >
                      <div className="absolute inset-0 bg-black/40 md:hidden" />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-[#38e07b] border border-[#38e07b]/20">
                        #{project.id}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-[#38e07b] transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-[#9db9a8] bg-[#111814] px-2 py-1 rounded border border-[#28392f]">
                            <Icon name="smart_toy" size="sm" className="text-[#38e07b]" />
                            Gemini Active
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-[#9db9a8] uppercase tracking-wider">Status</p>
                            <p className="text-white font-medium">{project.status}</p>
                            <p className="text-xs text-[#9db9a8]">
                              Created: {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9db9a8] uppercase tracking-wider">Budget</p>
                            <p className="text-white font-medium">
                              ₦{(project.total_budget_ngn || project.budget || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9db9a8] uppercase tracking-wider">Location</p>
                            <p className="text-white font-medium text-xs">
                              {project.coordinates ? 'GPS Set' : 'No Location'}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Progress & Actions */}
                      <div className="space-y-3">
                        <div className="w-full">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white">Project Status</span>
                            <span className="text-[#38e07b]">{project.status}</span>
                          </div>
                          <div className="w-full bg-[#111814] rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className="bg-[#38e07b] h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: '25%' }}
                              transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button 
                            className="flex-1 bg-[#38e07b] hover:bg-[#22c565] text-[#111814] font-bold"
                            onClick={() => {
                              setIsNavigating(true);
                              setTimeout(() => {
                                window.location.href = `/contractor/project/${project.id}`;
                              }, 1500);
                            }}
                          >
                            View Project Details
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="border-[#28392f] bg-[#111814] text-white hover:text-[#38e07b] hover:border-[#38e07b]"
                            onClick={() => {
                              setIsNavigating(true);
                              setTimeout(() => {
                                window.location.href = `/contractor/verify/1`;
                              }, 1500);
                            }}
                          >
                            <Icon name="upload_file" size="sm" className="mr-2" />
                            <span className="hidden sm:inline">Quick Upload</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
                ))
              )}
            </div>
          </motion.div>

          {/* Right Column: Recent Activity Feed */}
          <motion.div 
            className="w-full lg:w-96 flex flex-col gap-6 shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-white text-2xl font-bold">Recent Activity</h2>
            <div className="bg-[#1c2720] border border-[#28392f] rounded-xl p-4 flex flex-col gap-1">
              {activities.map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex gap-4 py-4 border-b border-[#28392f] last:border-0 group cursor-pointer hover:bg-white/5 rounded px-2 transition-colors -mx-2"
                  whileHover={{ x: 5 }}
                >
                  <div className={`size-10 rounded-full bg-${activity.color.split('-')[1]}-500/10 flex items-center justify-center shrink-0`}>
                    <Icon name={activity.icon} className={activity.color} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className={`text-sm font-bold text-white group-hover:${activity.color} transition-colors`}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-[#9db9a8]">{activity.description}</p>
                    <p className="text-[10px] font-mono text-[#9db9a8] mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
              <a className="mt-2 text-center text-sm font-medium text-[#38e07b] hover:text-[#22c565] transition-colors py-2" href="#">
                View Full History
              </a>
            </div>

            {/* Support/Info Box */}
            <motion.div 
              className="bg-[#111814] border border-[#28392f] rounded-xl p-6 relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="absolute -right-4 -top-4 size-24 bg-[#38e07b]/10 rounded-full blur-2xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <h3 className="text-lg font-bold text-white relative z-10">Gemini Verification</h3>
              <p className="text-sm text-[#9db9a8] mt-2 relative z-10">
                All photos uploaded are analyzed by Gemini 2.5 Flash for authenticity and milestone completion accuracy.
              </p>
              <Button 
                variant="secondary" 
                className="mt-4 text-xs font-bold uppercase tracking-wider text-[#38e07b] border-[#28392f] hover:bg-[#1c2720] relative z-10"
              >
                Learn more
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};