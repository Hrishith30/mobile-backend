import { supabase } from '../config/supabase.js';
import { getDistanceInMiles } from '../utils/geolocation.js';

// --- Create a new community report ---
export const createReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { report_type, description, latitude, longitude } = req.body;

    if (!report_type || !latitude || !longitude) {
      return res.status(400).json({ message: 'Type, latitude, and longitude are required.' });
    }

    const { data, error } = await supabase
      .from('community_reports')
      .insert([
        { user_id: userId, report_type, description, latitude, longitude }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Report created successfully', report: data[0] });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report' });
  }
};

// --- Get reports from the last 24 hours within 20 miles ---
export const getNearbyReports = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const radiusInMiles = 20;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    // 1. Get ALL recent reports from the database
    const { data: allRecentReports, error } = await supabase
      .from('community_reports')
      .select('report_type, description, latitude, longitude, created_at')
      .gt('created_at', twentyFourHoursAgo); // Only get reports from the last 24 hours

    if (error) throw error;

    // 2. Manually filter by distance
    const nearbyReports = allRecentReports.filter(report => {
      const distance = getDistanceInMiles(
        latitude, 
        longitude, 
        report.latitude, 
        report.longitude
      );
      return distance <= radiusInMiles;
    });

    res.json({ reports: nearbyReports });

  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    res.status(500).json({ message: 'Error fetching nearby reports' });
  }
};