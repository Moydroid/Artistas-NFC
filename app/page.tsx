export const dynamic = 'force-dynamic';
import { getAllArtists } from '@/lib/artists';
import Link from 'next/link';

export default async function Home() {
  const allArtists = await getAllArtists();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-purple-400">Plataforma NFC - Artistas</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {allArtists.map((artist) => (
          <Link href={/artistas/} key={artist.slug} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-purple-500 transition">
            <h2 className="text-2xl font-bold">{artist.name}</h2>
            <p className="text-zinc-400 mt-2">{artist.bio}</p>
            <div className="mt-4 text-purple-400 text-sm font-bold">Ver perfil y escuchar ?</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
