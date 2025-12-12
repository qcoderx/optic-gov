import { motion } from 'framer-motion';
import { GoogleMap } from '@/components/map/GoogleMap';
import { ProjectSidebar } from '@/components/dashboard/ProjectSidebar';
import { StatsHUD } from '@/components/dashboard/StatsHUD';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useProjects } from '@/hooks/useProjects';

export const DashboardPage = () => {
  const { 
    projects, 
    selectedProject, 
    filters, 
    updateFilters, 
    setSelectedProject 
  } = useProjects();

  return (
    <div className="bg-[#122017] text-white font-display overflow-hidden h-screen w-screen relative">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <GoogleMap
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
          center={{ lat: 40.7589, lng: -73.9851 }}
          zoom={12}
        />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col h-full w-full pointer-events-none">
        {/* Header */}
        <motion.header 
          className="w-full flex flex-col xl:flex-row items-center justify-between p-4 md:px-8 pt-6 gap-4 pointer-events-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3 bg-[#1c2620]/80 backdrop-blur-md pl-2 pr-6 py-2 rounded-full border border-[#29382f] shadow-xl"
            whileHover={{ scale: 1.05 }}
          >
            <div className="size-10 bg-gradient-to-br from-primary to-emerald-800 rounded-full flex items-center justify-center text-[#122017]">
              <Icon name="visibility" className="text-2xl" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold leading-none tracking-tight">
                Optic-Gov
              </h1>
              <span className="text-primary text-[10px] uppercase tracking-widest font-semibold opacity-80">
                Transparency Layer
              </span>
            </div>
          </motion.div>

          <StatsHUD />

          {/* Actions */}
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.button 
              className="size-11 flex items-center justify-center rounded-full bg-[#1c2620]/80 backdrop-blur-md border border-[#29382f] text-white hover:bg-[#29382f] transition-colors relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon name="notifications" />
              <span className="absolute top-2 right-2.5 size-2.5 bg-red-500 rounded-full border-2 border-[#1c2620]" />
            </motion.button>
            
            <Button
              className="h-11 px-6 rounded-full bg-primary hover:bg-green-400 text-[#122017] font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(56,224,123,0.3)]"
            >
              <Icon name="account_balance_wallet" size="sm" className="mr-2" />
              Connect Wallet
            </Button>
          </motion.div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden p-4 md:px-8 pb-8 gap-6">
          <ProjectSidebar
            projects={projects}
            selectedProject={selectedProject}
            filters={filters}
            onProjectSelect={setSelectedProject}
            onFiltersChange={updateFilters}
          />

          {/* Evidence Modal */}
          {selectedProject && (
            <motion.div 
              className="flex-1 flex items-center justify-center relative pointer-events-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="pointer-events-auto bg-[#1c2620]/95 backdrop-blur-2xl border border-[#29382f] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col relative">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#29382f]">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                      <Icon name="verified_user" className="text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Evidence Vault</h2>
                      <p className="text-sm text-primary flex items-center gap-1">
                        <Icon name="lock" className="text-sm" />
                        {selectedProject.title}
                      </p>
                    </div>
                  </div>
                  <motion.button 
                    className="text-gray-400 hover:text-white transition-colors bg-[#29382f]/50 hover:bg-[#29382f] rounded-full p-2"
                    onClick={() => setSelectedProject(null)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon name="close" />
                  </motion.button>
                </div>

                {/* Modal Body */}
                <div className="p-6 flex flex-col gap-6">
                  {selectedProject.evidence && (
                    <>
                      {/* Video/Image Section */}
                      <div className="rounded-xl overflow-hidden bg-black border border-[#29382f] relative group">
                        <div className="aspect-video w-full bg-[#29382f]/50 relative">
                          <img 
                            className="w-full h-full object-cover opacity-60"
                            src={selectedProject.evidence.imageUrl}
                            alt="Project evidence"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.button 
                              className="size-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:text-[#122017] hover:border-primary transition-all"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Icon name="play_arrow" className="text-4xl ml-1" />
                            </motion.button>
                          </div>
                          
                          {/* AI Analysis Overlay */}
                          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                            <div className="bg-black/70 backdrop-blur-md p-3 rounded-lg border border-white/10 max-w-sm">
                              <p className="text-[10px] text-primary uppercase font-bold mb-1 flex items-center gap-1">
                                <Icon name="smart_toy" className="text-xs" />
                                Gemini 2.5 Flash Analysis
                              </p>
                              <p className="text-xs text-white leading-relaxed">
                                {selectedProject.evidence.aiAnalysis}
                              </p>
                            </div>
                            <div className="bg-primary/90 text-[#122017] font-bold px-3 py-1.5 rounded-lg text-xs shadow-lg shadow-primary/20">
                              {selectedProject.aiConfidence}% Confidence
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Data */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#122017] rounded-xl p-4 border border-[#29382f]">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                            Last Transaction Hash
                          </p>
                          <div className="flex items-center gap-2 text-white font-mono text-sm">
                            <span className="truncate">{selectedProject.evidence.transactionHash}</span>
                            <motion.button 
                              className="text-gray-400 hover:text-white"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Icon name="content_copy" className="text-sm" />
                            </motion.button>
                          </div>
                        </div>
                        <div className="bg-[#122017] rounded-xl p-4 border border-[#29382f]">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                            Funds Released
                          </p>
                          <div className="flex items-center gap-2 text-white font-mono text-sm">
                            <span>{selectedProject.evidence.fundsReleased}.00 ETH</span>
                            <span className="text-xs text-gray-500">(Milestone 3)</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 pt-2 border-t border-[#29382f] flex justify-end gap-3">
                  <Button variant="secondary" className="border-[#29382f] text-white hover:bg-[#29382f]">
                    View Smart Contract
                  </Button>
                  <Button className="bg-primary text-[#122017] hover:bg-green-400 shadow-[0_0_15px_rgba(56,224,123,0.2)]">
                    Release Next Batch
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <motion.div 
        className="absolute bottom-8 right-8 z-20 flex flex-col gap-2 pointer-events-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.button 
          className="size-10 bg-[#1c2620]/90 backdrop-blur text-white rounded-full flex items-center justify-center border border-[#29382f] hover:bg-[#29382f] shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon name="add" />
        </motion.button>
        <motion.button 
          className="size-10 bg-[#1c2620]/90 backdrop-blur text-white rounded-full flex items-center justify-center border border-[#29382f] hover:bg-[#29382f] shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon name="remove" />
        </motion.button>
        <motion.button 
          className="size-10 bg-primary text-[#122017] rounded-full flex items-center justify-center shadow-lg mt-2 hover:bg-green-400 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon name="my_location" />
        </motion.button>
      </motion.div>
    </div>
  );
};