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

  // Dynamic API URL for Local vs Production
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        console.log("🔍 Fetching project ID:", projectId);
        
        const projectData = await projectService.getProject(parseInt(projectId));
        
        // DEBUG LOG - Look at this in your browser console!
        console.log("📦 Full Project Data from Backend:", projectData);
        console.log("🏆 Milestones found:", projectData.milestones);
  
        setProject(projectData);
        
        if (projectData.contractor_id) {
          try {
            const contractorResponse = await fetch(`${API_BASE_URL}/contractors/${projectData.contractor_id}`);
            if (contractorResponse.ok) {
              const contractorData = await contractorResponse.json();
              setContractor(contractorData);
            }
          } catch (cErr) {
            console.warn("Contractor profile load failed.");
          }
        }
      } catch (err) {
        console.error("❌ Load error:", err);
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
        <div className="text-center max-w-md px-4">
          <p className="text-red-400 mb-4 font-bold">{error || 'Project not found'}</p>
          <button onClick={() => navigate('/transparency-map')} className="bg-[#38e07b] text-[#122017] px-6 py-2 rounded-full font-bold">
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  const milestones = (project?.milestones || []).map((m: any, index: number) => {
    // Log individual milestone to see keys
    console.log(`Milestone ${index} raw data:`, m); 
  
    return {
      id: m.id?.toString() || index.toString(),
      title: m.description || `Milestone ${index + 1}`,
      status: m.status === 'completed' || m.status === 'verified' ? 'completed' : 
              m.status === 'pending' ? 'in-progress' : 'locked',
      date: m.created_at ? new Date(m.created_at).toLocaleDateString() : "Pending",
      description: m.description,
      // Try both amount and amount_mnt
      amount: m.amount || m.amount_mnt || 0, 
    };
  });

  // Calculations
// 1. Map the Budget correctly based on your console log
// Your log shows "total_budget" contains the MNT value
const totalMNT = project.total_budget || (project as any).budget || 0;

// Since total_budget_ngn is undefined in your log, 
// we'll try to find any available NGN field or display '---'
const totalNGN = project.total_budget_ngn || (project as any).budget_ngn || 0;

// 2. Progress Calculation
const completedMilestones = milestones.filter(m => m.status === 'completed').length;
const totalMilestonesCount = milestones.length || 1;
const progressPercentage = Math.round((completedMilestones / totalMilestonesCount) * 100);

// 3. Released amount based on progress
const releasedMNT = (totalMNT * progressPercentage) / 100;

  // Helper Functions for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-[#38e07b] bg-[#38e07b]/10 border-[#38e07b]/20';
      case 'in-progress': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'in-progress': return 'pending';
      default: return 'lock';
    }
  };

  return (
    <div className="min-h-screen bg-[#122017] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#122017] border-b border-[#29382f]">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center gap-4 text-white">
              <div className="size-8 text-[#38e07b]"><Icon name="policy" /></div>
              <h2 className="text-white text-lg font-bold">Optic-Gov</h2>
            </div>
          </div>
          <button className="rounded-lg h-10 px-4 bg-[#38e07b] text-[#122017] text-sm font-bold">
            Wallet Connected
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-10 py-8 space-y-8">
        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-start gap-6 border-b border-[#29382f] pb-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-3xl md:text-4xl font-black">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 text-[#9cbaa6] text-sm">
              <span className="flex items-center gap-1"><Icon name="fingerprint" size="sm" /> On-Chain ID: {project.on_chain_id}</span>
              <span className="text-[#38e07b] flex items-center gap-1"><Icon name="auto_awesome" size="sm" /> Gemini AI Managed</span>
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-lg h-10 px-4 bg-[#1c2620] border border-[#29382f] text-white text-sm font-bold">
            <Icon name="receipt_long" size="sm" /> Explorer
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Budget" 
            value={`₦${totalNGN.toLocaleString()}`} 
            icon="payments" 
          />
          <StatCard 
            title="Total MNT Locked" 
            value={`${Number(totalMNT).toFixed(4)} MNT`} 
            icon="account_balance_wallet" 
          />
          <StatCard 
            title="MNT Released" 
            value={`${Number(releasedMNT).toFixed(4)} MNT`} 
            icon="lock_open" 
            highlight 
          />
          <StatCard 
            title="Project Progress" 
            value={`${progressPercentage}%`} 
            icon="trending_up" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Milestones List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold">AI Generated Milestones</h3>
            <div className="relative pl-4 space-y-8">
              <div className="absolute left-[27px] top-4 bottom-0 w-0.5 bg-[#29382f]" />
              {milestones.map((milestone) => (
                <div key={milestone.id} className="relative flex gap-6">
                  <div className={`z-10 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-[#122017] ${
                    milestone.status === 'completed' ? 'bg-[#38e07b]' : 'bg-[#29382f]'
                  }`}>
                    <Icon name={getStatusIcon(milestone.status)} size="sm" className="text-black" />
                  </div>
                  <div className="flex-1 bg-[#1c2620] border border-[#29382f] rounded-xl p-5">
                    <div className="flex justify-between items-start">
                      <h4 className="text-white font-bold">{milestone.title}</h4>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(milestone.status)}`}>
                        {milestone.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[#9cbaa6] text-sm mt-2">{milestone.amount.toFixed(2)} MNT Allocation</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <div className="bg-[#1c2620] rounded-xl p-6 border border-[#29382f]">
              <h3 className="text-white font-bold mb-4">Trust Score</h3>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-[#38e07b]/20 flex items-center justify-center text-[#38e07b] text-xl font-bold">
                  {contractor?.trust_score || 85}
                </div>
                <div>
                  <p className="font-bold">{contractor?.company_name || "Assigned Contractor"}</p>
                  <p className="text-xs text-[#9cbaa6]">Verified Level 4</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Simple Stat Component
const StatCard = ({ title, value, icon, highlight = false }: any) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1c2620] border border-[#29382f]">
    <div className="flex items-center justify-between text-[#9cbaa6]">
      <p className="text-xs font-bold uppercase tracking-wider">{title}</p>
      <Icon name={icon} size="sm" />
    </div>
    <p className={`text-2xl font-bold ${highlight ? 'text-[#38e07b]' : 'text-white'}`}>{value}</p>
  </div>
);