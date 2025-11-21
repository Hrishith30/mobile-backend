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

    // FIX: Reduced timeout to 15 seconds for better client experience
    const query = `
      [out:json][timeout:15];
      (
        node${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
        way${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
        relation${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
      );
      out center 10;
    `;
    
    // --- DIAGNOSTIC 1: Check before Overpass API call ---
    console.log('Diagnostic 1: Attempting call to Overpass API...');
    console.log('Query:', query.trim().replace(/\s+/g, ' '));
    // --- END DIAGNOSTIC 1 ---

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      query,
      { headers: { 'Content-Type': 'text/plain' } }
    );

    // --- DIAGNOSTIC 2: Check after successful Overpass response ---
    console.log(`Diagnostic 2: Overpass successful. Elements received: ${response.data.elements.length}`);
    // --- END DIAGNOSTIC 2 ---

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
        // --- DIAGNOSTIC 3: Check before Supabase Upsert ---
        console.log(`Diagnostic 3: Attempting Supabase upsert for ${places.length} places.`);
        // --- END DIAGNOSTIC 3 ---

      await supabase.from('locations').upsert(
        places.map((p) => ({ 
          name: p.name, type, latitude: p.latitude, longitude: p.longitude 
        })),
        { onConflict: ['name', 'type'] }
      );
        // --- DIAGNOSTIC 4: Check after successful Supabase Upsert ---
        console.log('Diagnostic 4: Supabase upsert complete.');
        // --- END DIAGNOSTIC 4 ---
    }

    res.json({ places });

  } catch (error) {
    // --- CRITICAL DIAGNOSTIC 5: Log the failure reason ---
    console.error('Error fetching nearby places (FATAL):');
    if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
    } else if (error.message.includes('timeout')) {
        console.error('Network Error: Request timed out.');
    } else {
        console.error('General Error:', error.message);
    }
    // --- END CRITICAL DIAGNOSTIC 5 ---

    res.status(500).json({ message: 'Error fetching nearby places' });
  }
};

// --- ADD SAFETY TIP (remains unchanged) ---
export const addSafetyTip = async (req, res) => {
  try {
    const userId = req.user.id;
    // Only destructuring 'tip' as location data is not required for personal tips
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