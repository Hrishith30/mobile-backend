import { supabase } from '../config/supabase.js';
import { getUserById, updateUserById, deleteUserById } from '../models/userModel.js';

// --- Get user profile (omitted for brevity, assume unchanged) ---
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

// --- Update user profile (omitted for brevity, assume unchanged) ---
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

// --- Delete Account (omitted for brevity, assume unchanged) ---
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

// 🎯 NEW: Create a safety tip (Implements POST /user/tips)
export const createSafetyTip = async (req, res) => {
    try {
        // 1. Get user ID and tip content
        const userId = req.user.id;
        const { tip } = req.body;

        // 2. Insert into the safety_tips table
        const { data, error } = await supabase
            .from('safety_tips')
            .insert([{ user_id: userId, tip: tip }])
            // .select() returns the newly created row, which is essential for the client fix
            .select('*'); 
        
        if (error) throw error;
        if (!data || data.length === 0) {
             return res.status(500).json({ message: 'Failed to create tip: No data returned.' });
        }

        // 3. Return the new tip object for the Optimistic Local Update
        res.status(201).json(data[0]); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating safety tip' });
    }
};

// --- Get all safety tips by user (omitted for brevity, assume unchanged) ---
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

// --- Update a safety tip (omitted for brevity, assume unchanged) ---
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

// --- Delete a safety tip (omitted for brevity, assume unchanged) ---
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

// --- Update user location (omitted for brevity, assume unchanged) ---
export const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    const { data, error } = await updateUserById(userId, { latitude, longitude });
    if (error) throw error;
    
    if (!data.length) return res.status(404).json({ message: 'User not found' });

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