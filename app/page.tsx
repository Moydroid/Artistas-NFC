export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { getAllArtists } from '@/lib/artists';
import Link from 'next/link';

// 1. AGREGAMOS 'async' AQUÍ 👇
export default async function Home() {
  
  // 2. AGREGAMOS 'await' AQUÍ 👇
  const allArtists = await getAllArtists();

  return (
    <main className="min-h-screen bg-black text-white">
      
      {/* 1. HERO SECTION (Venta a nuevos artistas) */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-purple-900/20 to-black">
        <div className="inline-block px-4 py-1 bg-purple-500/20 text-purple-400 text-sm font-bold rounded-full mb-6 border border-purple-500/30">
          🚀 PLATAFORMA NFC PARA ARTISTAS
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-white bg-clip-text text-transparent max-w-4xl">
          Lleva tu música al mundo físico
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mb-10">
          Alojamos tu música, creamos tu página web y te damos chips NFC para que tus fans escaneen, escuchen y descarguen tu contenido exclusivo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="https://wa.me/5211234567890?text=Hola,%20quiero%20contratar%20el%20servicio%20NFC%20para%20mi%20música" target="_blank" className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition">
             Contratar Servicio
          </a>
          <a href="#artistas" className="px-8 py-4 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition">
            Ver Artistas
          </a>
        </div>
      </section>

      {/* 2. BENEFICIOS */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">¿Qué incluye tu paquete?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-bold mb-2">Hosting de Música</h3>
            <p className="text-zinc-400">Sube tus canciones en alta calidad. Nosotros nos encargamos de que suenen perfecto.</p>
          </div>
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Chips NFC Programados</h3>
            <p className="text-zinc-400">Te entregamos chips listos para pegar en tu mercancía, tarjetas o poster.</p>
          </div>
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Contenido VIP</h3>
            <p className="text-zinc-400">Sistema de seguridad por token. Solo tus fans con chip pueden descargar.</p>
          </div>
        </div>
      </section>

      {/* 3. DIRECTORIO DE ARTISTAS ACTUALES */}
      <section id="artistas" className="py-20 px-4 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Artistas en la plataforma</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allArtists.map((artist) => (
              <Link 
                href={`/artistas/${artist.slug}`} 
                key={artist.slug}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500 transition"
              >
                <div className="aspect-video bg-zinc-800 overflow-hidden">
                  <img src={artist.cover} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition">{artist.name}</h3>
                  <p className="text-zinc-400 text-sm line-clamp-2">{artist.bio}</p>
                  <div className="mt-4 text-purple-400 text-sm font-bold flex items-center gap-2">
                    Ver perfil →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-zinc-600 border-t border-zinc-900">
        <p>© 2026 Plataforma NFC. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}