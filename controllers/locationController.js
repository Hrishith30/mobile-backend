import axios from 'axios';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { getDistanceInMiles } from '../utils/geolocation.js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getNearbyPlaces = async (req, res) => {
  try {
    // This function is correct:
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

// --- [REWRITTEN] This function is now fixed ---
export const getSafetyAdvice = async (req, res) => {
  try {
    // --- THIS IS THE FIX ---
    // 1. Get location data AND type/situation from req.body
    const { location_type, situation, latitude, longitude } = req.body;

    // 2. Validate all 4 fields
    if (!location_type || !situation || !latitude || !longitude) {
      return res.status(400).json({ message: 'Location type, situation, latitude, and longitude are required' });
    }

    // 3. Removed the bad database query for the user's location
    // --- END OF FIX ---

    const prompt = `
You are a helpful assistant giving **non-medical safety advice**.
The user is near a ${location_type} at coordinates (${latitude}, ${longitude}).
The user is facing the following situation: ${situation}.
Provide **short, practical safety tips** relevant to their location.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200
    });

    const advice = completion.choices[0]?.message?.content || 'No advice available';
    res.json({ advice });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ message: 'Error generating advice' });
  }
};