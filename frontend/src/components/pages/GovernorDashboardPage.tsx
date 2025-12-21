import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { projectService } from "@/services/projectService";

export const GovernorDashboardPage = () => {
  const navigate = useNavigate();
  // Form State
  const [projectName, setProjectName] = useState("");
  const [contractorAddress, setContractorAddress] = useState("");
  const [budget, setBudget] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState<"NGN" | "SUI">("NGN");
  
  // Milestone State
  const [useAiMilestones, setUseAiMilestones] = useState(true);
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [manualMilestones, setManualMilestones] = useState<string[]>([""]);
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [projectLocation] = useState({ lat: 6.5244, lng: 3.3792 });

  // Handle adding a new empty manual milestone line
  const addManualMilestone = () => {
    setManualMilestones([...manualMilestones, ""]);
  };

  // Handle updating a specific manual milestone
  const updateManualMilestone = (index: number, value: string) => {
    const updated = [...manualMilestones];
    updated[index] = value;
    setManualMilestones(updated);
  };

  // Remove a manual milestone line
  const removeManualMilestone = (index: number) => {
    if (manualMilestones.length > 1) {
      const updated = manualMilestones.filter((_, i) => i !== index);
      setManualMilestones(updated);
    }
  };

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(path);
    }, 500);
  };

  const handleCreateProject = async () => {
    if (!projectName || !contractorAddress || !budget) {
      alert("Please fill in all required fields");
      return;
    }

    // Filter out empty manual milestones
    const validManualMilestones = manualMilestones.filter(m => m.trim() !== "");

    if (!useAiMilestones && validManualMilestones.length === 0) {
      alert("Please add at least one manual milestone.");
      return;
    }

    setIsCreating(true);
    try {
      const projectData = {
        name: projectName,
        description: useAiMilestones ? milestoneDescription : "Manual Milestone Project",
        total_budget: budget,
        budget_currency: budgetCurrency,
        contractor_wallet: contractorAddress,
        use_ai_milestones: useAiMilestones, // Use the state toggle
        manual_milestones: useAiMilestones ? [] : validManualMilestones, // Send manual list if AI is off
        project_latitude: projectLocation.lat,
        project_longitude: projectLocation.lng,
        location_tolerance_km: 1.0,
        gov_wallet: "0x12...89",
        on_chain_id: "0x" + Math.floor(Math.random() * 10000).toString(16),
      };

      await projectService.createProject(projectData);

      // Reset form
      setProjectName("");
      setContractorAddress("");
      setBudget(0);
      setMilestoneDescription("");
      setManualMilestones([""]);

      handleNavigation("/governor/projects");
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. See console for details.");
      setIsCreating(false);
    }
  };

  if (isNavigating) return <LoadingScreen message="Loading Governor Dashboard..." />;

  return (
    <div className="bg-[#111714] text-white overflow-hidden h-screen flex font-display">
      {/* Sidebar */}
      <motion.aside
        className="w-72 bg-[#111714] border-r border-[#29382f] flex-col justify-between hidden lg:flex p-6"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col gap-8">
           <motion.div className="flex gap-3 items-center" whileHover={{ scale: 1.05 }}>
            <div className="bg-center bg-no-repeat bg-cover rounded-full size-12 bg-[#29382f] flex items-center justify-center text-[#38e07b] relative overflow-hidden">
              <div className="absolute inset-0 bg-[#38e07b]/20" />
              <Icon name="policy" className="text-3xl" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-xl font-bold leading-none tracking-tight">Optic-Gov</h1>
              <p className="text-[#9eb7a8] text-xs font-medium uppercase tracking-wider mt-1">Governor Portal</p>
            </div>
          </motion.div>
          <nav className="flex flex-col gap-2">
            <motion.button 
              className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#29382f] text-white w-full text-left" 
              onClick={() => {}}
            >
              <Icon name="add_circle" /><span className="text-sm font-bold">Create Project</span>
            </motion.button>
            <motion.button 
              className="flex items-center gap-3 px-4 py-3 text-[#9eb7a8] hover:text-white hover:bg-[#29382f]/50 rounded-full transition-colors w-full text-left"
              onClick={() => handleNavigation("/governor/projects")}
            >
              <Icon name="folder_open" /><span className="text-sm font-medium">Active Projects</span>
            </motion.button>
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <motion.header className="h-20 border-b border-[#29382f] flex items-center justify-between px-8 bg-[#111714]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-white text-lg font-bold">New Infrastructure Contract</h2>
          <div className="flex gap-3 items-center">
             <span className="text-sm font-bold font-mono text-[#38e07b]">Connected: 0x12...89</span>
          </div>
        </motion.header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-20">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Input Form */}
              <motion.div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* 1. Project Details */}
                <div className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f]">
                  <h3 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
                    <Icon name="article" className="text-[#38e07b]" /> Project Details
                  </h3>
                  <div className="flex flex-col gap-6">
                    <label className="flex flex-col gap-2">
                      <span className="text-white text-sm font-medium">Project Name</span>
                      <input
                        className="w-full bg-[#29382f] border-none rounded-xl text-white placeholder:text-[#9eb7a8] h-14 px-4 focus:ring-2 focus:ring-[#38e07b] transition-all font-medium"
                        placeholder="e.g. Lagos Main Bridge Repair"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col gap-2">
                        <span className="text-white text-sm font-medium">Contractor Wallet</span>
                        <input
                          className="w-full bg-[#29382f] border-none rounded-xl text-white placeholder:text-[#9eb7a8] h-14 px-4 font-mono"
                          placeholder="0x..."
                          value={contractorAddress}
                          onChange={(e) => setContractorAddress(e.target.value)}
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-white text-sm font-medium">Total Budget</span>
                        <CurrencyInput
                          value={budget}
                          onChange={(value, currency) => { setBudget(value); setBudgetCurrency(currency); }}
                          currency={budgetCurrency}
                          onCurrencyChange={setBudgetCurrency}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Milestone Configuration Toggle */}
                <div className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white text-lg font-bold flex items-center gap-2">
                      <Icon name={useAiMilestones ? "smart_toy" : "list_alt"} className="text-[#38e07b]" />
                      Milestone Strategy
                    </h3>
                    <div className="flex bg-[#29382f] rounded-lg p-1">
                      <button
                        onClick={() => setUseAiMilestones(true)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${useAiMilestones ? 'bg-[#38e07b] text-[#111714]' : 'text-[#9eb7a8] hover:text-white'}`}
                      >
                        AI Generated
                      </button>
                      <button
                        onClick={() => setUseAiMilestones(false)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${!useAiMilestones ? 'bg-[#38e07b] text-[#111714]' : 'text-[#9eb7a8] hover:text-white'}`}
                      >
                        Manual Entry
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {useAiMilestones ? (
                      <motion.div 
                        key="ai-input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <label className="flex flex-col gap-2">
                          <span className="text-[#9eb7a8] text-sm">
                            Describe the work. Gemini AI will break this down into 4-6 verifiable milestones.
                          </span>
                          <textarea
                            className="w-full bg-[#29382f] border-none rounded-xl text-white p-4 focus:ring-2 focus:ring-[#38e07b] transition-all"
                            placeholder="e.g. Construct a 5km drainage system..."
                            rows={4}
                            value={milestoneDescription}
                            onChange={(e) => setMilestoneDescription(e.target.value)}
                          />
                        </label>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="manual-input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <p className="text-[#9eb7a8] text-sm">Define specific milestones. The budget will be split equally among them.</p>
                        {manualMilestones.map((milestone, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="flex items-center justify-center w-8 text-[#9eb7a8] font-mono text-sm">{index + 1}.</span>
                            <input
                              className="flex-1 bg-[#29382f] border-none rounded-lg text-white px-4 py-3 focus:ring-1 focus:ring-[#38e07b]"
                              placeholder={`Milestone ${index + 1} Description`}
                              value={milestone}
                              onChange={(e) => updateManualMilestone(index, e.target.value)}
                            />
                            {manualMilestones.length > 1 && (
                              <button onClick={() => removeManualMilestone(index)} className="p-3 text-red-400 hover:bg-red-400/10 rounded-lg">
                                <Icon name="delete" size="sm" />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button variant="secondary" onClick={addManualMilestone} className="w-full border-dashed border-[#38e07b]/30 text-[#38e07b] hover:bg-[#38e07b]/10">
                          <Icon name="add" size="sm" /> Add Another Milestone
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Right Column: Actions */}
              <motion.div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f] shadow-xl">
                  <h4 className="text-white font-bold text-lg mb-4">Contract Summary</h4>
                  <div className="space-y-3 mb-6">
                     <div className="flex justify-between text-sm"><span className="text-[#9eb7a8]">Milestones</span> <span className="text-white">{useAiMilestones ? "Auto-Generated (~4-6)" : `${manualMilestones.filter(m => m).length} defined`}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-[#9eb7a8]">Network</span> <span className="text-[#38e07b]">Sui Mainnet</span></div>
                  </div>
                  
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[#9eb7a8] text-sm font-medium pb-1">Total Locked</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white block">{budget || "0.00"}</span>
                      <span className="text-xs text-[#9eb7a8]">{budgetCurrency}</span>
                    </div>
                  </div>

                  <motion.button
                    className="w-full bg-[#38e07b] hover:bg-[#2bc466] text-[#111714] h-14 rounded-full font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={handleCreateProject}
                    disabled={isCreating}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCreating ? <span>Deploying...</span> : <span>Deploy Contract</span>}
                  </motion.button>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};