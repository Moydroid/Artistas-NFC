'use client';

import { useState, useRef, useEffect } from 'react';

export default function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasPreviewWarning, setHasPreviewWarning] = useState(false);
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vipStatus = localStorage.getItem('vip_access');
      setIsVip(vipStatus === 'true');
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isVip) return;
    const handleTimeUpdate = () => {
      if (audio.currentTime >= 30) {
        audio.pause();
        audio.currentTime = 0;
        setHasPreviewWarning(true);
      }
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isVip]);

  return (
    <div className="relative w-full md:w-64">
      <audio ref={audioRef} controls className="h-10 w-full rounded-lg">
        <source src={src} type="audio/mpeg" />
      </audio>
      {!isVip && hasPreviewWarning && (
        <div className="absolute -bottom-8 left-0 w-full bg-red-900/90 text-red-200 text-xs px-2 py-1 rounded flex items-center gap-1 animate-pulse z-10">
          <span>🔒</span> Vista previa de 30s
        </div>
      )}
    </div>
  );
}
