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
  const [showTrackList, setShowTrackList] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { fetchArtistData(); }, [slug]);

  const fetchArtistData = async () => {
    try {
      const { data: artistData } = await supabase.from('artists').select('*').eq('slug', slug).single();
      if (artistData) {
        setArtist(artistData);
        const { data: tracksData } = await supabase.from('tracks').select('*').eq('artist_id', artistData.id).order('created_at', { ascending: true });
        if (tracksData) setTracks(tracksData);
      }
    } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
  };

  const verifyAccess = async () => {
    if (!accessCode.trim()) { setError('Ingresa un codigo'); return; }
    const { data, error } = await supabase.from('access_codes').select('*').eq('code', accessCode.toUpperCase()).eq('artist_id', artist?.id).single();
    if (error || !data) { setError('Codigo invalido'); return; }
    setHasAccess(true); setError('');
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
      <div><p className="text-red-400 text-2xl font-bold mb-4">Artista no encontrado</p><p className="text-zinc-500">Slug: {slug}</p></div>
    </div>
  );

  if (!hasAccess && !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{artist.name}</h1>
          <p className="text-zinc-400 mb-6">Contenido Exclusivo</p>
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <input type="text" value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} placeholder="FONOXXXX" className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-center text-lg font-mono mb-4" maxLength={12} />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button onClick={verifyAccess} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl">Desbloquear</button>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* VIDEO DE FONDO - PANTALLA COMPLETA */}
      {artist.canvas_url ? (
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }}>
          <source src={artist.canvas_url} type="video/mp4" />
        </video>
      ) : (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${artist.cover_url})`, zIndex: 0 }}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      
      {/* CAPA OSCURA */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" style={{ zIndex: 1 }} />

      {/* CONTENIDO SCROLLEABLE */}
      <div className="relative z-10 min-h-screen flex flex-col justify-end pb-4 overflow-y-auto">
        
        {/* REPRODUCTOR COMPACTO - FIJO ABAJO */}
        <div className="bg-zinc-900/90 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl p-4 mx-2 md:mx-4 mb-2">
          
          {/* BARRA SUPERIOR - Indicador de scroll */}
          <div className="flex justify-center mb-3 cursor-pointer" onClick={() => setShowTrackList(!showTrackList)}>
            <div className="w-12 h-1 bg-zinc-600 rounded-full" />
          </div>

          {/* INFO PRINCIPAL - Compacta */}
          <div className="flex items-center gap-3 mb-3">
            <img src={currentTrack?.cover_url || artist.cover_url} alt="" className="w-16 h-16 rounded-lg object-cover shadow-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{currentTrack?.title || 'Sin titulo'}</h2>
              <p className="text-sm text-purple-300 truncate">{artist.name}</p>
              {currentTrack?.composer_name && <p className="text-xs text-zinc-500 truncate">{currentTrack.composer_name}</p>}
            </div>
          </div>

          {/* CONTROLES */}
          <div className="flex items-center justify-center gap-6 mb-3">
            <button onClick={prevTrack} className="text-zinc-400 hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button onClick={togglePlay} className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/30 hover:scale-105 transition-transform">
              {isPlaying ? <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg> : <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
            </button>
            <button onClick={nextTrack} className="text-zinc-400 hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="space-y-1 mb-2">
            <input type="range" min={0} max={duration || 0} value={progress} onChange={handleSeek} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-600" />
            <div className="flex justify-between text-xs text-zinc-400 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* BOTÓN PARA VER LISTA */}
          {tracks.length > 1 && (
            <button onClick={() => setShowTrackList(true)} className="w-full py-2 text-center text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-lg mt-2">
              Ver lista de canciones ({tracks.length})
            </button>
          )}
        </div>

        {/* LISTA DE CANCIONES - CARRUSEL DESLIZANTE */}
        {showTrackList && tracks.length > 1 && (
          <div className="bg-zinc-900/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl p-4 mx-2 md:mx-4 mb-20 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center mb-4 cursor-pointer" onClick={() => setShowTrackList(false)}>
              <div className="w-12 h-1 bg-zinc-600 rounded-full" />
            </div>
            <h3 className="text-lg font-bold text-white mb-4 text-center">Lista de Canciones</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tracks.map((track, index) => (
                <button key={track.id} onClick={() => { setCurrentTrackIndex(index); setIsPlaying(true); setShowTrackList(false); }} className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${index === currentTrackIndex ? 'bg-purple-600/20 border border-purple-500/50' : 'bg-zinc-800/50 hover:bg-zinc-800'}`}>
                  <img src={track.cover_url || artist.cover_url} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${index === currentTrackIndex ? 'text-purple-300' : 'text-white'}`}>{track.title}</p>
                    {track.composer_name && <p className="text-xs text-zinc-500">{track.composer_name}</p>}
                  </div>
                  {index === currentTrackIndex && isPlaying && <span className="text-purple-400">🔊</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} src={currentTrack?.audio_url} onTimeUpdate={handleTimeUpdate} onEnded={nextTrack} onLoadedMetadata={handleTimeUpdate} preload="metadata" />
    </div>
  );
}