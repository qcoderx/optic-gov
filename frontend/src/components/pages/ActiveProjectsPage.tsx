import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types/project';

export const ActiveProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAllProjects();
      // Handle different response structures
      const projectsArray = response.projects || response || [];
      const transformedProjects = Array.isArray(projectsArray) 
        ? projectsArray.map(project => projectService.transformProject(project))
        : [];
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/governor');
    }, 1000);
  };

  const handleViewProject = (projectId: string | number) => {
    navigate(`/project/${projectId}`);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading Active Projects..." />;
  }

  if (isNavigating) {
    return <LoadingScreen message="Navigating to Project Creation..." />;
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
              <h1 className="text-white text-xl font-bold leading-none tracking-tight">Optic-Gov</h1>
              <p className="text-[#9eb7a8] text-xs font-medium uppercase tracking-wider mt-1">Governor Portal</p>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <motion.button 
              className="flex items-center gap-3 px-4 py-3 text-[#9eb7a8] hover:text-white hover:bg-[#29382f]/50 rounded-full transition-colors w-full text-left"
              onClick={handleCreateNew}
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="add_circle" />
              <span className="text-sm font-medium">Create Project</span>
            </motion.button>
            <motion.button 
              className="flex items-center gap-3 px-4 py-3 text-[#9eb7a8] hover:text-white hover:bg-[#29382f]/50 rounded-full transition-colors w-full text-left"
              onClick={() => navigate('/governor/dashboard')}
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="dashboard" />
              <span className="text-sm font-medium">Dashboard</span>
            </motion.button>
            <motion.div 
              className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#29382f] text-white transition-colors"
            >
              <Icon name="folder_open" />
              <span className="text-sm font-bold">Active Projects</span>
            </motion.div>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4">
          <motion.div 
            className="p-4 rounded-xl bg-gradient-to-br from-[#29382f] to-transparent border border-[#29382f]/50"
            animate={{ 
              boxShadow: ['0 0 0 rgba(56,224,123,0)', '0 0 20px rgba(56,224,123,0.1)', '0 0 0 rgba(56,224,123,0)']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="flex items-center gap-2 mb-2 text-[#38e07b]">
              <Icon name="verified_user" size="sm" />
              <span className="text-xs font-bold uppercase">Security Active</span>
            </div>
            <p className="text-[#9eb7a8] text-xs">Your session is secured via hardware enclave.</p>
          </motion.div>
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
            <div className="flex flex-col">
              <h2 className="text-white text-lg font-bold">Active Infrastructure Projects</h2>
              <div className="flex items-center gap-2 text-[#9eb7a8] text-xs">
                <motion.span 
                  className="w-1.5 h-1.5 rounded-full bg-[#38e07b]"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span>{projects.length} Active Projects</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Button 
              onClick={handleCreateNew}
              className="bg-[#38e07b] hover:bg-[#2bc466] text-[#111714] font-bold"
            >
              <Icon name="add" size="sm" />
              New Project
            </Button>
          </div>
        </motion.header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-20">
          <div className="max-w-6xl mx-auto">
            {projects.length === 0 ? (
              <motion.div 
                className="flex flex-col items-center justify-center h-96 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-24 h-24 rounded-full bg-[#29382f] flex items-center justify-center mb-6">
                  <Icon name="folder_open" className="text-4xl text-[#9eb7a8]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Active Projects</h3>
                <p className="text-[#9eb7a8] mb-6 max-w-md">
                  You haven't created any infrastructure projects yet. Start by creating your first project.
                </p>
                <Button 
                  onClick={handleCreateNew}
                  className="bg-[#38e07b] hover:bg-[#2bc466] text-[#111714] font-bold"
                >
                  <Icon name="add_circle" size="sm" />
                  Create First Project
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    className="bg-[#1a211e] rounded-xl p-6 border border-[#29382f] hover:border-[#38e07b]/30 transition-all cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleViewProject(project.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#38e07b] animate-pulse" />
                        <span className="text-xs font-bold text-[#38e07b] uppercase tracking-wide">Active</span>
                      </div>
                      <Icon name="arrow_forward" className="text-[#9eb7a8] group-hover:text-white transition-colors" size="sm" />
                    </div>
                    
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                      {project.title || project.name}
                    </h3>
                    
                    <div className="flex gap-2 mb-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/contractor/project/${project.id}`, '_blank');
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-medium"
                      >
                        📋 Contractor View
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/contractor/milestone/1`, '_blank');
                        }}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded font-medium"
                      >
                        📹 Submit Evidence
                      </button>
                    </div>
                    
                    <p className="text-[#9eb7a8] text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="text-[#9eb7a8]">Budget</span>
                        <span className="text-white font-mono font-bold">
                          {project.budget_currency === 'SUI' 
                            ? `${project.budget} SUI`
                            : `₦${project.total_budget_ngn?.toLocaleString() || project.budget?.toLocaleString()}`
                          }
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[#9eb7a8]">Location</span>
                        <div className="flex items-center gap-1">
                          <Icon name="location_on" size="sm" className="text-[#38e07b]" />
                          <span className="text-white text-xs">
                            {project.coordinates ? 'Set' : 'Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
