"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [showDownloadModal, setShowDownloadModal] = useState(false);

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

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); } 
    else { audio.play().then(() => setIsPlaying(true)).catch(() => setError('No se pudo reproducir')); }
  }, [isPlaying]);

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

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setShowTrackList(false);
  };

  const initiateDownload = () => setShowDownloadModal(true);

  const confirmDownload = () => {
    const track = tracks[currentTrackIndex];
    if (track?.audio_url && artist) {
      fetch(track.audio_url)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${artist.name} - ${track.title}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          setShowDownloadModal(false);
        })
        .catch(error => {
          console.error('Error al descargar:', error);
          alert('Error al descargar. Intenta de nuevo.');
          setShowDownloadModal(false);
        });
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando experiencia...</div>;
  if (!artist) return <div className="min-h-screen bg-black flex items-center justify-center text-red-400 p-4 text-center">Artista no encontrado<br/><span className="text-xs text-zinc-500 mt-2 block">{slug}</span></div>;

  if (!hasAccess && !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{artist.name}</h1>
          <p className="text-zinc-400 mb-6">Contenido Exclusivo</p>
          <input type="text" value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} placeholder="FONOXXXX" className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-center text-lg font-mono mb-4" maxLength={12} />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button onClick={verifyAccess} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl">Desbloquear</button>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];
  const progressPercent = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black">
      
      {/* 1. VIDEO DE FONDO */}
      {artist.canvas_url ? (
        <video 
          autoPlay loop muted playsInline preload="auto"
          className="fixed inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <source src={artist.canvas_url} type="video/mp4" />
        </video>
      ) : (
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${artist.cover_url})`, zIndex: 0 }}>
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Capa oscura sutil */}
      <div className="fixed inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" style={{ zIndex: 1 }} />

      {/* 2. CONTENIDO FLOTANTE */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-6 px-4">
        
        {/* REPRODUCTOR FLOTANTE (Efecto Vidrio) */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl mb-4">
          
          {/* Indicador de arrastre */}
          <div className="flex justify-center mb-3 cursor-pointer" onClick={() => setShowTrackList(true)}>
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Info de la canción */}
          <div className="flex items-center gap-4 mb-4">
            <img src={currentTrack?.cover_url || artist.cover_url} alt="" className="w-14 h-14 rounded-xl object-cover shadow-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">{currentTrack?.title || 'Sin titulo'}</h2>
              <p className="text-sm text-purple-300 truncate">{artist.name}</p>
            </div>
            {/* Botón de descarga */}
            <button onClick={initiateDownload} className="text-zinc-400 hover:text-white p-2 transition-colors" title="Descargar canción">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>

          {/* Barra de Progreso PINTADA */}
          <div className="mb-4">
            <input 
              type="range" min={0} max={duration || 0} value={progress} onChange={handleSeek} 
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ 
                background: `linear-gradient(to right, #a855f7 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)` 
              }}
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-8">
            <button onClick={prevTrack} className="text-white hover:text-purple-300 transition-colors">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button onClick={togglePlay} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={nextTrack} className="text-white hover:text-purple-300 transition-colors">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
          </div>
        </div>

        {/* Botón para ver lista */}
        {tracks.length > 1 && !showTrackList && (
          <button onClick={() => setShowTrackList(true)} className="text-center text-xs text-white/60 hover:text-white mb-2">
            Ver lista de canciones ({tracks.length})
          </button>
        )}
      </div>

      {/* 3. LISTA DE CANCIONES (Modal Vidrio) */}
      {showTrackList && tracks.length > 1 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTrackList(false)}>
          <div className="bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-5 w-full max-w-2xl max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4 cursor-pointer" onClick={() => setShowTrackList(false)}>
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>
            <h3 className="text-lg font-bold text-white mb-4 text-center">Lista de Canciones</h3>
            <div className="space-y-2">
              {tracks.map((track, index) => (
                <button key={track.id} onClick={() => selectTrack(index)} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${index === currentTrackIndex ? 'bg-purple-600/30 border border-purple-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                  <img src={track.cover_url || artist.cover_url} alt="" className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1 text-left">
                    <p className={`font-medium text-sm ${index === currentTrackIndex ? 'text-purple-300' : 'text-white'}`}>{track.title}</p>
                  </div>
                  {index === currentTrackIndex && isPlaying && <span className="text-purple-400 text-xs">Reproduciendo</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DE CONFIRMACIÓN DE DESCARGA */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setShowDownloadModal(false)}>
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¿Descargar canción?</h3>
              <p className="text-sm text-zinc-400 mb-6 truncate">
                {currentTrack?.title} - {artist.name}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDownloadModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDownload}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20"
                >
                  Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} src={currentTrack?.audio_url} onTimeUpdate={handleTimeUpdate} onEnded={nextTrack} onLoadedMetadata={handleTimeUpdate} preload="auto" />
    </div>
  );
}