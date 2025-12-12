import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Project } from '@/types/project';
import { getStreetViewImage } from '@/services/mapService';

interface GoogleMapProps {
  projects: Project[];
  selectedProject?: Project | null;
  onProjectSelect: (project: Project) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export const GoogleMap = ({ projects, selectedProject, onProjectSelect }: GoogleMapProps) => {
  const [streetViewImages, setStreetViewImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProject || streetViewImages[selectedProject.id]) return;
    
    const loadStreetView = async () => {
      setLoading(true);
      const imageUrl = await getStreetViewImage(selectedProject.location);
      if (imageUrl) {
        setStreetViewImages(prev => ({ ...prev, [selectedProject.id]: imageUrl }));
      }
      setLoading(false);
    };
    
    loadStreetView();
  }, [selectedProject, streetViewImages]);

  return (
    <motion.div 
      className="w-full h-full bg-card-dark rounded-lg border border-border-dark relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Street view background */}
      {selectedProject && streetViewImages[selectedProject.id] ? (
        <div className="absolute inset-0">
          <img 
            src={streetViewImages[selectedProject.id]} 
            alt={`Street view of ${selectedProject.location}`}
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 400 300">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          {loading && selectedProject && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                Loading street view...
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="bg-white/10 backdrop-blur-sm border border-white/20 rounded p-2 text-white hover:bg-white/20 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button className="bg-white/10 backdrop-blur-sm border border-white/20 rounded p-2 text-white hover:bg-white/20 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Project markers */}
      <div className="absolute inset-0">
        {projects.map((project, index) => {
          const x = 20 + (index % 5) * 15;
          const y = 30 + Math.floor(index / 5) * 20;
          const isSelected = selectedProject?.id === project.id;
          
          return (
            <button
              key={project.id}
              onClick={() => onProjectSelect(project)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 ${
                isSelected ? 'scale-125 z-10' : ''
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                project.status === 'completed' ? 'bg-emerald-500' :
                project.status === 'in-progress' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              {isSelected && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {project.title}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Map info */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-2 rounded">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>Interactive Map View</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          NYC Infrastructure Projects
        </div>
      </div>
    </motion.div>
  );
};