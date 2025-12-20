import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { projectService } from "@/services/projectService";

export const GovernorDashboardPage = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [contractorAddress, setContractorAddress] = useState("");
  const [budget, setBudget] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState<"NGN" | "ETH">("NGN");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [projectLocation] = useState({ lat: 6.5244, lng: 3.3792 }); // Default to Lagos

  const handleCreateProject = async () => {
    if (!projectName || !contractorAddress || !budget) {
      console.log("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const projectData = {
        name: projectName,
        description: milestoneDescription || "Infrastructure project",
        total_budget: budget,
        budget_currency: budgetCurrency,
        contractor_wallet: contractorAddress,
        use_ai_milestones: true,
        project_latitude: projectLocation.lat,
        project_longitude: projectLocation.lng,
        location_tolerance_km: 1.0,
        gov_wallet: "0x12...89", // This should come from connected wallet
        on_chain_id: Math.floor(Math.random() * 10000),
      };

      await projectService.createProject(projectData);

      // Reset form
      setProjectName("");
      setContractorAddress("");
      setBudget(0);
      setMilestoneDescription("");

      // Redirect to active projects page
      setTimeout(() => {
        navigate("/governor/projects");
      }, 500);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isNavigating) {
    return <LoadingScreen message="Loading Governor Dashboard..." />;
  }

  return (
    <div className="bg-[#111714] text-white overflow-hidden h-screen flex font-display">
      {/* Sidebar Navigation */}
      <motion.aside
        className="w-72 bg-[#111714] border-r border-[#29382f] flex-col justify-between hidden lg:flex p-6"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col gap-8">
          {/* App Logo/Title */}
          <motion.div
            className="flex gap-3 items-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="bg-center bg-no-repeat bg-cover rounded-full size-12 bg-[#29382f] flex items-center justify-center text-[#38e07b] relative overflow-hidden">
              <div className="absolute inset-0 bg-[#38e07b]/20" />
              <Icon name="policy" className="text-3xl" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-xl font-bold leading-none tracking-tight">
                Optic-Gov
              </h1>
              <p className="text-[#9eb7a8] text-xs font-medium uppercase tracking-wider mt-1">
                Governor Portal
              </p>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <motion.a
              className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#29382f] text-white transition-colors"
              href="#"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon name="add_circle" />
              <span className="text-sm font-bold">Create Project</span>
            </motion.a>
            <motion.button
              className="flex items-center gap-3 px-4 py-3 text-[#9eb7a8] hover:text-white hover:bg-[#29382f]/50 rounded-full transition-colors w-full text-left"
              onClick={() => {
                setIsNavigating(true);
                setTimeout(() => {
                  window.location.href = "/governor/dashboard";
                }, 1500);
              }}
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="dashboard" />
              <span className="text-sm font-medium">Dashboard</span>
            </motion.button>
            <motion.button
              className="flex items-center gap-3 px-4 py-3 text-[#9eb7a8] hover:text-white hover:bg-[#29382f]/50 rounded-full transition-colors w-full text-left"
              onClick={() => navigate("/governor/projects")}
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="folder_open" />
              <span className="text-sm font-medium">Active Projects</span>
            </motion.button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4">
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-br from-[#29382f] to-transparent border border-[#29382f]/50"
            animate={{
              boxShadow: [
                "0 0 0 rgba(56,224,123,0)",
                "0 0 20px rgba(56,224,123,0.1)",
                "0 0 0 rgba(56,224,123,0)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="flex items-center gap-2 mb-2 text-[#38e07b]">
              <Icon name="verified_user" size="sm" />
              <span className="text-xs font-bold uppercase">
                Security Active
              </span>
            </div>
            <p className="text-[#9eb7a8] text-xs">
              Your session is secured via hardware enclave.
            </p>
          </motion.div>
          <motion.a
            className="flex items-center gap-3 px-4 py-3 text-[#9eb7a8] hover:text-white transition-colors"
            href="#"
            whileHover={{ scale: 1.02 }}
          >
            <Icon name="settings" />
            <span className="text-sm font-medium">Settings</span>
          </motion.a>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <motion.header
          className="h-20 border-b border-[#29382f] flex items-center justify-between px-8 bg-[#111714]/80 backdrop-blur-md sticky top-0 z-10"
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-white">
              <Icon name="menu" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-white text-lg font-bold">
                New Infrastructure Contract
              </h2>
              <div className="flex items-center gap-2 text-[#9eb7a8] text-xs">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-[#38e07b]"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span>Ethereum Mainnet</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <motion.button
              className="flex items-center gap-2 bg-[#29382f] hover:bg-[#35463b] text-white px-4 py-2 rounded-full transition-all border border-transparent hover:border-[#38e07b]/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-[#38e07b]"
                animate={{
                  boxShadow: [
                    "0 0 8px rgba(56,224,123,0.6)",
                    "0 0 16px rgba(56,224,123,0.8)",
                    "0 0 8px rgba(56,224,123,0.6)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-bold font-mono">0x12...89</span>
            </motion.button>
            <motion.button
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#29382f] text-white hover:bg-[#35463b] transition-colors relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border border-[#111714]" />
              <Icon name="notifications" size="sm" />
            </motion.button>
            <div
              className="w-10 h-10 rounded-full bg-gray-600 bg-cover bg-center border-2 border-[#29382f]"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face')",
              }}
            />
          </div>
        </motion.header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-20">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            {/* Page Heading Section */}
            <motion.div
              className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex flex-col gap-2 max-w-2xl">
                <h1 className="text-white text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Initiate New{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38e07b] to-emerald-200">
                    Public Work
                  </span>
                </h1>
                <p className="text-[#9eb7a8] text-lg">
                  Define project parameters, set AI verification milestones, and
                  escrow funds via Smart Contract.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="text-[#9eb7a8] hover:text-white"
                >
                  Save Draft
                </Button>
                <Button
                  variant="secondary"
                  className="text-[#38e07b] bg-[#38e07b]/10 border-[#38e07b]/20 hover:bg-[#38e07b]/20"
                >
                  Template Library
                </Button>
              </div>
            </motion.div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form */}
              <motion.div
                className="lg:col-span-8 flex flex-col gap-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {/* Basic Info Card */}
                <div className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f]">
                  <h3 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
                    <Icon name="article" className="text-[#38e07b]" />
                    Project Details
                  </h3>
                  <div className="flex flex-col gap-6">
                    <label className="flex flex-col gap-2">
                      <span className="text-white text-sm font-medium">
                        Project Name
                      </span>
                      <input
                        className="w-full bg-[#29382f] border-none rounded-xl text-white placeholder:text-[#9eb7a8] h-14 px-4 focus:ring-2 focus:ring-[#38e07b] focus:ring-opacity-50 transition-all font-medium"
                        placeholder="e.g. Lagos Main Bridge Repair"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col gap-2">
                        <span className="text-white text-sm font-medium">
                          Contractor Wallet Address
                        </span>
                        <div className="relative">
                          <input
                            className="w-full bg-[#29382f] border-none rounded-xl text-white placeholder:text-[#9eb7a8] h-14 pl-4 pr-12 focus:ring-2 focus:ring-[#38e07b] focus:ring-opacity-50 transition-all font-mono"
                            placeholder="0x..."
                            type="text"
                            value={contractorAddress}
                            onChange={(e) =>
                              setContractorAddress(e.target.value)
                            }
                          />
                          <motion.button
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9eb7a8] hover:text-white p-2"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Icon name="content_paste" size="sm" />
                          </motion.button>
                        </div>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-white text-sm font-medium">
                          Total Budget Allocation
                        </span>
                        <CurrencyInput
                          value={budget}
                          onChange={(value, currency) => {
                            setBudget(value);
                            setBudgetCurrency(currency);
                          }}
                          currency={budgetCurrency}
                          onCurrencyChange={setBudgetCurrency}
                          placeholder={
                            budgetCurrency === "NGN" ? "50000000" : "5.0"
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* AI Milestone Card */}
                <motion.div
                  className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f] relative overflow-hidden group"
                  whileHover={{ borderColor: "#38e07b40" }}
                >
                  {/* Gradient decoration */}
                  <motion.div
                    className="absolute top-0 right-0 w-64 h-64 bg-[#38e07b]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-white text-lg font-bold flex items-center gap-2">
                      <Icon name="smart_toy" className="text-[#38e07b]" />
                      Milestone 1 Criteria (AI Oracle)
                    </h3>
                    <motion.div
                      className="px-2 py-1 bg-[#38e07b]/20 rounded text-[#38e07b] text-xs font-bold uppercase tracking-wide"
                      animate={{
                        boxShadow: [
                          "0 0 0 rgba(56,224,123,0)",
                          "0 0 10px rgba(56,224,123,0.3)",
                          "0 0 0 rgba(56,224,123,0)",
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      Powered by Gemini 2.5
                    </motion.div>
                  </div>
                  <label className="flex flex-col gap-2 relative z-10">
                    <span className="text-[#9eb7a8] text-sm">
                      Describe the visual evidence required for funds release.
                      The AI will verify uploaded photos against this prompt.
                    </span>
                    <textarea
                      className="w-full bg-[#29382f] border-none rounded-xl text-white placeholder:text-[#9eb7a8] p-4 focus:ring-2 focus:ring-[#38e07b] focus:ring-opacity-50 transition-all resize-none leading-relaxed"
                      placeholder="e.g. High-angle photo of freshly poured concrete foundation with visible rebar reinforcement grid. Must show at least 4 corner pilings."
                      rows={4}
                      value={milestoneDescription}
                      onChange={(e) => setMilestoneDescription(e.target.value)}
                    />
                  </label>
                  <div className="mt-4 flex gap-2">
                    <motion.button
                      className="text-xs font-bold text-[#38e07b] hover:text-white bg-[#38e07b]/10 hover:bg-[#38e07b]/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon name="auto_awesome" size="sm" />
                      Enhance Prompt with AI
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: Summary & Actions */}
              <motion.div
                className="lg:col-span-4 flex flex-col gap-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {/* Summary Card */}
                <div className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f] flex flex-col gap-4 shadow-xl">
                  <h4 className="text-white font-bold text-lg">
                    Contract Summary
                  </h4>
                  <div className="flex flex-col gap-3 py-4 border-y border-[#29382f]">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#9eb7a8]">Network Status</span>
                      <span className="text-[#38e07b] font-medium flex items-center gap-1">
                        <motion.span
                          className="w-2 h-2 rounded-full bg-[#38e07b]"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#9eb7a8]">Est. Gas Fee</span>
                      <span className="text-white font-mono">0.0042 ETH</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#9eb7a8]">Oracle Fee</span>
                      <span className="text-white font-mono">0.0100 ETH</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[#9eb7a8] text-sm font-medium pb-1">
                      Total Value Locked
                    </span>
                    <div className="flex flex-col items-end">
                      <motion.span
                        className="text-3xl font-bold text-white tracking-tight"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {budget
                          ? budgetCurrency === "ETH"
                            ? (budget + 0.0142).toFixed(4)
                            : (budget / 4500000 + 0.0142).toFixed(4)
                          : "5.0142"}
                      </motion.span>
                      <span className="text-xs text-[#9eb7a8] font-mono">
                        ETH
                      </span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <motion.button
                      className="w-full bg-[#38e07b] hover:bg-[#2bc466] text-[#111714] h-14 rounded-full font-bold text-lg shadow-[0_4px_14px_0_rgba(56,224,123,0.39)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: isCreating ? 1 : 1.02 }}
                      whileTap={{ scale: isCreating ? 1 : 0.98 }}
                      onClick={handleCreateProject}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Icon
                            name="hourglass_empty"
                            className="animate-spin"
                          />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <span>Deploy & Fund</span>
                          <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Icon name="arrow_forward" />
                          </motion.div>
                        </>
                      )}
                    </motion.button>
                    <p className="text-center text-xs text-[#9eb7a8] mt-3">
                      By deploying, you agree to the{" "}
                      <a className="text-[#38e07b] hover:underline" href="#">
                        DAO Constitution
                      </a>
                      .
                    </p>
                  </div>
                </div>

                {/* Map Preview */}
                <motion.div
                  className="bg-[#1a211e] rounded-xl border border-[#29382f] overflow-hidden h-48 relative group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=400&h=300&fit=crop')",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111714] to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-1 text-white font-bold text-sm">
                      <Icon
                        name="location_on"
                        className="text-[#38e07b]"
                        size="sm"
                      />
                      Set Location Geofence
                    </div>
                    <p className="text-xs text-[#9eb7a8] ml-5">
                      Optional: Restrict AI validation to coordinates.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
