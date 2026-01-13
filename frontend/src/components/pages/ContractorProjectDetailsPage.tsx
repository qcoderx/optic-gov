import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types/project';

export const ContractorProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const projectData = await projectService.getProject(parseInt(projectId));
        setProject(projectData);
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  // --- REDIRECT LOGIC ---
  const handleSubmitEvidence = (milestoneId: number, index: number) => {
    if (!project?.on_chain_id) {
      alert("Project not synced with blockchain yet.");
      return;
    }

    // Redirect to the milestone submission page
    // We pass state so the next page knows the context (On-chain ID and title)
    navigate(`/contractor/milestone/${milestoneId}`, {
      state: {
        projectOnChainId: project.on_chain_id,
        milestoneIndex: index,
        milestoneTitle: project.milestones?.[index]?.description || "Milestone Submission"
      }
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d120f] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#38e07b]"></div>
    </div>
  );

  // --- CALCULATIONS (Fixed Naming Mismatches) ---
  const totalMNT = project?.total_budget_mnt || project?.budget || 0;
  const milestonesList = project?.milestones || [];
  const milestonesCount = milestonesList.length || 1;

  const completedCount = milestonesList.filter((m: any) => 
    m.status === 'completed' || m.status === 'verified'
  ).length;

  const earnedMNT = (completedCount / milestonesCount) * totalMNT;
  const remainingMNT = totalMNT - earnedMNT;

  return (
    <div className="min-h-screen bg-[#0d120f] text-white font-display">
      {/* Top Navigation */}
      <header className="border-b border-[#29382f] bg-[#0d120f]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <Icon name="arrow_back" size="sm" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#38e07b] bg-[#38e07b]/10 px-3 py-1 rounded-full border border-[#38e07b]/20">
              CONTRACTOR MODE
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT: Project Overview & Milestone List */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <section>
              <h1 className="text-4xl font-black mb-2">{project?.name || "Project Details"}</h1>
              <p className="text-gray-400 max-w-2xl">{project?.description}</p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Icon name="assignment" className="text-[#38e07b]" />
                  Work Schedule
                </h3>
                <span className="text-sm text-gray-500">{milestonesCount} Milestones Total</span>
              </div>

              <div className="space-y-4">
                {milestonesList.map((m: any, index: number) => (
                  <div 
                    key={m.id} 
                    className={`bg-[#161f1a] border rounded-xl p-6 transition-all ${
                      m.status === 'pending' ? 'border-[#38e07b]/30 bg-[#1a261f]' : 'border-[#29382f]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="size-6 rounded-full bg-[#29382f] flex items-center justify-center text-xs font-bold text-gray-400">
                            {index + 1}
                          </span>
                          <h4 className="text-lg font-bold text-white">{m.description}</h4>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-[#38e07b] font-mono text-sm">
                            <Icon name="payments" size="sm" />
                            {/* Uses specific amount or calculated split */}
                            {(m.amount || totalMNT / milestonesCount).toFixed(4)} MNT
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                            Status: <span className={m.status === 'completed' || m.status === 'verified' ? 'text-[#38e07b]' : 'text-yellow-500'}>{m.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Leads to submission page */}
                      {(m.status !== 'completed' && m.status !== 'verified') && (
                        <button
                          onClick={() => handleSubmitEvidence(m.id, index)}
                          className="flex items-center gap-2 bg-[#38e07b] hover:bg-[#2fb865] text-black px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#38e07b]/10"
                        >
                          <Icon name="cloud_upload" />
                          Submit Proof
                        </button>
                      )}

                      {(m.status === 'completed' || m.status === 'verified') && (
                        <div className="flex items-center gap-2 text-[#38e07b] bg-[#38e07b]/10 px-4 py-2 rounded-lg border border-[#38e07b]/20">
                          <Icon name="check_circle" />
                          <span className="text-sm font-bold uppercase">Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: Financial Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-[#161f1a] border border-[#29382f] rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-6">Contract Finances</h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-black/20 rounded-xl border border-[#29382f]">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Contract Value</p>
                  <p className="text-3xl font-black text-white">{totalMNT.toFixed(4)} <span className="text-[#38e07b] text-sm">MNT</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Earned</p>
                    <p className="text-xl font-bold text-[#38e07b]">{earnedMNT.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Remaining</p>
                    <p className="text-xl font-bold text-white">{remainingMNT.toFixed(4)}</p>
                  </div>
                </div>

                <hr className="border-[#29382f]" />

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#38e07b]/10 flex items-center justify-center text-[#38e07b]">
                            <Icon name="account_balance" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Mantle Smart Contract</p>
                            <p className="text-xs font-mono text-gray-300 truncate w-40">
                                {project?.on_chain_id ? `Project #${project.on_chain_id}` : 'Pending Sync...'}
                            </p>
                        </div>
                    </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <div className="flex gap-3">
                  <Icon name="info" className="text-yellow-500 flex-shrink-0" />
                  <p className="text-[11px] text-yellow-500/80 leading-relaxed">
                    Proof of work is analyzed by Gemini AI Oracle. Once verified, funds are released automatically to your connected wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};