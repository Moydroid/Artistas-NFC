export const dynamic = 'force-dynamic';
import { supabase, fixUrl } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const { data: artists } = await supabase.from('artists').select('*').eq('is_active', true);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER CON LOGO */}
      <header className="py-12 px-4 text-center border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Image 
              src="/logo.png" 
              alt="FONOTAP - Tu música, un solo tap" 
              width={500} 
              height={300} 
              className="mx-auto max-w-full h-auto"
              priority
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-gray-300 mb-4">
            Tu música, un solo tap
          </h1>
          <p className="text-zinc-400 text-lg mb-2">NFC | QR</p>
          <p className="text-zinc-500 text-sm uppercase tracking-widest">Conecta. Comparte. Crece.</p>
        </div>
      </header>

      {/* GRID DE ARTISTAS */}
      <section className="p-8">
        <h2 className="text-2xl font-bold mb-8 text-center text-purple-400">Artistas Destacados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {artists?.map((artist: any) => {
            const coverSrc = fixUrl(artist.cover_url);
            return (
              <Link 
                href={`/artistas/${artist.slug}`}
                key={artist.id} 
                className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-purple-500 transition overflow-hidden group"
              >
                <div className="w-full h-48 bg-gradient-to-r from-purple-900 to-pink-900 relative overflow-hidden">
                  {coverSrc && (
                    <img 
                      src={coverSrc} 
                      alt={artist.name || 'Artista'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold">{artist.name || 'Sin nombre'}</h3>
                  <p className="text-zinc-400 mt-2 line-clamp-2">{artist.short_bio || 'Sin biografía'}</p>
                  <div className="mt-4 text-purple-400 text-sm font-bold">Ver perfil →</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
