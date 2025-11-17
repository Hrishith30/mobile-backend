import axios from 'axios';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';
import { getDistanceInMiles } from '../utils/geolocation.js';

dotenv.config();


export const getNearbyPlaces = async (req, res) => {
  try {
    const { type, latitude, longitude } = req.body;

    if (!type || !latitude || !longitude) {
      return res.status(400).json({ message: 'Type, latitude, and longitude are required.' });
    }
    
    const typeToOverpassTag = {
      police: '[amenity=police]',
      hospital: '[amenity=hospital]',
      pharmacy: '[amenity=pharmacy]',
      park: '[leisure=park]',
      community_center: '[amenity=community_centre]',
    };

    const overpassTag = typeToOverpassTag[type];
    if (!overpassTag) {
      return res.status(400).json({ message: 'Unsupported place type' });
    }
    
    const radiusInMeters = 32186; // 20 miles
    const userLat = latitude;
    const userLng = longitude;

    const query = `
      [out:json][timeout:25];
      (
        node${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
        way${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
        relation${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
      );
      out center 10;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      query,
      { headers: { 'Content-Type': 'text/plain' } }
    );

    const places = response.data.elements.map(element => {
      let lat, lon;
      if (element.type === 'node') {
        lat = element.lat;
        lon = element.lon;
      } else if (element.center) {
        lat = element.center.lat;
        lon = element.center.lon;
      } else {
        return null;
      }
      
      const distance = getDistanceInMiles(userLat, userLng, lat, lon);
      
      return {
        name: element.tags?.name || 'Unnamed Location',
        latitude: lat,
        longitude: lon,
        distance: distance.toFixed(1),
      };
    }).filter(Boolean);

    places.sort((a, b) => a.distance - b.distance);

    if (places.length > 0) {
      await supabase.from('locations').upsert(
        places.map((p) => ({ 
          name: p.name, type, latitude: p.latitude, longitude: p.longitude 
        })),
        { onConflict: ['name', 'type'] }
      );
    }

    res.json({ places });

  } catch (error) {
    console.error('Overpass API Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching nearby places' });
  }
};

// --- (addSafetyTip remains unchanged) ---
export const addSafetyTip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tip } = req.body;

    if (!tip || tip.trim() === '') return res.status(400).json({ message: 'Tip is required' });

    const { data, error } = await supabase
      .from('safety_tips')
      .insert([{ user_id: userId, tip }])
      .select('*');

    if (error) throw error;

    res.json({ message: 'Tip submitted successfully', tip: data[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting tip' });
  }
};