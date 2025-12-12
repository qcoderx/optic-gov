import { motion } from 'framer-motion';
import { Icon } from './Icon';
import type { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  isSelected?: boolean;
  onClick: () => void;
}

const statusConfig = {
  completed: {
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    icon: 'verified',
    label: 'VERIFIED'
  },
  'in-progress': {
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
    icon: 'engineering',
    label: 'IN-PROGRESS'
  },
  pending: {
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    icon: 'hourglass_empty',
    label: 'PENDING'
  }
};

export const ProjectCard = ({ project, isSelected, onClick }: ProjectCardProps) => {
  const config = statusConfig[project.status];

  return (
    <motion.div
      className={`p-4 border-b border-[#29382f]/50 cursor-pointer transition-all border-l-4 ${
        isSelected 
          ? 'bg-[#29382f]/20 border-l-primary' 
          : 'border-l-transparent hover:bg-[#29382f]/30 hover:border-l-yellow-400'
      }`}
      onClick={onClick}
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className={`font-bold text-base ${isSelected ? 'text-white' : 'text-gray-200'}`}>
          {project.title}
        </h3>
        <motion.span 
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.color} ${config.bg} ${config.border}`}
          whileHover={{ scale: 1.05 }}
        >
          <Icon name={config.icon} className="text-[12px]" />
          {config.label}
        </motion.span>
      </div>
      
      <p className="text-xs text-gray-400 mb-3">
        Project ID: #{project.id} • {project.location}
      </p>
      
      <div className="flex justify-between items-center text-xs">
        <div className="flex flex-col">
          <span className="text-gray-500 uppercase text-[10px] font-bold">Budget</span>
          <span className={`font-mono ${isSelected ? 'text-white' : 'text-gray-300'}`}>
            {project.budget} ETH
          </span>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <span className="text-gray-500 uppercase text-[10px] font-bold">
            {project.status === 'completed' ? 'AI Confidence' : 
             project.status === 'in-progress' ? 'Progress' : 'Votes'}
          </span>
          <span className={`font-bold ${
            project.status === 'completed' ? 'text-primary' :
            project.status === 'in-progress' ? 'text-yellow-400' : 'text-gray-300'
          }`}>
            {project.status === 'completed' ? `${project.aiConfidence}%` :
             project.status === 'in-progress' ? `${project.progress}%` : 
             `${project.votes}/100`}
          </span>
        </div>
      </div>
    </motion.div>
  );
};