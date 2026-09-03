import { supabase } from './supabase'

export async function getAllArtists() {
  const { data, error } = await supabase.from('artists').select('*')
  if (error) {
    console.error('Error al obtener artistas:', error)
    return []
  }
  return data || []
}

export async function getArtistBySlug(slug: string) {
  // Obtener el artista
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (artistError || !artist) {
    console.error('Error al obtener artista:', artistError)
    return null
  }

  // Obtener las canciones del artista
  const { data: tracks, error: tracksError } = await supabase
    .from('tracks')
    .select('*')
    .eq('artist_id', artist.id)
  
  if (tracksError) {
    console.error('Error al obtener tracks:', tracksError)
  }

  // Combinar artista con sus tracks
  return {
    ...artist,
    tracks: tracks || [],
    bio: artist.short_bio,
    fullBio: artist.short_bio,
    cover: null // Por ahora no tenemos columna de cover
  }
}
