export const dynamic = 'force-dynamic';
import { getArtistBySlug } from '@/lib/artists';
import Link from 'next/link';

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const artist = await getArtistBySlug(params.slug);

  if (!artist) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Artista no encontrado</h1>
          <Link href="/" className="text-purple-400 underline">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-purple-400 mb-6 inline-block">← Volver al inicio</Link>
        
        <div className="w-full h-64 bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl mb-8 flex items-center justify-center">
          <h1 className="text-5xl font-bold text-center">{artist.name}</h1>
        </div>

        <p className="text-zinc-400 text-xl mb-8">{artist.fullBio || artist.bio || 'Sin biografía disponible'}</p>
        
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Canciones</h2>
          {artist.tracks && artist.tracks.length > 0 ? (
            artist.tracks.map((track: any) => (
              <div key={track.id} className="mb-6 border-b border-zinc-800 pb-4 last:border-0">
                <p className="font-bold text-lg mb-2">{track.title}</p>
                <div className="bg-zinc-800 p-4 rounded-lg text-center text-zinc-500">
                   Agregar URL de audio en Supabase
                </div>
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