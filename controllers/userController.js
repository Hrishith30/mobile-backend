import { supabase } from '../config/supabase.js';
import { getUserById, updateUserById, deleteUserById } from '../models/userModel.js';
// 'getDistanceInMiles' import removed as it's no longer needed

// --- Get user profile ---
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await getUserById(userId);
    if (error) throw error;
    res.json({ user: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// --- Update user profile ---
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    const { data, error } = await updateUserById(userId, { name });
    if (error) throw error;
    if (!data.length) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user: data[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// --- Delete Account ---
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { error } = await deleteUserById(userId);

    if (error) throw error;

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting account' });
  }
};

// --- Get all safety tips by user ---
export const getMySafetyTips = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('safety_tips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ tips: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching safety tips' });
  }
};

// --- Update a safety tip ---
export const updateSafetyTip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tip_id, tip } = req.body;
    const { data, error } = await supabase
      .from('safety_tips')
      .update({ tip })
      .eq('id', tip_id)
      .eq('user_id', userId)
      .select('*');
    if (error) throw error;
    if (!data.length) return res.status(404).json({ message: 'Tip not found' });
    res.json({ message: 'Tip updated', tip: data[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating tip' });
  }
};

// --- Delete a safety tip ---
export const deleteSafetyTip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tip_id } = req.body;
    const { data, error } = await supabase
      .from('safety_tips')
      .delete()
      .eq('id', tip_id)
      .eq('user_id', userId)
      .select(); 
    if (error) throw error;
    if (!data.length) return res.status(404).json({ message: 'Tip not found' });
    res.json({ message: 'Tip deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting tip' });
  }
};

// --- Update user location ---
export const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    const { data, error } = await updateUserById(userId, { latitude, longitude });
    if (error) throw error;
    
    // --- THIS IS THE FIX ---
    // Corrected the typo from '4aws/json' to '404'
    if (!data.length) return res.status(404).json({ message: 'User not found' });
    // --- END OF FIX ---

    const { data: historyData, error: historyError } = await supabase
      .from('location_history')
      .insert([{ user_id: userId, latitude, longitude }])
      .select();
    if (historyError) throw historyError;

    res.json({
      message: 'Location updated and history recorded',
      latestLocation: data[0],
      historyEntry: historyData[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating location' });
  }
};