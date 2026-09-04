export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  // DEBUG: Mostrar qué slug estamos buscando
  console.log('🔍 Buscando slug:', params.slug);

  // Obtener el artista directamente (sin pasar por lib/artists.ts)
  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !artist) {
    console.error('❌ Error al obtener artista:', error);
    console.log('📋 Slugs disponibles en la DB: ged, herencias, gozalo, yo-mero, herencia-ss, pinpon');
    
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Artista no encontrado</h1>
          <p className="text-zinc-400 mb-4">Slug buscado: <span className="text-white font-mono">{params.slug}</span></p>
          <p className="text-zinc-400 mb-6">Error: {error?.message || 'No se encontró el artista'}</p>
          
          <div className="bg-zinc-900 p-6 rounded-xl mb-6 text-left">
            <h3 className="text-purple-400 font-bold mb-3">Slugs disponibles:</h3>
            <ul className="text-zinc-400 space-y-1">
              <li><Link href="/artistas/ged" className="text-blue-400 hover:underline">ged</Link></li>
              <li><Link href="/artistas/herencias" className="text-blue-400 hover:underline">herencias</Link></li>
              <li><Link href="/artistas/pinpon" className="text-blue-400 hover:underline">pinpon</Link></li>
              <li><Link href="/artistas/yo-mero" className="text-blue-400 hover:underline">yo-mero</Link></li>
            </ul>
          </div>
          
          <Link href="/" className="text-purple-400 underline">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  // Obtener las canciones del artista
  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .eq('artist_id', artist.id);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-purple-400 mb-6 inline-block">← Volver al inicio</Link>
        
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-8 rounded-2xl mb-8">
          <h1 className="text-5xl font-bold">{artist.name}</h1>
          <p className="text-purple-200 mt-2">Slug: {artist.slug}</p>
        </div>

        {artist.short_bio && artist.short_bio !== 'EMPTY' && (
          <p className="text-zinc-400 text-xl mb-8">{artist.short_bio}</p>
        )}
        
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Canciones ({tracks?.length || 0})</h2>
          {tracks && tracks.length > 0 ? (
            tracks.map((track: any) => (
              <div key={track.id} className="mb-6 border-b border-zinc-800 pb-4 last:border-0">
                <p className="font-bold text-lg mb-2">{track.title}</p>
                <p className="text-zinc-500 text-sm">ID: {track.id}</p>
                <p className="text-zinc-500 text-sm">Artist ID: {track.artist_id}</p>
              </div>
            ))
          ) : (
            <p className="text-zinc-500">No hay canciones registradas para este artista.</p>
          )}
        </div>
      </div>
    </main>
  );
}