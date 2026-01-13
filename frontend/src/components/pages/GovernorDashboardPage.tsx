import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import debounce from "lodash/debounce";
import { ethers } from "ethers";
import { mantleService } from "@/services/mantleService";
import { aiService } from "@/services/aiService";

// UI & Services
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { projectService } from "@/services/projectService";
import { ProjectCreateRequest } from "@/types/project";
import { currencyService } from "@/services/currencyService"; // Import service

export const GovernorDashboardPage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  // Form State
  const [projectName, setProjectName] = useState("");
  const [contractorAddress, setContractorAddress] = useState("");
  const [budget, setBudget] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState<"NGN" | "MNT">("NGN");
  const [mntEquivalent, setMntEquivalent] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  
  const [useAiMilestones, setUseAiMilestones] = useState(true);
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [manualMilestones, setManualMilestones] = useState<string[]>([""]);
  
  const [isNavigating, ] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Unified Conversion Logic
  const updateConversion = useCallback(
    debounce(async (amount: number, curr: string) => {
      if (!amount || amount <= 0) {
        setMntEquivalent(0);
        return;
      }
      setIsConverting(true);
      try {
        if (curr === "NGN") {
          // Use service instead of raw fetch to avoid URL errors
          const result = await currencyService.quickConvertNgnToMnt(amount);
          setMntEquivalent(result);
        } else {
          setMntEquivalent(amount);
        }
      } catch (error) {
        console.error("Conversion error:", error);
      } finally {
        setIsConverting(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    updateConversion(budget, budgetCurrency);
  }, [budget, budgetCurrency, updateConversion]);

  const handleCreateProject = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet to create a project.");
      return;
    }

    setIsCreating(true);
    try {
      // Step 1: Get milestone descriptions, from AI if needed
      let milestoneDescriptions: string[];
      if (useAiMilestones) {
        if (!milestoneDescription)
          throw new Error("AI milestone generation requires a project description.");
        const aiResponse = await aiService.generateMilestones({
          project_description: milestoneDescription,
          total_budget: mntEquivalent,
        });
        milestoneDescriptions = aiResponse.milestones;
      } else {
        milestoneDescriptions = manualMilestones.filter((m) => m.trim());
      }

      if (milestoneDescriptions.length === 0) {
        throw new Error("At least one milestone description is required.");
      }
      
      // Step 2: Deploy to Mantle Smart Contract (Blockchain-First)
      // Replace this section in GovernorDashboardPage.tsx

      // Step 2: Deploy to Mantle Smart Contract (Blockchain-First)
      const count = milestoneDescriptions.length;

      // CRITICAL: Convert total budget to Wei FIRST, then divide
      // This ensures we're working with the exact total that matches the backend
      const totalBudgetWei = ethers.parseEther(mntEquivalent.toString());

      // Calculate milestone amount by dividing the Wei total
      const milestoneWei = totalBudgetWei / BigInt(count);

      // Create array of milestone amounts (all the same)
      const milestoneAmounts = Array(count).fill(milestoneWei.toString());

      console.log("💰 Budget Calculation:", {
        mntEquivalent,
        totalBudgetWei: totalBudgetWei.toString(),
        milestoneCount: count,
        milestoneWei: milestoneWei.toString(),
        milestoneAmountMNT: ethers.formatEther(milestoneWei),
        totalValueWei: totalBudgetWei.toString() // Send the original total, not recalculated
      });

      const { projectId: onChainId, txHash } = await mantleService.createProject(
        contractorAddress,
        milestoneAmounts,
        milestoneDescriptions,
        totalBudgetWei.toString() // Use the original total budget
      );

      // Step 3: If blockchain succeeds, create record in the backend
      const projectData: ProjectCreateRequest = {
        name: projectName,
        description: milestoneDescription,
        total_budget: mntEquivalent,
        budget_currency: "MNT",
        contractor_wallet: contractorAddress,
        use_ai_milestones: useAiMilestones,
        manual_milestones: milestoneDescriptions, // Send the final list of milestones
        project_latitude: 6.5244,
        project_longitude: 3.3792,
        gov_wallet: address,
        on_chain_id: onChainId.toString(), // Use the REAL ID from the blockchain event
      };

      await projectService.createProject(projectData);

      console.log(
        `Project created successfully on-chain with ID ${onChainId} (Tx: ${txHash}) and saved to backend.`
      );

      navigate("/governor/projects");
    } catch (error: unknown) {
      console.error("Project creation failed:", error);
      if (error instanceof Error) {
        alert(`Error: ${error.message || "An unexpected error occurred."}`);
      } else {
        alert("An unexpected error occurred.");
      }
    } finally {
      setIsCreating(false);
    }
  };
  
  if (isNavigating) return <LoadingScreen message="Loading..." />;

  return (
    <div className="bg-[#111714] text-white overflow-hidden h-screen flex font-display">
      <aside className="w-72 bg-[#111714] border-r border-[#29382f] hidden lg:flex flex-col p-6 gap-8">
          <div className="flex gap-3 items-center">
            <div className="rounded-lg size-10 bg-[#38e07b]/10 flex items-center justify-center text-[#38e07b]">
              <Icon name="policy" />
            </div>
            <h1 className="text-white text-lg font-bold">Optic-Gov</h1>
          </div>
          <nav className="flex flex-col gap-2">
            <button className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#29382f] text-white text-sm font-bold">
              <Icon name="add_circle" /> Create Project
            </button>
          </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 border-b border-[#29382f] flex items-center justify-between px-8 bg-[#111714]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-white text-lg font-bold">New Infrastructure Contract</h2>
          <ConnectKitButton />
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
            <div className="col-span-8 flex flex-col gap-6">
              <div className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f]">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Icon name="article" className="text-[#38e07b]" /> Project Details
                </h3>
                <div className="space-y-6">
                  <label className="block space-y-2">
                    <span className="text-sm">Project Name</span>
                    <input className="w-full bg-[#29382f] rounded-xl h-14 px-4 outline-none" value={projectName} onChange={(e)=>setProjectName(e.target.value)}placeholder="Lagos Mainland Bridge" />
                  </label>
                  <div className="grid grid-cols-2 gap-6">
                    <label className="block space-y-2">
                      <span className="text-sm">Contractor Wallet</span>
                      <input className="w-full bg-[#29382f] rounded-xl h-14 px-4 font-mono outline-none" value={contractorAddress} onChange={(e)=>setContractorAddress(e.target.value)} placeholder="0x...ABC"/>
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm">Budget Definition</span>
                      <CurrencyInput 
                        value={budget} 
                        onChange={(v, c) => { setBudget(v); setBudgetCurrency(c); }} 
                        currency={budgetCurrency} 
                        onCurrencyChange={setBudgetCurrency} 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f]">
                <h3 className="text-white font-bold mb-4">Milestone Strategy</h3>
                <div className="flex bg-[#29382f] w-fit rounded-lg p-1 mb-4">
                  <button onClick={()=>setUseAiMilestones(true)} className={`px-4 py-2 rounded-md text-sm ${useAiMilestones ? 'bg-[#38e07b] text-black' : ''}`}>AI Mode</button>
                  <button onClick={()=>setUseAiMilestones(false)} className={`px-4 py-2 rounded-md text-sm ${!useAiMilestones ? 'bg-[#38e07b] text-black' : ''}`}>Manual</button>
                </div>
                {useAiMilestones ? (
                   <textarea className="w-full bg-[#29382f] rounded-xl p-4 h-32 outline-none" value={milestoneDescription} onChange={(e)=>setMilestoneDescription(e.target.value)} placeholder="Describe scope..." />
                ) : (
                  <div className="space-y-2">
                    {manualMilestones.map((m, i) => (
                      <input key={i} className="w-full bg-[#29382f] rounded-lg px-4 py-2 outline-none" value={m} onChange={(e)=>{
                        const next = [...manualMilestones]; next[i] = e.target.value; setManualMilestones(next);
                      }} />
                    ))}
                    <Button onClick={()=>setManualMilestones([...manualMilestones, ""])}>+ Add</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-4">
              <div className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f] sticky top-10">
                <h4 className="font-bold mb-4">Contract Preview</h4>
                <div className="bg-black/20 rounded-lg p-4 mb-6 border border-[#29382f]">
                  <p className="text-xs text-gray-400 mb-1 uppercase">Staking Amount</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {isConverting ? "..." : mntEquivalent.toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </span>
                    <span className="text-[#38e07b] font-bold">MNT</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">Verified via Mantle Network</p>
                </div>
                <button 
                  className="w-full bg-[#38e07b] text-black font-bold h-14 rounded-full disabled:opacity-50"
                  onClick={handleCreateProject}
                  disabled={isCreating || isConverting || budget <= 0}
                >
                  {isCreating ? "Deploying..." : "Deploy Contract"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};