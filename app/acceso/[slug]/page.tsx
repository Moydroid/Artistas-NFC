"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';

export default function ReproductorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawSlug = params.slug as string;
  const slug = decodeURIComponent(rawSlug);
  const isAdmin = searchParams.get('admin') === 'true';

  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [accessCode, setAccessCode] = useState('');
  const [hasAccess, setHasAccess] = useState(isAdmin);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { fetchArtistData(); }, [slug]);

  const fetchArtistData = async () => {
    try {
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('slug', slug)
        .single();

      if (artistError || !artistData) {
        console.log('Slug buscado:', slug);
        setArtist(null);
      } else {
        setArtist(artistData);
        const { data: tracksData } = await supabase
          .from('tracks')
          .select('*')
          .eq('artist_id', artistData.id)
          .order('created_at', { ascending: true });
        if (tracksData && tracksData.length > 0) setTracks(tracksData);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyAccess = async () => {
    if (!accessCode.trim()) { setError('Ingresa un codigo'); return; }
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', accessCode.toUpperCase())
      .eq('artist_id', artist?.id)
      .single();
    if (error || !data) { setError('Codigo invalido'); return; }
    setHasAccess(true);
    setError('');
    if (!data.is_used) {
      await supabase.from('access_codes').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', data.id);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) { audioRef.current.currentTime = time; setProgress(time); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextTrack = () => { setCurrentTrackIndex((prev) => (prev + 1) % tracks.length); setIsPlaying(true); };
  const prevTrack = () => { setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length); setIsPlaying(true); };

  const downloadTrack = () => {
    if (currentTrack?.audio_url) {
      const link = document.createElement('a');
      link.href = currentTrack.audio_url;
      link.download = `${artist.name} - ${currentTrack.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-400">Cargando...</div>;
  if (!artist) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
      <div>
        <p className="text-red-400 text-2xl font-bold mb-4">Artista no encontrado</p>
        <p className="text-zinc-500 mb-2">Slug: <span className="text-purple-400 font-mono">{slug}</span></p>
        <p className="text-zinc-600 text-sm">Revisa el enlace o contacta al administrador.</p>
      </div>
    </div>
  );

  if (!hasAccess && !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{artist.name}</h1>
          <p className="text-zinc-400 mb-6">Contenido Exclusivo</p>
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <input type="text" value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} placeholder="FONOXXXX" className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-center text-lg font-mono mb-4 focus:outline-none focus:border-purple-500" maxLength={12} />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button onClick={verifyAccess} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg">Desbloquear Contenido</button>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* VIDEO/CANVAS DE FONDO - OPTIMIZADO */}
      {artist.canvas_url ? (
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={artist.canvas_url} type="video/mp4" />
        </video>
      ) : currentTrack?.cover_url || artist.cover_url ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${currentTrack?.cover_url || artist.cover_url})`,
            zIndex: 0,
            filter: 'blur(20px) brightness(0.4)',
            transform: 'scale(1.1)'
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-pink-900/40" style={{ zIndex: 0 }} />
      )}
      
      {/* CAPA OSCURA - MEJOR CONTRASTE */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 1 }} />

      {/* CONTENIDO PRINCIPAL */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-end p-4 pb-8 md:pb-12">
        <div className="w-full max-w-2xl">
          <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* PORTADA - OPTIMIZADA */}
            <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <img 
                src={currentTrack?.cover_url || artist.cover_url || 'https://via.placeholder.com/400'} 
                alt={currentTrack?.title || artist.name} 
                className="relative w-full h-full object-cover rounded-2xl shadow-2xl"
                loading="eager"
              />
            </div>

            {/* INFO Y CONTROLES */}
            <div className="flex-1 w-full text-center md:text-left space-y-3 md:space-y-4">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white mb-1">{artist.name}</h1>
                {artist.short_bio && <p className="text-xs text-zinc-400 mb-2 line-clamp-2 hidden md:block">{artist.short_bio}</p>}
                <div className="h-px w-12 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto md:mx-0 mb-2" />
                <h2 className="text-base md:text-xl text-purple-300 font-medium">{currentTrack?.title || 'Sin titulo'}</h2>
                {currentTrack?.composer_name && (
                  <p className="text-xs text-zinc-500 mt-1">Composicion: {currentTrack.composer_name} {currentTrack.composer_percentage && `(${currentTrack.composer_percentage}%)`}</p>
                )}
              </div>

              {/* CONTROLES */}
              <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4">
                <button onClick={prevTrack} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                </button>
                <button onClick={togglePlay} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    {isPlaying ? (
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                    ) : (
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </div>
                </button>
                <button onClick={nextTrack} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                </button>
                <button onClick={downloadTrack} className="p-2 text-zinc-400 hover:text-purple-400 transition-colors" title="Descargar cancion">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              </div>

              {/* BARRA DE PROGRESO */}
              <div className="space-y-1">
                <input type="range" min={0} max={duration || 0} value={progress} onChange={handleSeek} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                <div className="flex justify-between text-xs text-zinc-400 font-mono">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE CANCIONES - OPTIMIZADA */}
          {tracks.length > 1 && (
            <div className="mt-3 md:mt-4 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 md:p-4 max-h-40 md:max-h-48 overflow-y-auto">
              <h3 className="text-sm font-bold text-zinc-400 mb-2 text-center">Lista de Canciones</h3>
              <div className="space-y-1">
                {tracks.map((track, index) => (
                  <button 
                    key={track.id} 
                    onClick={() => { setCurrentTrackIndex(index); setIsPlaying(true); }} 
                    className={`w-full p-2 rounded-lg text-left transition-all flex items-center gap-2 text-sm ${index === currentTrackIndex ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-zinc-800/50 hover:bg-zinc-800/70 border border-transparent'}`}
                  >
                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      {index === currentTrackIndex && isPlaying ? (
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 bg-purple-400 animate-pulse" />
                          <div className="w-0.5 h-3 bg-purple-400 animate-pulse" />
                          <div className="w-0.5 h-3 bg-purple-400 animate-pulse" />
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${index === currentTrackIndex ? 'text-purple-300' : 'text-white'}`}>{track.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-3 md:mt-4">
            <p className="text-xs text-zinc-500">2026 FONOTAP Contenido Exclusivo</p>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={currentTrack?.audio_url} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={nextTrack} 
        onLoadedMetadata={handleTimeUpdate}
        preload="metadata"
      />
    </div>
  );
}