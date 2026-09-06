"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export default function AccesoArtista() {
  const params = useParams();
  const slug = params.slug as string;

  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoMode, setIsVideoMode] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { if (slug) fetchArtist(); }, [slug]);
  
  useEffect(() => {
    if (!accessGranted || !artist) return;
    const currentAudio = audioRef.current;
    const currentVideo = videoRef.current;

    if (isVideoMode && currentVideo) {
      isPlaying ? currentVideo.play().catch(() => setIsPlaying(false)) : currentVideo.pause();
    } else if (!isVideoMode && currentAudio) {
      isPlaying ? currentAudio.play().catch(() => setIsPlaying(false)) : currentAudio.pause();
    }
  }, [isPlaying, currentTrackIndex, isVideoMode, accessGranted, artist]);

  const fetchArtist = async () => {
    const { data, error } = await supabase.from('artists').select('*').eq('slug', slug).single();
    if (error) { setStatus('❌ Artista no encontrado'); return; }
    setArtist(data);
    const { data: tracksData } = await supabase.from('tracks').select('*').eq('artist_id', data.id);
    if (tracksData) setTracks(tracksData);
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setLoading(true); setStatus('🔍 Validando...');
    try {
      const { data: codeData, error } = await supabase.from('access_codes').select('*').eq('code', codeInput.trim().toUpperCase()).eq('artist_id', artist.id).single();
      if (error || !codeData) { setStatus('❌ Código inválido'); setLoading(false); return; }
      if (codeData.is_used) { setStatus('⚠️ Código ya usado'); setLoading(false); return; }
      await supabase.from('access_codes').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', codeData.id);
      setStatus('✅ ¡Acceso concedido!'); setAccessGranted(true);
    } catch (err: any) { setStatus('❌ Error: ' + err.message); } finally { setLoading(false); }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const playTrack = (index: number) => { setCurrentTrackIndex(index); setIsPlaying(true); };
  
  const skip = (seconds: number) => {
    if (isVideoMode && videoRef.current) videoRef.current.currentTime += seconds;
    else if (audioRef.current) audioRef.current.currentTime += seconds;
  };

  const downloadTrack = () => {
    const url = isVideoMode ? currentTrack?.video_url : currentTrack?.audio_url;
    const ext = isVideoMode ? 'mp4' : 'mp3';
    if (url) { const a = document.createElement('a'); a.href = url; a.download = `${currentTrack.title}.${ext}`; a.click(); }
  };

  const handleTimeUpdate = () => {
    if (isVideoMode && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime); setDuration(videoRef.current.duration || 0);
    } else if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime); setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (isVideoMode && videoRef.current) videoRef.current.currentTime = time;
    else if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (t: number) => isNaN(t) ? "0:00" : `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2, '0')}`;
  const currentTrack = tracks[currentTrackIndex];
  const coverUrl = currentTrack?.cover_url || artist?.cover_url || 'https://via.placeholder.com/400';

  // VISTA 1: LOGIN
  if (!accessGranted) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black z-0" />
        <div className="relative z-10 w-full max-w-md bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] text-center">
          <img src={artist?.cover_url} className="w-28 h-28 object-cover rounded-full mx-auto mb-6 border-2 border-purple-500 shadow-lg" />
          <h1 className="text-2xl font-bold mb-1">Contenido Exclusivo</h1>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8">{artist?.name}</h2>
          <form onSubmit={handleValidate} className="space-y-4">
            <input type="text" placeholder="FONO-XXXXXX" value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} className="w-full p-4 bg-black/50 rounded-xl border border-zinc-700 text-center text-xl font-mono tracking-widest focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
            <button disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/50 transition-all">{loading ? 'VALIDANDO...' : '🔓 DESBLOQUEAR'}</button>
          </form>
          {status && <p className={`mt-4 text-sm font-bold ${status.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
        </div>
      </main>
    );
  }

  // VISTA 2: REPRODUCTOR FINAL
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      
      {/* FONDO DINÁMICO */}
      <div className="fixed inset-0 z-0">
        {artist?.canvas_url && !isVideoMode ? (
          <video src={artist.canvas_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full overflow-hidden">
            <img src={coverUrl} className="w-full h-full object-cover" style={{ animation: 'kenburns 20s ease-in-out infinite' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* VIDEO A PANTALLA COMPLETA EN MODO VIDEO */}
      {isVideoMode && currentTrack?.video_url && (
        <video ref={videoRef} src={currentTrack.video_url} onTimeUpdate={handleTimeUpdate} onEnded={() => { setIsPlaying(false); setCurrentTime(0); }} onLoadedMetadata={handleTimeUpdate} playsInline className="fixed inset-0 w-full h-full object-cover z-0" />
      )}

      {/* AUDIO OCULTO */}
      {!isVideoMode && currentTrack?.audio_url && (
        <audio ref={audioRef} src={currentTrack.audio_url} onTimeUpdate={handleTimeUpdate} onEnded={() => { setIsPlaying(false); setCurrentTime(0); }} onLoadedMetadata={handleTimeUpdate} preload="metadata" />
      )}

      <style jsx>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.15) translate(-2%, -2%); }
          100% { transform: scale(1) translate(0, 0); }
        }
      `}</style>

      {/* CONTENIDO FLOTANTE */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-end pb-12 px-4 gap-4">
        
        {/* TÍTULO Y ARTISTA (BIEN VISIBLES) */}
        <div className="text-center w-full max-w-xs mb-2 px-4">
          <p className="text-sm font-bold text-purple-300 uppercase tracking-[0.2em] drop-shadow-lg mb-1">
            {artist?.name}
          </p>
          <h2 className="text-2xl font-black text-white drop-shadow-2xl truncate leading-tight">
            {currentTrack?.title || 'Selecciona una canción'}
          </h2>
        </div>

        {/* PANEL COMPACTO DE CRISTAL */}
        <div className="w-full max-w-xs bg-black/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl">
          
          {/* Controles de Reproducción */}
          <div className="flex justify-center items-center gap-6 mb-4">
            <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
            </button>
            
            <button onClick={togglePlay} className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-105 transition-transform">
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg>
            </button>
          </div>

          {/* Barra de Progreso */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] text-white/60 w-8 text-right font-mono">{formatTime(currentTime)}</span>
            <div className="flex-1 relative h-1 bg-white/10 rounded-full">
              <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-white/60 w-8 font-mono">{formatTime(duration)}</span>
          </div>

          {/* Botones de Acción (Descargar y Video) */}
          <div className="flex gap-2">
            <button onClick={downloadTrack} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Descargar {isVideoMode ? 'Video' : 'Audio'}
            </button>
            
            {currentTrack?.video_url && (
              <button onClick={() => setIsVideoMode(!isVideoMode)} className="bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                {isVideoMode ? '🎵 Audio' : '🎬 Video'}
              </button>
            )}
          </div>
        </div>

        {/* Playlist Compacta */}
        {tracks.length > 1 && (
          <div className="w-full max-w-xs bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden max-h-24 overflow-y-auto">
            {tracks.map((track, index) => (
              <button key={track.id} onClick={() => playTrack(index)} className={`w-full text-left px-3 py-2 border-b border-white/5 flex items-center gap-2 transition-colors ${index === currentTrackIndex ? 'bg-purple-500/20 text-white' : 'text-white/60 hover:bg-white/5'}`}>
                <span className="text-[9px] font-mono w-4">{index + 1}</span>
                <span className="truncate flex-1 text-xs font-medium">{track.title}</span>
                {index === currentTrackIndex && isPlaying && <span className="text-[10px] animate-pulse">🎵</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}