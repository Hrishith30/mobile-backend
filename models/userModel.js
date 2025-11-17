import { supabase } from '../config/supabase.js';

export const createUser = async (user) => {
  const { data, error } = await supabase
    .from('users')
    .insert([user]);
  return { data, error };
};

export const getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  return { data, error };
};

export const updateUser = async (email, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('email', email);
  return { data, error };
};

export const getUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, verified, created_at')
    .eq('id', id)
    .single();
  return { data, error };
};

export const updateUserById = async (id, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, name, email, verified, latitude, longitude');
  return { data, error };
};

// --- NEW FUNCTION ---
export const deleteUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  return { data, error };
};