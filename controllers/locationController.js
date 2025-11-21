import axios from 'axios';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';
import { getDistanceInMiles } from '../utils/geolocation.js';

dotenv.config();

// --- Helper function to fetch from Supabase cache (Fallback) ---
const fetchCachedPlaces = async (type) => {
    try {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('type', type)
            .limit(20); // Fetch reasonable number of cached items
        
        if (error) throw error;
        
        console.log(`[NEARBY PLACES] Fallback: Returning ${data.length} places from Supabase cache.`);
        // Format cached data to match the expected structure
        return data.map(p => ({
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
            distance: 'N/A' 
        }));
    } catch (e) {
        console.error('Failed to fetch from Supabase cache:', e.message);
        return [];
    }
};

export const getNearbyPlaces = async (req, res) => {
    const { type, latitude, longitude } = req.body;

    if (!type || !latitude || !longitude) {
        return res.status(400).json({ message: 'Type, latitude, and longitude are required.' });
    }
    
    // 1. Check for invalid coordinates (0,0) and fallback immediately
    if (latitude === 0 && longitude === 0) {
        console.warn('[NEARBY PLACES] Coordinates are (0, 0). Falling back to cache.');
        const cached = await fetchCachedPlaces(type);
        if (cached.length > 0) return res.json({ places: cached });
        return res.status(400).json({ message: 'Invalid location provided.' });
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
        [out:json][timeout:15];
        (
            node${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
            way${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
            relation${overpassTag}(around:${radiusInMeters},${userLat},${userLng});
        );
        out center 10;
    `;

    try {
        console.log(`[NEARBY PLACES] Querying Overpass for type: ${type}`);

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
            // Update cache asynchronously (don't block response significantly)
            await supabase.from('locations').upsert(
                places.map((p) => ({ 
                    name: p.name, type, latitude: p.latitude, longitude: p.longitude 
                })),
                { onConflict: ['name', 'type'] }
            ).catch(err => console.error('Cache update failed', err));
        }

        res.json({ places });

    } catch (error) {
        // --- Fallback Mechanism ---
        console.error('Overpass API failed:', error.message);
        
        const cached = await fetchCachedPlaces(type);
        
        if (cached.length > 0) {
            return res.json({ places: cached });
        }

        // Failure: Return original error message
        res.status(500).json({ message: 'Error fetching nearby places' });
    }
};

// --- ADD SAFETY TIP (remains unchanged) ---
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