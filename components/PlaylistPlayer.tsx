'use client';

import { useState, useRef, useEffect } from 'react';

interface Track {
  id: string;
  title: string;
  audio_url: string;
  artist_performer?: string;
}

export default function PlaylistPlayer({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPreviewWarning, setHasPreviewWarning] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Detectar si es VIP
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vipStatus = localStorage.getItem('vip_access');
      setIsVip(vipStatus === 'true');
    }
  }, []);

  const currentTrack = tracks[currentIndex];

  // Cargar canción cuando cambia el índice
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.load();
    if (isPlaying) {
      audio.play().catch(e => console.log('Error autoplay:', e));
    }
  }, [currentIndex]);

  // Protección de 30 segundos (ESTO ES LO QUE IMPORTA)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isVip) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      if (audio.currentTime >= 30) {
        audio.pause();
        setIsPlaying(false);
        setHasPreviewWarning(true);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isVip, currentIndex]);

  // Actualizar duración total
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [currentIndex]);

  // Actualizar tiempo actual
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      setHasPreviewWarning(false);
    }
  };

  const playNext = () => {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
      setHasPreviewWarning(false);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
      setHasPreviewWarning(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      {/* Info de la canción */}
      <div className="text-center">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          Reproduciendo ({currentIndex + 1} de {tracks.length})
        </p>
        <h3 className="text-xl font-bold text-white mt-1">{currentTrack.title}</h3>
        {currentTrack.artist_performer && (
          <p className="text-sm text-zinc-400">{currentTrack.artist_performer}</p>
        )}
      </div>

      {/* Barra de progreso VISIBLE */}
      <div className="space-y-2">
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Reproductor de audio nativo */}
      <audio 
        ref={audioRef} 
        src={currentTrack.audio_url} 
        className="hidden"
        onEnded={playNext}
      />

      {/* Controles */}
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={playPrevious} 
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg font-bold text-white transition"
        >
          ⏮ Anterior
        </button>
        
        <button 
          onClick={togglePlay}
          className="p-4 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button 
          onClick={playNext} 
          disabled={currentIndex === tracks.length - 1}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg font-bold text-white transition"
        >
          Siguiente ⏭
        </button>
      </div>

      {/* Advertencia de vista previa */}
      {!isVip && hasPreviewWarning && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-center animate-pulse">
          <p className="text-red-400 text-sm font-bold">🔒 Vista previa de 30s</p>
          <p className="text-zinc-400 text-xs mt-1">Escanea tu tarjeta NFC para escuchar completo</p>
        </div>
      )}

      {/* Lista de canciones */}
      <div className="border-t border-zinc-800 pt-4">
        <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Lista de canciones</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {tracks.map((track, index) => (
            <button 
              key={track.id} 
              onClick={() => { 
                setCurrentIndex(index); 
                setIsPlaying(true); 
                setHasPreviewWarning(false); 
              }} 
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                index === currentIndex 
                  ? 'bg-purple-600/20 text-purple-400 font-bold' 
                  : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              {index + 1}. {track.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}