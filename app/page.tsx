"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [artists, setArtists] = useState<any[]>([]);
  const [previewTrack, setPreviewTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false); // Nuevo estado para el modal de escaneo
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    const { data } = await supabase
      .from('artists')
      .select('id, name, slug, cover_url, short_bio')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (data) setArtists(data);
  };

  const whatsappUrl = "https://wa.me/523350773804?text=Hola,%20quiero%20información%20sobre%20las%20tarjetas%20FONOTAP%20para%20mi%20música.";

  const playPreview = async (artist: any) => {
    const { data: tracks } = await supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', artist.id)
      .limit(1);

    if (tracks && tracks.length > 0) {
      setPreviewTrack({ ...tracks[0], artist_name: artist.name });
      setIsPlaying(true);
      setShowModal(false);
    }
  };

  useEffect(() => {
    if (previewTrack && audioRef.current) {
      audioRef.current.play().catch(() => {});
      
      timerRef.current = setTimeout(() => {
        setIsPlaying(false);
        setShowModal(true);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 30000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [previewTrack]);

  const stopPreview = () => {
    setIsPlaying(false);
    setPreviewTrack(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden relative">
      
      {/* Audio oculto para previews */}
      {previewTrack && (
        <audio 
          ref={audioRef} 
          src={previewTrack.audio_url} 
          onEnded={() => { setIsPlaying(false); setShowModal(true); }}
        />
      )}

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-5 bg-black/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="FONOTAP" className="w-12 h-12 object-contain" />
          <span className="text-lg font-bold tracking-widest text-purple-400">FONOTAP</span>
        </div>
        <a href={whatsappUrl} target="_blank" className="hidden md:block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-600/20">
          Contratar
        </a>
      </nav>

      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="flex justify-center mb-8">
          <img 
            src="/logo.png" 
            alt="FONOTAP Logo" 
            className="w-64 md:w-80 lg:w-96 object-contain drop-shadow-[0_0_40px_rgba(168,85,247,0.3)]" 
          />
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Tu música,
          </span>
          <br />
          <span className="text-white">en sus manos.</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-4 leading-relaxed">
          Tarjetas inteligentes <span className="text-purple-400 font-bold">NFC</span> y <span className="text-purple-400 font-bold">QR</span> que desbloquean contenido exclusivo.
        </p>
        <p className="text-sm md:text-base text-zinc-500 tracking-[0.3em] uppercase mb-10">
          Conecta. Comparte. Crece.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <a href={whatsappUrl} target="_blank" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)]">
            💬 Quiero mis tarjetas
          </a>
          <Link href="#artistas" className="border border-purple-500/30 bg-black/50 backdrop-blur-md px-8 py-4 rounded-full font-bold text-lg text-purple-400 hover:bg-purple-600/10 transition-all">
            Ver artistas
          </Link>
        </div>
      </section>

      {/* SECCIÓN DE PREVIEWS */}
      <section className="py-20 px-4 border-t border-purple-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Escucha un <span className="text-purple-400">Fragmento</span>
            </h2>
            <p className="text-zinc-400 text-lg">Descubre su música. ¿Te gustó? Escanea tu tarjeta para escuchar la canción completa.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artists.map(artist => (
              <div key={artist.id} className="group relative bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all">
                <img 
                  src={artist.cover_url || 'https://via.placeholder.com/400'} 
                  alt={artist.name} 
                  className="w-full h-48 object-cover rounded-xl mb-4" 
                />
                <h3 className="text-xl font-bold mb-2">{artist.name}</h3>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{artist.short_bio}</p>
                
                {previewTrack?.artist_name === artist.name && isPlaying ? (
                  <button 
                    onClick={stopPreview}
                    className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    ⏸ Detener
                  </button>
                ) : (
                  <button 
                    onClick={() => playPreview(artist)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    ▶ Escuchar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-20 px-4 border-t border-purple-500/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            Tan simple como <span className="text-purple-400">1, 2, 3</span>
          </h2>
          <p className="text-center text-zinc-500 mb-16 tracking-widest uppercase text-sm">NFC | QR</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📱', title: 'Acerca o Escanea', desc: 'El fan acerca su celular a la tarjeta o escanea el QR.' },
              { icon: '🔓', title: 'Ingresa su código', desc: 'Escribe el código único impreso en su tarjeta física.' },
              { icon: '🎧', title: 'Experiencia VIP', desc: 'Acceso instantáneo a música, videos y contenido oculto.' }
            ].map((item, i) => (
              <div key={i} className="group relative p-8 rounded-2xl border border-purple-500/20 bg-black hover:border-purple-500/50 transition-all duration-300">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-purple-400">{item.title}</h3>
                <p className="text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARTISTAS */}
      <section id="artistas" className="py-20 px-4 border-t border-purple-500/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Artistas FONOTAP</h2>
          <p className="text-center text-zinc-500 mb-12 tracking-widest uppercase text-sm">Los pioneros de la nueva era</p>
          
          {artists.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-purple-500/20 rounded-2xl">
              <p className="text-zinc-600 text-lg">Próximamente más artistas...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artists.map(artist => (
                <Link 
                  key={artist.id} 
                  href={`/acceso/${artist.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-purple-500/20 bg-black hover:border-purple-500/50 transition-all"
                >
                  <img 
                    src={artist.cover_url || 'https://via.placeholder.com/400'} 
                    alt={artist.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-1">{artist.name}</h3>
                    <p className="text-purple-400 text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Toca para desbloquear
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 px-4 text-center border-t border-purple-500/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            ¿Listo para el <span className="text-purple-400">siguiente nivel</span>?
          </h2>
          <p className="text-xl text-zinc-400 mb-10">
            Deja de ser un link más en su bio. Convierte tu música en un objeto físico coleccionable.
          </p>
          <a 
            href={whatsappUrl} 
            target="_blank" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-5 rounded-full font-bold text-xl transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)]"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            Cotizar por WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 border-t border-purple-500/10 text-center">
        <p className="text-zinc-600 text-sm">© 2026 FONOTAP. Todos los derechos reservados.</p>
        <p className="text-zinc-700 text-xs mt-2 tracking-widest uppercase">Conecta. Comparte. Crece.</p>
      </footer>

      {/* MODAL DE MARKETING (Preview) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-2xl font-bold mb-2 text-purple-400">¿Te gustó lo que escuchaste?</h3>
            <p className="text-zinc-300 mb-6">
              Eso fue solo un fragmento. 
              <br />
              <span className="text-white font-bold">Escanea tu tarjeta FONOTAP</span> para escuchar la canción completa y acceder a contenido exclusivo.
            </p>
            <div className="flex flex-col gap-3">
              <a 
                href={whatsappUrl} 
                target="_blank"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
              >
                💬 Quiero mis tarjetas
              </a>
              <button 
                onClick={() => setShowModal(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-medium transition-colors"
              >
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE ESTRATÉGICO (Llamado a la acción sutil) */}
      <button 
        onClick={() => setShowScanModal(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-purple-500/40 text-white px-4 py-3 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 transition-transform cursor-pointer"
        style={{ animation: 'gentleBounce 3s ease-in-out infinite' }}
      >
        <span className="text-xl">📱</span>
        <span className="text-xs sm:text-sm font-medium tracking-wide">
          ¿Cómo uso mi tarjeta?
        </span>
      </button>

      {/* MODAL EXPLICATIVO DE ESCANEO */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowScanModal(false)}>
          <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowScanModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-bold">&times;</button>
            
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-2">Tu música en sus manos</h3>
              <p className="text-zinc-300 text-sm">Así es como tus fans desbloquean tu contenido exclusivo</p>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-xl border border-zinc-700">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📲</span>
                  <h4 className="font-bold text-white">Opción 1: NFC (Recomendado)</h4>
                </div>
                <p className="text-sm text-zinc-400">Solo acerca tu celular a la tarjeta física. iPhone y Android la detectarán automáticamente y abrirán tu música.</p>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-zinc-700">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📷</span>
                  <h4 className="font-bold text-white">Opción 2: Código QR</h4>
                </div>
                <p className="text-sm text-zinc-400">Abre la cámara de tu celular, escanea el QR impreso en la tarjeta y listo. Se abrirá tu contenido al instante.</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-500 mb-4">¿Aún no tienes tu tarjeta?</p>
              <a 
                href={whatsappUrl} 
                target="_blank"
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                💬 Quiero mis tarjetas FONOTAP
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Animación personalizada para el rebote suave */}
      <style jsx>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </main>
  );
}