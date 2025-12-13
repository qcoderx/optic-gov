import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface BaseProject {
  id: string;
  name: string;
  status: string;
  location: string;
  budget?: string | number;
  place?: {
    location: { latitude: number; longitude: number };
  };
}

interface LeafletMapProps<T extends BaseProject> {
  projects: T[];
  selectedProject: T | null;
  onProjectSelect: (project: T) => void;
  center?: [number, number];
  zoom?: number;
}

export const LeafletMap = <T extends BaseProject>({ 
  projects, 
  selectedProject, 
  onProjectSelect, 
  center = [9.0820, 8.6753], // Nigeria center (more focused)
  zoom = 6 
}: LeafletMapProps<T>) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'completed': return '#38e07b';
      case 'in-progress': return '#fbbf24';
      case 'pending': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const createCustomIcon = (status: string, isSelected: boolean) => {
    const color = getMarkerColor(status);
    const size = isSelected ? 40 : 30;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
          ${isSelected ? `
            <div style="
              position: absolute;
              width: ${size + 20}px;
              height: ${size + 20}px;
              border: 2px solid ${color};
              border-radius: 50%;
              opacity: 0.3;
              animation: ping 2s infinite;
            "></div>
          ` : ''}
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes ping {
            0% { transform: scale(1); opacity: 0.3; }
            100% { transform: scale(1.5); opacity: 0; }
          }
        </style>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map with proper options
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true
    });

    // Add light/white tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 2,
      detectRetina: true
    }).addTo(map);

    // Add zoom control with custom position
    L.control.zoom({
      position: 'bottomright',
      zoomInTitle: 'Zoom in',
      zoomOutTitle: 'Zoom out'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add project markers
    projects.forEach(project => {
      let lat, lng;
      
      if (project.place?.location) {
        lat = project.place.location.latitude;
        lng = project.place.location.longitude;
      } else {
        // Default positions for existing projects
        const defaultPositions: { [key: string]: [number, number] } = {
          '1': [6.5244, 3.3792], // Lagos
          '2': [9.0579, 7.4951], // Abuja
          '3': [6.5244, 3.3792], // Lagos (Victoria Island)
          '4': [4.8156, 7.0498], // Port Harcourt
        };
        [lat, lng] = defaultPositions[project.id] || [9.0765, 7.3986];
      }

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat === null || lng === null) {
        console.warn(`Invalid coordinates for project ${project.id}:`, { lat, lng });
        return;
      }

      const isSelected = selectedProject?.id === project.id;
      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(project.status, isSelected)
      });

      // Create popup with proper Leaflet popup options
      const popupContent = `
        <div style="
          background: #1c2620;
          color: white;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #29382f;
          min-width: 200px;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">
            ${project.name}
          </h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9cbaa6;">
            ${project.location}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #38e07b;">
            Budget: ${project.budget || 'TBD'}
          </p>
          <div style="
            display: inline-block;
            padding: 2px 8px;
            background: ${getMarkerColor(project.status)}20;
            color: ${getMarkerColor(project.status)};
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid ${getMarkerColor(project.status)}40;
          ">
            ${project.status.replace('-', ' ')}
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        closeButton: true,
        autoClose: true,
        closeOnEscapeKey: true,
        className: 'custom-popup',
        maxWidth: 300,
        offset: [0, -10]
      });

      marker.on('click', () => {
        onProjectSelect(project);
      });

      marker.addTo(mapInstanceRef.current!);
      markersRef.current.push(marker);
    });
  }, [projects, selectedProject, onProjectSelect]);

  // Update map center when selected project changes with smooth animation
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedProject?.place?.location) return;

    const { latitude, longitude } = selectedProject.place.location;
    
    // Validate coordinates before flying to location
    if (isNaN(latitude) || isNaN(longitude) || latitude === null || longitude === null) {
      console.warn('Invalid coordinates for flyTo:', { latitude, longitude });
      return;
    }

    mapInstanceRef.current.flyTo([latitude, longitude], 12, {
      animate: true,
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [selectedProject]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button 
          onClick={() => mapInstanceRef.current?.flyTo(center, zoom, { duration: 1 })}
          className="size-10 bg-[#1c2620]/90 backdrop-blur text-white rounded-full flex items-center justify-center border border-[#29382f] hover:bg-[#29382f] shadow-lg transition-colors"
          title="Reset View"
        >
          <span className="material-symbols-outlined text-[#38e07b]">my_location</span>
        </button>
        <button 
          onClick={() => mapInstanceRef.current?.fitBounds(L.latLngBounds(projects.map(p => {
            if (p.place?.location) {
              return [p.place.location.latitude, p.place.location.longitude];
            }
            const defaultPositions: { [key: string]: [number, number] } = {
              '1': [6.5244, 3.3792], '2': [9.0579, 7.4951], '3': [6.5244, 3.3792], '4': [4.8156, 7.0498]
            };
            return defaultPositions[p.id] || [9.0765, 7.3986];
          })), { padding: [20, 20] })}
          className="size-10 bg-[#1c2620]/90 backdrop-blur text-white rounded-full flex items-center justify-center border border-[#29382f] hover:bg-[#29382f] shadow-lg transition-colors"
          title="Fit All Projects"
        >
          <span className="material-symbols-outlined text-[#38e07b]">zoom_out_map</span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#1c2620]/90 backdrop-blur-md rounded-lg p-3 border border-[#29382f] z-[1000]">
        <h4 className="text-white text-xs font-bold mb-2 uppercase tracking-wider">Project Status</h4>
        <div className="flex flex-col gap-1">
          {[
            { status: 'completed', label: 'Completed', color: '#38e07b' },
            { status: 'in-progress', label: 'In Progress', color: '#fbbf24' },
            { status: 'pending', label: 'Pending', color: '#ef4444' }
          ].map(({ status, label, color }) => (
            <div key={status} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
              />
              <span className="text-white text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};