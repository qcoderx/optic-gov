const RAPIDAPI_KEY = '85048d3a4dmsh0acb4a78e23397ap17e5fdjsnab18131744c0';
const RAPIDAPI_HOST = 'google-map-places.p.rapidapi.com';

export const getStreetViewImage = async (location: string): Promise<string> => {
  try {
    const url = `https://${RAPIDAPI_HOST}/maps/api/streetview?size=600x400&source=default&return_error_code=true&location=${encodeURIComponent(location)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      console.warn(`Street view API error: ${response.status} for ${location}`);
      return '';
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn(`Street view fetch failed for ${location}:`, error);
    return '';
  }
};