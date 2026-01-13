import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { projectService } from '@/services/projectService';
import { useWallet } from '@/hooks/useWallet';

export const ContractorDashboard = () => {
  const { address } = useWallet();
  const [activeFilter, setActiveFilter] = useState('Active');
  const [isNavigating] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [activities] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeProjects: 0, totalFunds: 0, pendingVerifications: 0, nextDeadline: 0 });

  useEffect(() => {
    loadProjects();
  }, [address]);

  // --- UPDATED ROBUST DYNAMIC LOGIC ---

  const calculateCompletionPercentage = (project: any) => {
    const milestones = project.milestones || [];
    if (milestones.length === 0) return 0;
    
    // Checks for various ways the backend might signal a "done" milestone
    const completedMilestones = milestones.filter((m: any) => {
      const status = (m.status || '').toLowerCase();
      return status === 'verified' || status === 'completed' || status === 'paid' || m.is_completed === true;
    }).length;
    
    return Math.round((completedMilestones / milestones.length) * 100);
  };

  const getProjectStatus = (project: any): 'Done' | 'In Progress' | 'Not Started' => {
    const percentage = calculateCompletionPercentage(project);
    if (percentage >= 100) return 'Done';
    if (percentage > 0) return 'In Progress';
    return 'Not Started';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'text-[#38e07b]';
      case 'In Progress': return 'text-yellow-400';
      default: return 'text-[#9db9a8]';
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectService.getAllProjects();
      const projectsArray = response.projects || response || [];
      
      const transformedProjects = Array.isArray(projectsArray) 
        ? projectsArray.map(project => ({
            ...project,
            id: project.id,
            name: project.name || project.title,
            description: project.description,
            total_budget_mnt: project.budget || project.total_budget_mnt,
            total_budget_ngn: project.total_budget_ngn,
            milestones: project.milestones || []
          }))
        : [];
      
      // Fetch details (milestones) for each project to ensure status is accurate
      const detailedProjects = await Promise.all(
        transformedProjects.map(async (p) => {
          try {
            const details = await projectService.getProject(Number(p.id));
            return { ...p, ...details };
          } catch {
            return p;
          }
        })
      );
      
      setProjects(detailedProjects);
      
      // Update global stats based on real milestone data
      const pendingCount = detailedProjects.filter(p => {
        const status = getProjectStatus(p);
        return status === 'In Progress' || (p.milestones || []).some((m: any) => m.status === 'pending');
      }).length;

      setStats({
        activeProjects: detailedProjects.filter(p => getProjectStatus(p) !== 'Done').length,
        totalFunds: detailedProjects.reduce((sum, p) => sum + (p.total_budget_ngn || 0), 0),
        pendingVerifications: pendingCount,
        nextDeadline: 3
      });
      
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  if (isNavigating) return <LoadingScreen message="Loading..." />;

  return (
    <div className="bg-[#102218] text-white overflow-x-hidden min-h-screen flex flex-col font-display">
      <header className="w-full border-b border-[#28392f] bg-[#111814] px-10 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-8 bg-[#38e07b]/20 rounded-lg flex items-center justify-center text-[#38e07b]">
              <Icon name="policy" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Optic-Gov</h2>
          </div>
          <div className="flex gap-4 items-center">
            <div className="hidden md:block text-right">
              <p className="text-[10px] text-[#9db9a8] uppercase font-bold">Connected Wallet</p>
              <p className="text-xs font-mono">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}</p>
            </div>
            <Button className="bg-[#38e07b] text-black font-bold h-10 px-6 rounded-lg">
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black">Contractor Hub</h1>
          <p className="text-[#9db9a8]">
            You have <span className="text-[#38e07b] font-bold">{stats.pendingVerifications}</span> projects requiring attention.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Active Projects" value={stats.activeProjects} icon="engineering" />
          <StatBox label="Unlocked Funds" value={`₦${stats.totalFunds.toLocaleString()}`} icon="payments" />
          <StatBox label="Pending AI" value={stats.pendingVerifications} icon="hourglass_top" highlight />
          <StatBox label="Next Deadline" value={`${stats.nextDeadline} Days`} icon="event_busy" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Assigned Projects</h2>
              <div className="flex gap-2 bg-[#111814] p-1 rounded-lg border border-[#28392f]">
                {['All', 'Active', 'Completed'].map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-1 rounded text-xs font-bold transition-all ${activeFilter === f ? 'bg-[#38e07b] text-black' : 'text-[#9db9a8]'}`}>{f}</button>
                ))}
              </div>
            </div>

            {projects.length === 0 ? (
                <div className="bg-[#1c2720] border border-dashed border-[#28392f] rounded-xl p-20 text-center text-[#9db9a8]">
                  <Icon name="folder_open" size="xl" className="mb-4 opacity-20" />
                  <p>No projects found for this address.</p>
                </div>
            ) : (
              projects.map((project) => {
                const progress = calculateCompletionPercentage(project);
                const status = getProjectStatus(project);
                return (
                  <motion.div key={project.id} className="bg-[#1c2720] border border-[#28392f] rounded-xl overflow-hidden flex flex-col md:flex-row group hover:border-[#38e07b]/40 transition-all">
                    <div className="md:w-64 h-48 md:h-auto bg-[#111814] relative overflow-hidden flex items-center justify-center">
                       <Icon name="apartment" className="text-[#38e07b]/10 text-8xl absolute" />
                       <span className="relative z-10 font-mono text-[#38e07b] bg-black/40 px-3 py-1 rounded border border-[#38e07b]/20">#{project.id}</span>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-[#38e07b] transition-colors">{project.name}</h3>
                          <p className="text-xs text-[#9db9a8] flex items-center gap-1 mt-1">
                            <Icon name="location_on" size="xs" />
                            {project.project_latitude ? `${project.project_latitude.toFixed(4)}°, ${project.project_longitude.toFixed(4)}°` : 'Location Pending'}
                          </p>
                        </div>
                        <div className="bg-[#111814] px-3 py-1 rounded-full border border-[#28392f] flex items-center gap-2">
                           <div className={`size-2 rounded-full animate-pulse ${status === 'Done' ? 'bg-[#38e07b]' : 'bg-yellow-400'}`} />
                           <span className={`text-[10px] font-bold uppercase ${getStatusColor(status)}`}>{status}</span>
                        </div>
                      </div>

                      {/* DYNAMIC PROGRESS BAR */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-[#9db9a8]">Project Milestone Progress</span>
                          <span className={getStatusColor(status)}>{progress}% Complete</span>
                        </div>
                        <div className="h-2 w-full bg-[#111814] rounded-full overflow-hidden border border-[#28392f]">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-[#38e07b]/50 to-[#38e07b] shadow-[0_0_10px_#38e07b44]"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1 bg-[#38e07b] text-black font-bold h-11" onClick={() => window.location.href=`/contractor/project/${project.id}`}>
                          View Details
                        </Button>
                        <Button className="border-[#28392f] bg-[#111814] h-11 px-6" onClick={() => window.location.href=`/contractor/verify/${project.id}`}>
                          <Icon name="upload_file" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Activity Column */}
          <div className="lg:w-96 flex flex-col gap-6">
            <h2 className="text-2xl font-bold">AI Verification Feed</h2>
            <div className="bg-[#1c2720] border border-[#28392f] rounded-xl p-4 divide-y divide-[#28392f]">
               {activities.length > 0 ? activities.map((a, i) => (
                 <div key={i} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${a.color.replace('text', 'bg')}/10`}>
                      <Icon name={a.icon} className={a.color} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{a.title}</p>
                      <p className="text-xs text-[#9db9a8] leading-relaxed">{a.description}</p>
                      <p className="text-[10px] font-mono text-[#38e07b] mt-1">{a.time}</p>
                    </div>
                 </div>
               )) : (
                 <p className="text-xs text-[#9db9a8] py-4">No recent AI audit events.</p>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatBox = ({ label, value, icon, highlight = false }: any) => (
  <div className={`p-6 rounded-xl border border-[#28392f] bg-[#1c2720]/50 ${highlight ? 'ring-1 ring-[#38e07b]/30' : ''}`}>
    <div className="flex justify-between items-center mb-2">
      <p className="text-[#9db9a8] text-xs font-bold uppercase tracking-wider">{label}</p>
      <Icon name={icon} className={highlight ? 'text-yellow-400' : 'text-[#38e07b]'} />
    </div>
    <p className="text-3xl font-black text-white">{value}</p>
  </div>
);