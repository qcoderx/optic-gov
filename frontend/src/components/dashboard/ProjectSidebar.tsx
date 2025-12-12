import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { ProjectCard } from '@/components/ui/ProjectCard';
import type { Project, ProjectFilters } from '@/types/project';

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject?: Project | null;
  filters: ProjectFilters;
  onProjectSelect: (project: Project) => void;
  onFiltersChange: (filters: Partial<ProjectFilters>) => void;
}

const filterButtons = [
  { key: 'all', label: 'All Projects', color: '' },
  { key: 'pending', label: 'Pending', color: 'bg-red-500' },
  { key: 'in-progress', label: 'In-Progress', color: 'bg-yellow-400' },
  { key: 'completed', label: 'Completed', color: 'bg-primary' }
];

export const ProjectSidebar = ({ 
  projects, 
  selectedProject, 
  filters, 
  onProjectSelect, 
  onFiltersChange 
}: ProjectSidebarProps) => {
  return (
    <motion.aside 
      className="w-full max-w-[400px] h-full flex flex-col bg-[#1c2620]/90 backdrop-blur-xl rounded-2xl border border-[#29382f] shadow-2xl overflow-hidden shrink-0"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Search Header */}
      <div className="p-5 border-b border-[#29382f] bg-[#1c2620]/50">
        <motion.div 
          className="relative group"
          whileFocus={{ scale: 1.02 }}
        >
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            className="w-full bg-[#122017] border border-[#29382f] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none shadow-inner"
            placeholder="Search projects by ID or location..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
          />
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {filterButtons.map((filter, index) => (
            <motion.button
              key={filter.key}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex items-center gap-1 ${
                filters.status === filter.key || (filter.key === 'all' && !filters.status)
                  ? 'bg-[#29382f] text-white border-transparent'
                  : 'bg-transparent border-[#29382f] text-gray-400 hover:text-white hover:bg-[#29382f]'
              }`}
              onClick={() => onFiltersChange({ status: filter.key as any })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {filter.color && (
                <span className={`w-1.5 h-1.5 rounded-full ${filter.color}`} />
              )}
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <ProjectCard
              project={project}
              isSelected={selectedProject?.id === project.id}
              onClick={() => onProjectSelect(project)}
            />
          </motion.div>
        ))}
        
        {projects.length === 0 && (
          <motion.div 
            className="p-8 text-center text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Icon name="search_off" className="text-4xl mb-2 mx-auto" />
            <p>No projects found</p>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
};