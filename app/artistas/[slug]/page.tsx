export const dynamic = 'force-dynamic';
import { supabase, fixUrl } from '@/lib/supabase';
import Link from 'next/link';

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
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
          <p className="text-zinc-400 mb-6">El slug "{slug}" no existe en la base de datos.</p>
          <Link href="/" className="text-purple-400 underline font-bold">? Volver a FONOTAP</Link>
        </div>
      </main>
    );
  }

  const artist = artists[0];
  const { data: tracks } = await supabase.from('tracks').select('*').eq('artist_id', artist.id);
  const coverSrc = fixUrl(artist.cover_url);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-purple-400 mb-6 inline-block font-bold">? Volver a FONOTAP</Link>
        
        <div className="w-full h-64 md:h-80 rounded-2xl mb-8 overflow-hidden relative bg-zinc-900 shadow-2xl shadow-purple-900/20">
          {coverSrc ? (
            <img src={coverSrc} alt={artist.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
              <h1 className="text-5xl font-bold text-center px-4">{artist.nombre}</h1>
            </div>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">{artist.nombre}</h1>
        {artist.short_bio && artist.short_bio !== 'EMPTY' && (
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{artist.short_bio}</p>
        )}
        
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6 text-purple-400 flex items-center gap-2">
            <span>??</span> Canciones ({tracks?.length || 0})
          </h2>
          
          {tracks && tracks.length > 0 ? (
            tracks.map((track: any) => {
              const audioSrc = fixUrl(track.audio_url);
              return (
                <div key={track.id} className="mb-6 border-b border-zinc-800 pb-6 last:border-0 last:pb-0">
                  <p className="font-bold text-lg mb-3 text-white">{track.título || track.title || 'Sin título'}</p>
                  {audioSrc ? (
                    <audio controls className="w-full rounded-lg" src={audioSrc}>
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  ) : (
                    <div className="bg-zinc-800 p-4 rounded-lg text-center text-zinc-500 text-sm border border-zinc-700">
                       Audio no disponible (Falta URL en Supabase)
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-zinc-500 text-center py-8">No hay canciones registradas para este artista aún.</p>
          )}
        </div>
      </div>
    </main>
  );
}
