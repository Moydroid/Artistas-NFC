import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import PlaylistPlayer from '@/components/PlaylistPlayer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ArtistPage(props: any) {
  const params = await Promise.resolve(props.params);
  const slug = params.slug;

  const { data: artist, error } = await supabase
    .from('artists')
    .select(`
      *,
      albums (*, tracks (*)),
      tracks (*),
      videos (*)
    `)
    .eq('slug', slug)
    .limit(1)
    .single();

  if (error || !artist) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <Link href="/" className="text-blue-400 hover:underline">⬅️ Volver</Link>
        <h1 className="text-4xl font-bold text-red-500 mt-8">Artista no encontrado</h1>
      </main>
    );
  }

  const data = artist as any;

  // Combinar todas las canciones (sencillos + tracks de álbumes)
  const allTracks = [
    ...data.tracks || [],
    ...(data.albums || []).flatMap((album: any) => album.tracks || [])
  ].filter((track: any) => track.audio_url);

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      {/* PORTADA */}
      <div className="relative h-[60vh] w-full">
        {data.cover_url ? (
          <img src={data.cover_url} alt={data.name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-purple-900 to-black"></div>
        )}
        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-6xl mx-auto">
            <Link href="/" className="text-sm text-zinc-400 hover:text-white mb-4 inline-block">⬅️ Volver</Link>
            <h1 className="text-5xl md:text-7xl font-black mb-4">{data.name}</h1>
            <p className="text-xl text-zinc-300">{data.short_bio}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        
        {/* REPRODUCTOR PRINCIPAL */}
        {allTracks.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6"> Reproductor</h2>
            <PlaylistPlayer tracks={allTracks} />
          </section>
        )}

        {/* ÁLBUMES */}
        {data.albums && data.albums.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Álbumes</h2>
            <div className="space-y-8">
              {data.albums.map((album: any) => (
                <div key={album.id} className="bg-zinc-900/50 p-6 rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    {album.cover_url ? (
                      <img src={album.cover_url} alt={album.name} className="w-24 h-24 object-cover rounded-lg" />
                    ) : (
                      <div className="w-24 h-24 bg-purple-900/30 rounded-lg flex items-center justify-center text-3xl">💿</div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold">{album.name}</h3>
                      <p className="text-zinc-500">{album.year} • {album.tracks?.length || 0} canciones</p>
                    </div>
                  </div>
                  
                  {album.tracks && album.tracks.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {album.tracks.map((track: any, i: number) => (
                        <div key={track.id} className="p-3 bg-black/30 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-bold">{i + 1}. {track.title}</p>
                            {track.artist_performer && <p className="text-sm text-zinc-400">{track.artist_performer}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SENCILLOS */}
        {data.tracks && data.tracks.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Sencillos</h2>
            <div className="space-y-3">
              {data.tracks.map((track: any, i: number) => (
                <div key={track.id} className="p-4 bg-zinc-900/50 rounded-xl">
                  <p className="font-bold text-lg">{i + 1}. {track.title}</p>
                  {track.artist_performer && <p className="text-sm text-zinc-400">{track.artist_performer}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}