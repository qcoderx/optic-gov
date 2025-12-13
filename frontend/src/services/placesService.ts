export interface Place {
  id: string;
  displayName: { text: string };
  location: { latitude: number; longitude: number };
  formattedAddress: string;
  photos?: Array<{ name: string }>;
}

export const searchPlaces = async (query: string): Promise<Place[]> => {
  try {
    // Using Nominatim (OpenStreetMap) free geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Nigeria')}&limit=10&countrycodes=ng&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'OpticGov/1.0 (transparency-map)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert Nominatim format to our Place interface
    const places: Place[] = data.map((item: any, index: number) => ({
      id: item.place_id?.toString() || `place-${index}`,
      displayName: { text: item.display_name.split(',')[0] || item.name || query },
      location: {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      },
      formattedAddress: item.display_name
    }));

    return places;
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
};

export const getPlacePhoto = async (): Promise<string | null> => {
  // For now, return null as we're using free API without photo support
  return null;
};