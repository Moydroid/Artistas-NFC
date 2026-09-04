export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function Home() {
  // Usamos is_active para solo mostrar artistas activos
  const { data: artists } = await supabase.from('artists').select('*').eq('is_active', true);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-purple-400">Plataforma NFC - Artistas</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {artists?.map((artist: any) => (
          <Link 
            href={`/artistas/${artist.babosa}`} // ¡Usamos babosa en lugar de slug!
            key={artist.id} 
            className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-purple-500 transition overflow-hidden group"
          >
            {artist.cover_url ? (
              <img src={artist.cover_url} alt={artist.nombre} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" />
            ) : (
              <div className="w-full h-48 bg-gradient-to-r from-purple-900 to-pink-900 flex items-center justify-center">
                <span className="text-2xl font-bold">{artist.nombre}</span>
              </div>
            )}
            <div className="p-6">
              <h2 className="text-2xl font-bold">{artist.nombre}</h2>
              <p className="text-zinc-400 mt-2 line-clamp-2">{artist.short_bio || 'Sin biografía'}</p>
              <div className="mt-4 text-purple-400 text-sm font-bold">Ver perfil y escuchar →</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}