export const dynamic = 'force-dynamic';
import { supabase, fixUrl } from '@/lib/supabase';
import Link from 'next/link';

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // ¡AQUÍ ESTABA EL SECRETO! Usamos 'slug' y 'name'
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .limit(1);

  if (!artists || artists.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Artista no encontrado</h1>
          <Link href="/" className="text-purple-400 underline">Volver al inicio</Link>
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
        <Link href="/" className="text-purple-400 mb-6 inline-block">← Volver a FONOTAP</Link>

        <div className="w-full h-64 rounded-2xl mb-8 overflow-hidden bg-zinc-900">
          {coverSrc ? (
            <img src={coverSrc} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
              <h1 className="text-5xl font-bold">{artist.name}</h1>
            </div>
          )}
        </div>

        <h1 className="text-4xl font-bold mb-4">{artist.name}</h1>
        {artist.short_bio && artist.short_bio !== 'EMPTY' && (
          <p className="text-zinc-400 text-lg mb-8">{artist.short_bio}</p>
        )}

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-2xl font-bold mb-6 text-purple-400">Música ({tracks?.length || 0})</h2>
          {tracks && tracks.length > 0 ? (
            tracks.map((track: any) => {
              const audioSrc = fixUrl(track.audio_url);
              return (
                <div key={track.id} className="mb-6 border-b border-zinc-800 pb-4 last:border-0">
                  <p className="font-bold text-lg mb-3">{track.title || track.titulo || 'Sin título'}</p>
                  {audioSrc ? (
                    <audio controls className="w-full" src={audioSrc} />
                  ) : (
                    <div className="bg-zinc-800 p-3 rounded text-zinc-500 text-sm">Audio no disponible</div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-zinc-500">No hay canciones registradas.</p>
          )}
        </div>
      </div>
    </main>
  );
}