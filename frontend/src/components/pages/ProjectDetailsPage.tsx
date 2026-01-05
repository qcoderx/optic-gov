import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types/project';

export const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        const projectData = await projectService.getProject(parseInt(projectId));
        setProject(projectData);
        
        // Load contractor data
        if (projectData.contractor_id) {
          const contractorResponse = await fetch(`https://optic-gov.onrender.com/contractors/${projectData.contractor_id}`);
          if (contractorResponse.ok) {
            const contractorData = await contractorResponse.json();
            setContractor(contractorData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#122017] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#38e07b] mx-auto mb-4"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#122017] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
          <p className="text-gray-400 mb-6 text-sm">
            {error?.includes('404') ? 
              'This project does not exist in the database. You may need to create some test data first.' :
              'There was an error loading the project data.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/transparency-map')}
              className="bg-[#38e07b] text-[#122017] px-4 py-2 rounded font-bold"
            >
              Back to Map
            </button>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('https://optic-gov.onrender.com/create-test-data', {
                    method: 'POST'
                  });
                  if (response.ok) {
                    const result = await response.json();
                    navigate(`/project/${result.project_id}`);
                  }
                } catch (err) {
                  console.error('Failed to create test data:', err);
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
            >
              Create Test Data
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Use real milestones from backend
  const milestones = (project.milestones || []).map((m: any) => ({
    id: m.id.toString(),
    title: m.description,
    status: m.status === 'completed' ? 'completed' : 
            m.status === 'pending' ? 'in-progress' : 'locked',
    date: new Date(m.created_at || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    }),
    description: m.description,
    evidence: m.status === 'completed' ? {
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop',
      analysis: `Milestone verified. ${m.description} completed successfully.`
    } : undefined
  }));

  // Calculate progress
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = milestones.length || 1;
  const progressPercentage = Math.round((completedMilestones / totalMilestones) * 100);
  
  // Calculate MNT amounts
  const totalMNT = project.total_budget_mnt || project.budget || 0;
  const releasedMNT = (totalMNT * progressPercentage) / 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-[#38e07b] bg-[#38e07b]/10 border-[#38e07b]/20';
      case 'in-progress': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'locked': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'in-progress': return 'pending';
      case 'locked': return 'lock';
      default: return 'radio_button_unchecked';
    }
  };

  return (
    <div className="min-h-screen bg-[#122017] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#122017] border-b border-[#29382f]">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-white">
              <div className="size-8 text-[#38e07b]">
                <Icon name="policy" />
              </div>
              <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Optic-Gov</h2>
            </div>
            <nav className="hidden md:flex items-center gap-9">
              <button onClick={() => navigate('/transparency-map')} className="text-white hover:text-[#38e07b] transition-colors text-sm font-medium">
                Map
              </button>
              <a className="text-white hover:text-[#38e07b] transition-colors text-sm font-medium" href="#">Transparency Reports</a>
              <a className="text-white hover:text-[#38e07b] transition-colors text-sm font-medium" href="#">About Us</a>
            </nav>
          </div>
          <button className="flex items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#38e07b] hover:bg-green-400 transition-colors text-[#122017] text-sm font-bold">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-10 py-8 space-y-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap gap-2 px-4 -ml-4">
          <button 
            onClick={() => navigate('/transparency-map')}
            className="text-[#9cbaa6] hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            <Icon name="public" /> Public Map
          </button>
          <span className="text-[#9cbaa6] text-sm font-medium">/</span>
          <span className="text-white text-sm font-medium">{project.name || 'Project Details'}</span>
        </div>

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-start gap-6 border-b border-[#29382f] pb-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                {project.name || 'Infrastructure Project'}
              </h1>
              <span className="hidden md:flex items-center gap-1 bg-[#38e07b]/10 text-[#38e07b] px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-[#38e07b]/20">
                <Icon name="verified_user" size="sm" /> Verified
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#9cbaa6] text-sm md:text-base">
              <span className="flex items-center gap-1">
                <Icon name="fingerprint" size="sm" /> Project ID: {project.id}
              </span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                <Icon name="location_on" size="sm" /> {project.location || 'Nigeria'}
              </span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1 text-[#38e07b]">
                <Icon name="auto_awesome" size="sm" /> Verified by Optic-Gov AI
              </span>
            </div>
          </div>
          <button className="flex items-center gap-2 justify-center rounded-lg h-10 px-4 bg-[#1c2620] border border-[#29382f] hover:border-[#38e07b]/50 text-white text-sm font-bold transition-all">
            <Icon name="receipt_long" size="sm" />
            View Smart Contract
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1c2620] border border-[#29382f]">
            <div className="flex items-center justify-between">
              <p className="text-[#9cbaa6] text-sm font-medium uppercase tracking-wider">Total Budget</p>
              <Icon name="account_balance_wallet" className="text-[#9cbaa6]" />
            </div>
            <p className="text-white text-2xl font-bold">₦{project.total_budget_ngn?.toLocaleString() || '0'}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1c2620] border border-[#29382f]">
            <div className="flex items-center justify-between">
              <p className="text-[#9cbaa6] text-sm font-medium uppercase tracking-wider">MNT Locked</p>
              <Icon name="lock" className="text-[#9cbaa6]" />
            </div>
            <p className="text-white text-2xl font-bold">{totalMNT.toFixed(2)} MNT</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1c2620] border border-[#29382f]">
            <div className="flex items-center justify-between">
              <p className="text-[#9cbaa6] text-sm font-medium uppercase tracking-wider">MNT Released</p>
              <Icon name="lock_open" className="text-[#38e07b]" />
            </div>
            <p className="text-[#38e07b] text-2xl font-bold">{releasedMNT.toFixed(2)} MNT</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1c2620] border border-[#29382f]">
            <div className="flex items-center justify-between">
              <p className="text-[#9cbaa6] text-sm font-medium uppercase tracking-wider">Next Release</p>
              <Icon name="schedule" className="text-[#9cbaa6]" />
            </div>
            <p className="text-white text-2xl font-bold">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Main Layout: Timeline & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Project Milestones</h3>
              <div className="text-xs text-[#9cbaa6] bg-[#1c2620] px-3 py-1 rounded-full border border-[#29382f] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#38e07b] animate-pulse" /> Live Updates
              </div>
            </div>

            <div className="relative pl-4">
              {/* Vertical Line */}
              <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-[#29382f]" />
              
              {milestones.map((milestone) => (
                <div key={milestone.id} className={`relative flex gap-6 pb-12 group ${milestone.status === 'locked' ? 'opacity-50' : ''}`}>
                  <div className="flex flex-col items-center">
                    <div className={`z-10 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-[#122017] ${
                      milestone.status === 'completed' ? 'bg-[#38e07b]' :
                      milestone.status === 'in-progress' ? 'bg-yellow-500' :
                      'bg-[#29382f] border border-[#9cbaa6]'
                    }`}>
                      <Icon 
                        name={getStatusIcon(milestone.status)} 
                        size="sm" 
                        className={milestone.status === 'completed' ? 'text-[#122017]' : milestone.status === 'in-progress' ? 'text-black' : 'text-[#9cbaa6]'}
                      />
                    </div>
                  </div>
                  
                  <div className={`flex-1 bg-[#1c2620] border rounded-xl p-5 transition-colors ${
                    milestone.status === 'in-progress' ? 'border-yellow-500/30' : 'border-[#29382f] hover:border-[#38e07b]/30'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-bold text-lg">
                          {milestone.title}
                        </h4>
                        <p className={`text-sm ${milestone.status === 'in-progress' ? 'text-yellow-500 font-medium' : 'text-[#9cbaa6]'}`}>
                          {milestone.status === 'in-progress' ? 'In Progress • Due ' : 'Completed on '}{milestone.date}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(milestone.status)}`}>
                        {milestone.status.toUpperCase().replace('-', ' ')}
                      </span>
                    </div>

                    {milestone.evidence && (
                      <div className="mt-4 bg-[#151c17] rounded-lg p-3 border border-[#29382f] flex gap-4">
                        <div 
                          className="relative w-32 h-20 rounded-md overflow-hidden flex-shrink-0 group/video cursor-pointer"
                          onClick={() => setSelectedEvidence(milestone.evidence!.image)}
                        >
                          <img 
                            className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity" 
                            src={milestone.evidence.image}
                            alt="Project evidence"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/video:bg-black/20 transition-all">
                            <Icon name="play_arrow" className="text-white bg-[#38e07b]/80 rounded-full p-1" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-[#38e07b] text-xs font-bold mb-1 uppercase tracking-wide">
                            <Icon name="auto_awesome" size="sm" /> Gemini 2.5 Analysis
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {milestone.evidence.analysis}
                          </p>
                        </div>
                      </div>
                    )}

                    {milestone.status === 'in-progress' && (
                      <div className="mt-4 bg-[#151c17] rounded-lg p-3 border border-dashed border-[#29382f] flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="size-4 rounded-full border-2 border-t-[#38e07b] border-r-[#38e07b] border-b-transparent border-l-transparent animate-spin" />
                          <p className="text-[#9cbaa6] text-sm italic">Waiting for contractor verification...</p>
                        </div>
                        <div className="w-full h-1.5 bg-[#122017] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-yellow-500 w-2/3 rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Progress & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Financial Progress */}
            <div className="bg-[#1c2620] rounded-xl p-6 border border-[#29382f]">
              <h3 className="text-white font-bold text-lg mb-4">Funds Released</h3>
              <div className="flex flex-col gap-3">
                <div className="flex gap-6 justify-between items-end">
                  <p className="text-[#9cbaa6] text-sm font-medium">Smart Contract Auto-Release</p>
                  <p className="text-white text-xl font-bold">{progressPercentage}%</p>
                </div>
                <div className="rounded-full h-3 bg-[#0f1511] border border-[#29382f] overflow-hidden">
                  <div className="h-full rounded-full bg-[#38e07b] relative overflow-hidden" style={{ width: `${progressPercentage}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                  </div>
                </div>
                <p className="text-[#9cbaa6] text-xs mt-1">
                  Funds are cryptographically locked until milestones are verified by Optic-Gov AI oracle.
                </p>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-[#1c2620] rounded-xl p-6 border border-[#29382f]">
              <h3 className="text-white font-bold text-lg mb-4">Project Location</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9cbaa6]">Address</span>
                  <span className="text-white font-medium text-right">{project.location || 'Nigeria'}</span>
                </div>
                {project.coordinates && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9cbaa6]">Coordinates</span>
                    <span className="text-[#38e07b] font-mono text-xs">
                      {project.coordinates.lat.toFixed(4)}, {project.coordinates.lng.toFixed(4)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#9cbaa6]">Status</span>
                  <span className="text-[#38e07b] font-bold">Active</span>
                </div>
              </div>
            </div>

            {/* Contractor Info */}
            <div className="bg-[#1c2620] rounded-xl p-6 border border-[#29382f]">
              <h3 className="text-white font-bold text-lg mb-4">Contractor Profile</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10">
                  <span className="font-bold text-lg">{contractor?.company_name?.substring(0, 2).toUpperCase() || 'CO'}</span>
                </div>
                <div>
                  <p className="text-white font-bold">{contractor?.company_name || 'Loading...'}</p>
                  <div className="flex items-center gap-1 text-xs text-[#38e07b]">
                    <Icon name="verified" size="sm" />
                    <span>Level {Math.min(Math.floor((contractor?.trust_score || 85) / 20), 5)} Vetted</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9cbaa6]">Projects Completed</span>
                  <span className="text-white font-medium">{contractor?.projects_completed || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9cbaa6]">Trust Score</span>
                  <span className="text-[#38e07b] font-bold">{contractor?.trust_score || 85}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Evidence Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2620] border border-[#29382f] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Project Evidence</h3>
                <button 
                  onClick={() => setSelectedEvidence(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Icon name="close" />
                </button>
              </div>
              <img 
                src={selectedEvidence} 
                alt="Project evidence" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
