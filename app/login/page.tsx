export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // ¡CAMBIO CLAVE! Buscamos en la columna 'babosa'
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .eq('babosa', slug)
    .limit(1);

  if (!artists || artists.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Artista no encontrado</h1>
          <p className="text-zinc-400 mb-4">Buscamos: {slug}</p>
          <Link href="/" className="text-purple-400 underline">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const artist = artists[0];

  // Obtener las canciones usando el ID del artista
  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .eq('artist_id', artist.id);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-purple-400 mb-6 inline-block">← Volver al inicio</Link>
        
        {/* PORTADA DEL ARTISTA: Usamos cover_url */}
        <div className="w-full h-64 rounded-2xl mb-8 overflow-hidden relative bg-zinc-900">
          {artist.cover_url ? (
            <img 
              src={artist.cover_url} 
              alt={artist.nombre} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-900 to-pink-900 flex items-center justify-center">
              <h1 className="text-5xl font-bold text-center px-4">{artist.nombre}</h1>
            </div>
          )}
        </div>

        {/* NOMBRE Y BIO: Usamos nombre y short_bio */}
        <h1 className="text-4xl font-bold mb-4">{artist.nombre}</h1>
        {artist.short_bio && artist.short_bio !== 'EMPTY' && (
          <p className="text-zinc-400 text-xl mb-8">{artist.short_bio}</p>
        )}
        
        {/* REPRODUCTOR: Usamos título y audio_url */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-2xl font-bold mb-6 text-purple-400">Canciones ({tracks?.length || 0})</h2>
          {tracks && tracks.length > 0 ? (
            tracks.map((track: any) => (
              <div key={track.id} className="mb-6 border-b border-zinc-800 pb-4 last:border-0">
                <p className="font-bold text-lg mb-3">{track.título}</p>
                
                {/* REPRODUCTOR DE AUDIO: Usamos audio_url */}
                {track.audio_url ? (
                  <audio 
                    controls 
                    className="w-full"
                    src={track.audio_url}
                  >
                    Tu navegador no soporta el elemento de audio.
                  </audio>
                ) : (
                  <div className="bg-zinc-800 p-3 rounded-lg text-center text-zinc-500 text-sm">
                    🎵 No hay URL de audio disponible
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-zinc-500">No hay canciones registradas.</p>
          )}
        </div>
      </div>
    </main>
  );
}