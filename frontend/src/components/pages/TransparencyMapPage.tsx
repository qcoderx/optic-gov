import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Place } from '@/services/placesService';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { SearchBox } from '@/components/ui/SearchBox';

interface LocalProject {
  id: string;
  name: string;
  status: 'completed' | 'pending' | 'in-progress';
  budget: string;
  location: string;
  completion: number;
  place?: Place;
}

const defaultProjects: LocalProject[] = [
  { id: '1', name: 'Third Mainland Bridge Repair', status: 'completed', budget: '500 SUI', location: 'Lagos Island', completion: 100 },
  { id: '2', name: 'Abuja-Kaduna Expressway', status: 'in-progress', budget: '1,200 SUI', location: 'FCT Abuja', completion: 45 },
  { id: '3', name: 'Lagos Blue Line Rail', status: 'pending', budget: '3,500 SUI', location: 'Victoria Island', completion: 0 },
  { id: '4', name: 'Port Harcourt Refinery', status: 'completed', budget: '800 SUI', location: 'Rivers State', completion: 100 },
];

export const TransparencyMapPage = () => {
  const [searchResults] = useState<Place[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>(defaultProjects);
  const [selectedProject, setSelectedProject] = useState<LocalProject | null>(defaultProjects[0]);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const handlePlaceSelect = (place: Place) => {
    const newProject: LocalProject = {
      id: `search-${Date.now()}`,
      name: generateProjectName(place.displayName.text),
      status: 'pending',
      budget: 'TBD',
      location: place.formattedAddress,
      completion: 0,
      place
    };
    
    setIsNavigating(true);
    localStorage.setItem('selectedProject', JSON.stringify(newProject));
    
    // Simulate loading time for better UX
    setTimeout(() => {
      navigate(`/project/${newProject.id}`);
    }, 1500);
  };

  const handleProjectSelect = (project: LocalProject) => {
    setIsNavigating(true);
    localStorage.setItem('selectedProject', JSON.stringify(project));
    
    setTimeout(() => {
      navigate(`/project/${project.id}`);
    }, 1200);
  };

  const generateProjectName = (locationName: string): string => {
    const projectTypes = [
      'Infrastructure Development',
      'Road Construction', 
      'Bridge Repair',
      'Public Facility Upgrade',
      'Urban Development',
      'Transportation Hub'
    ];
    const randomType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
    return `${locationName} ${randomType}`;
  };

  if (isNavigating) {
    return <LoadingScreen message="Loading project details..." />;
  }

  return (
    <div className="bg-[#122017] text-white font-display min-h-screen w-full relative selection:bg-[#38e07b] selection:text-[#122017] overflow-auto">

      
      {/* UI Overlay Layer */}
      <div className="relative z-10 flex flex-col h-full w-full pointer-events-none">
        {/* Top Navigation & Stats HUD */}
        <header className="w-full flex flex-col xl:flex-row items-center justify-between p-4 md:px-8 pt-6 gap-4 pointer-events-auto">
          {/* Logo Area */}
          <div className="flex items-center gap-3 bg-[#1c2620]/80 backdrop-blur-md pl-2 pr-6 py-2 rounded-full border border-[#29382f] shadow-xl">
            <div className="size-10 bg-gradient-to-br from-[#38e07b] to-emerald-800 rounded-full flex items-center justify-center text-[#122017]">
              <span className="material-symbols-outlined text-2xl">visibility</span>
            </div>
            <div>
              <h1 className="text-white text-lg font-bold leading-none tracking-tight">Optic-Gov</h1>
              <span className="text-[#38e07b] text-[10px] uppercase tracking-widest font-semibold opacity-80">Transparency Layer</span>
            </div>
          </div>
          
          {/* Stats HUD */}
          <div className="hidden md:flex flex-1 max-w-3xl justify-center">
            <div className="flex items-center gap-1 bg-[#1c2620]/80 backdrop-blur-md p-1.5 rounded-full border border-[#29382f] shadow-xl">
              <div className="flex flex-col md:flex-row items-center gap-6 px-6 py-2">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ETH Locked</span>
                  <span className="text-white font-mono font-bold text-lg leading-none">12,450 <span className="text-xs text-gray-500">ETH</span></span>
                </div>
                <div className="w-px h-8 bg-[#29382f] hidden md:block" />
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ETH Released</span>
                  <span className="text-white font-mono font-bold text-lg leading-none">4,200 <span className="text-xs text-gray-500">ETH</span></span>
                </div>
                <div className="w-px h-8 bg-[#29382f] hidden md:block" />
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] text-[#38e07b] uppercase font-bold tracking-wider">Corruption Prevented</span>
                  <span className="text-[#38e07b] font-mono font-bold text-lg leading-none">$12,040,000</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions Area */}
          <div className="flex gap-3">
            <button className="size-11 flex items-center justify-center rounded-full bg-[#1c2620]/80 backdrop-blur-md border border-[#29382f] text-white hover:bg-[#29382f] transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2.5 size-2.5 bg-red-500 rounded-full border-2 border-[#1c2620]" />
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 md:px-8 pb-8 gap-6">
          {/* Top Section - Sidebar and Map */}
          <div className="flex gap-6 h-[65vh] mb-6">
            {/* Left Sidebar */}
            <aside className="pointer-events-auto w-full max-w-[400px] flex flex-col bg-[#1c2620]/90 backdrop-blur-xl rounded-2xl border border-[#29382f] shadow-2xl overflow-hidden shrink-0">
              {/* Search Header */}
              <div className="p-5 border-b border-[#29382f] bg-[#1c2620]/50">
                <SearchBox 
                  onLocationSelect={(lat, lon, projectTitle) => {
                    const newProject: LocalProject = {
                      id: `search-${Date.now()}`,
                      name: projectTitle,
                      status: Math.random() > 0.5 ? 'pending' : 'in-progress',
                      budget: `${Math.floor(Math.random() * 2000 + 500)} SUI`,
                      location: projectTitle.split(' ').slice(0, -2).join(' '),
                      completion: Math.floor(Math.random() * 100),
                      place: {
                        id: `place-${Date.now()}`,
                        displayName: { text: projectTitle },
                        formattedAddress: projectTitle,
                        location: { latitude: lat, longitude: lon }
                      }
                    };
                    setProjects(prev => [newProject, ...prev]);
                    setSelectedProject(newProject);
                    // Store project for navigation
                    localStorage.setItem('selectedProject', JSON.stringify(newProject));
                  }}
                  placeholder="Search Nigerian locations..."
                />
                
                {/* Filters */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                  <button className="px-4 py-1.5 rounded-full bg-[#29382f] text-white text-xs font-medium border border-transparent hover:border-[#38e07b]/50 transition-all whitespace-nowrap">All Projects</button>
                  <button className="px-4 py-1.5 rounded-full bg-transparent border border-[#29382f] text-gray-400 text-xs font-medium hover:text-white hover:bg-[#29382f] transition-all whitespace-nowrap flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Pending
                  </button>
                  <button className="px-4 py-1.5 rounded-full bg-transparent border border-[#29382f] text-gray-400 text-xs font-medium hover:text-white hover:bg-[#29382f] transition-all whitespace-nowrap flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> In-Progress
                  </button>
                  <button className="px-4 py-1.5 rounded-full bg-transparent border border-[#29382f] text-gray-400 text-xs font-medium hover:text-white hover:bg-[#29382f] transition-all whitespace-nowrap flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38e07b]" /> Completed
                  </button>
                </div>
              </div>
              
              {/* Project List */}
              <div className="flex-1 overflow-y-auto">
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="p-4 border-b border-[#29382f] bg-[#38e07b]/5">
                    <h4 className="text-xs font-bold text-[#38e07b] mb-3 uppercase tracking-wider">Search Results</h4>
                    {searchResults.slice(0, 3).map((place) => (
                      <div 
                        key={place.id}
                        onClick={() => handlePlaceSelect(place)}
                        className="p-3 mb-2 bg-[#29382f]/50 rounded-lg cursor-pointer hover:bg-[#29382f] transition-colors border-l-4 border-l-[#38e07b]"
                      >
                        <h5 className="font-medium text-white text-sm mb-1">{generateProjectName(place.displayName.text)}</h5>
                        <p className="text-xs text-gray-400">{place.formattedAddress}</p>
                        <div className="flex justify-between items-center mt-2 text-xs">
                          <span className="text-[#38e07b] font-mono">New Project</span>
                          <span className="text-gray-500">Click to view</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Active Item */}
                <div 
                  onClick={() => handleProjectSelect(projects[0])}
                  className="p-4 border-b border-[#29382f]/50 hover:bg-[#29382f]/30 cursor-pointer transition-colors bg-[#29382f]/20 border-l-4 border-l-[#38e07b]"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-white text-base">Third Mainland Bridge Repair</h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#38e07b] bg-[#38e07b]/10 px-2 py-0.5 rounded-full border border-[#38e07b]/20">
                      <span className="material-symbols-outlined text-[12px]">verified</span> VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Project ID: #NG-2024-882 • Lagos Island</p>
                  <div className="flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">Budget</span>
                      <span className="text-white font-mono">500 SUI</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">AI Confidence</span>
                      <span className="text-[#38e07b] font-bold">98.5%</span>
                    </div>
                  </div>
                </div>
                
                {/* Other Items */}
                <div 
                  onClick={() => handleProjectSelect(projects[1])}
                  className="p-4 border-b border-[#29382f]/50 hover:bg-[#29382f]/30 cursor-pointer transition-colors border-l-4 border-l-transparent hover:border-l-yellow-400"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-200 text-base">Abuja-Kaduna Expressway</h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                      <span className="material-symbols-outlined text-[12px]">engineering</span> IN-PROGRESS
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Project ID: #NG-2024-421 • FCT Abuja</p>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">Budget</span>
                      <span className="text-gray-300 font-mono">1,200 SUI</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">Progress</span>
                      <span className="text-yellow-400 font-bold">45%</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleProjectSelect(projects[2])}
                  className="p-4 border-b border-[#29382f]/50 hover:bg-[#29382f]/30 cursor-pointer transition-colors border-l-4 border-l-transparent hover:border-l-red-500"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-200 text-base">Lagos Blue Line Rail</h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                      <span className="material-symbols-outlined text-[12px]">hourglass_empty</span> PENDING
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Project ID: #NG-2024-990 • Victoria Island</p>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">Budget</span>
                      <span className="text-gray-300 font-mono">3,500 SUI</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">Votes</span>
                      <span className="text-gray-300 font-bold">82/100</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleProjectSelect(projects[3])}
                  className="p-4 border-b border-[#29382f]/50 hover:bg-[#29382f]/30 cursor-pointer transition-colors border-l-4 border-l-transparent hover:border-l-[#38e07b]"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-200 text-base">Port Harcourt Refinery</h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#38e07b] bg-[#38e07b]/10 px-2 py-0.5 rounded-full border border-[#38e07b]/20">
                      <span className="material-symbols-outlined text-[12px]">verified</span> VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Project ID: #NG-2023-112 • Rivers State</p>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">Budget</span>
                      <span className="text-gray-300 font-mono">800 SUI</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">AI Confidence</span>
                      <span className="text-[#38e07b] font-bold">99.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
            
            {/* Center Content - Interactive Map */}
            <main className="flex-1 relative pointer-events-auto">
              <LeafletMap 
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={(project) => setSelectedProject(project)}
                center={selectedProject?.place ? [selectedProject.place.location.latitude, selectedProject.place.location.longitude] : [9.0765, 7.3986]}
                zoom={selectedProject?.place ? 12 : 6}
              />
            </main>
          </div>
          
          {/* Evidence Vault Section */}
          <section className="bg-[#1c2620]/90 backdrop-blur-xl rounded-2xl border border-[#29382f] shadow-2xl p-6 mt-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="size-12 rounded-xl bg-[#38e07b]/20 flex items-center justify-center text-[#38e07b] border border-[#38e07b]/20">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Evidence Vault</h2>
                <p className="text-sm text-[#38e07b] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  {selectedProject?.name || 'Third Mainland Bridge Repair'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Feed Section */}
              <div className="rounded-xl overflow-hidden bg-black border border-[#29382f] relative group">
                <div className="aspect-video w-full bg-[#29382f]/50 relative">
                  <img 
                    className="w-full h-full object-cover opacity-60" 
                    alt="Drone view of bridge construction site showing rebar and concrete structures" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuABhw3txAHFd0HVhrYF_2N14pEl7J9CxUvKEILC3OJ50HV6EUeLg9q4nCkImNDr_tepgEd0HRcBqERub5DBjPRAYrR8C0h4UTdfT0_9FuTPc677akKwI29SNq0LY3upJ34S7-dGJvfGVvQ1pGi0yNAbslwTq4oF882f7aUjShpUF2pXiuYnuQub6LLddNmo-01lT19Z5Wh8Vcgy3WZEjHmVNeJB8Y-hxnA04-EjwAShot8ICbylbpPGo7UD-VhnHeg1MhK6cG984TQ"
                  />
                  
                  {/* Video UI Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="size-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-[#38e07b] hover:text-[#122017] hover:border-[#38e07b] transition-all group-hover:scale-110">
                      <span className="material-symbols-outlined text-4xl ml-1">play_arrow</span>
                    </button>
                  </div>
                  
                  {/* AI Overlay Tags */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-black/70 text-white text-[10px] font-mono px-2 py-1 rounded border border-white/20 flex items-center gap-1">
                      <span className="size-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE FEED
                    </span>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="bg-black/70 backdrop-blur-md p-3 rounded-lg border border-white/10 max-w-sm">
                      <p className="text-[10px] text-[#38e07b] uppercase font-bold mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">smart_toy</span> Gemini 2.5 Flash Analysis
                      </p>
                      <p className="text-xs text-white leading-relaxed">
                        Visual confirmation of structural integrity. Rebar density matches schematic V.2. Concrete pouring volume verified at 98% accuracy.
                      </p>
                    </div>
                    <div className="bg-[#38e07b]/90 text-[#122017] font-bold px-3 py-1.5 rounded-lg text-xs shadow-lg shadow-[#38e07b]/20">
                      98% Confidence
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Transaction Data */}
              <div className="flex flex-col gap-4">
                <div className="bg-[#122017] rounded-xl p-4 border border-[#29382f]">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Last Transaction Hash</p>
                  <div className="flex items-center gap-2 text-white font-mono text-sm">
                    <span className="truncate">0x71C...9A23</span>
                    <button className="text-gray-400 hover:text-white">
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                </div>
                <div className="bg-[#122017] rounded-xl p-4 border border-[#29382f]">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Funds Released</p>
                  <div className="flex items-center gap-2 text-white font-mono text-sm">
                    <span>50.00 SUI</span>
                    <span className="text-xs text-gray-500">(Milestone 3)</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="px-5 py-2.5 rounded-full border border-[#29382f] text-white text-sm font-medium hover:bg-[#29382f] transition-colors">
                    View Smart Contract
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      

    </div>
  );
};
