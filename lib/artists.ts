import { supabase } from './supabase';

export async function getAllArtists() {
  const { data, error } = await supabase.from('artists').select('*');
  if (error) { console.error('Error fetching artists:', error); return []; }
  return data || [];
}

export async function getArtistBySlug(slug: string) {
  const { data, error } = await supabase.from('artists').select('*').eq('slug', slug).single();
  if (error) { console.error('Error fetching artist:', error); return null; }
  return data;
}
