"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type TrackStatus = 'idle' | 'uploading' | 'success' | 'error';

interface Track {
  id: string;
  title: string;
  composer: string;
  percentage: number;
  audio_file: File | null;
  cover_file: File | null;
  status: TrackStatus;
  message: string;
}

export default function AdminAlbumes() {
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [tracks, setTracks] = useState<Track[]>([
    { id: crypto.randomUUID(), title: '', composer: '', percentage: 0, audio_file: null, cover_file: null, status: 'idle', message: '' }
  ]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [albumSuccess, setAlbumSuccess] = useState(false); // Nuevo estado para el mensaje de éxito

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    const { data } = await supabase.from('artists').select('id, name').order('name');
    if (data) setArtists(data);
  };

  const addTrack = () => {
    setTracks([...tracks, { id: crypto.randomUUID(), title: '', composer: '', percentage: 0, audio_file: null, cover_file: null, status: 'idle', message: '' }]);
  };

  const removeTrack = (index: number) => {
    const newTracks = tracks.filter((_, i) => i !== index);
    setTracks(newTracks.length === 0 ? [{ id: crypto.randomUUID(), title: '', composer: '', percentage: 0, audio_file: null, cover_file: null, status: 'idle', message: '' }] : newTracks);
  };

  // Función corregida para evitar que se trabe el loop
  const publishAlbum = async () => {
    if (!selectedArtistId) { alert('⚠️ Selecciona un artista primero.'); return; }
    if (tracks.every(t => !t.audio_file && !t.title)) { alert('⚠️ Agrega al menos una canción con audio o título.'); return; }

    setGlobalLoading(true);
    setAlbumSuccess(false);

    // Creamos una copia local para que el loop no se pierda
    let currentTracks = [...tracks];

    const updateLocalTrack = (index: number, field: keyof Track, value: any) => {
      currentTracks[index] = { ...currentTracks[index], [field]: value };
      setTracks([...currentTracks]);
    };

    for (let i = 0; i < currentTracks.length; i++) {
      const track = currentTracks[i];
      
      if (!track.audio_file && !track.title) {
        updateLocalTrack(i, 'status', 'idle');
        continue;
      }

      updateLocalTrack(i, 'status', 'uploading');
      updateLocalTrack(i, 'message', 'Subiendo archivos...');

      try {
        let audioUrl = '';
        let coverUrl = '';

        if (track.audio_file) {
          const audioName = `${Date.now()}-${track.audio_file.name}`;
          const { error: audioError } = await supabase.storage.from('audio').upload(audioName, track.audio_file);
          if (audioError) throw audioError;
          const { data: audioData } = supabase.storage.from('audio').getPublicUrl(audioName);
          audioUrl = audioData.publicUrl;
        }

        if (track.cover_file) {
          const coverName = `${Date.now()}-${track.cover_file.name}`;
          const { error: coverError } = await supabase.storage.from('artist-covers').upload(coverName, track.cover_file);
          if (coverError) throw coverError;
          const { data: coverData } = supabase.storage.from('artist-covers').getPublicUrl(coverName);
          coverUrl = coverData.publicUrl;
        }

        const { error: dbError } = await supabase.from('tracks').insert({
          artist_id: selectedArtistId,
          title: track.title || track.audio_file?.name.replace(/\.[^/.]+$/, "") || 'Sin título',
          audio_url: audioUrl,
          cover_url: coverUrl,
          composer_name: track.composer,
          composer_percentage: track.percentage,
        });

        if (dbError) throw dbError;

        updateLocalTrack(i, 'status', 'success');
        updateLocalTrack(i, 'message', '✅ Publicada');
      } catch (error: any) {
        updateLocalTrack(i, 'status', 'error');
        updateLocalTrack(i, 'message', `❌ ${error.message}`);
      }
    }

    setGlobalLoading(false);
    setAlbumSuccess(true); // ¡Aquí activamos el mensaje de éxito!
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-purple-400">🎛️ Estudio de Álbum</h1>
        <p className="text-zinc-500 mb-8">Gestiona y sube el álbum completo de un artista.</p>

        {/* MENSAJE DE ÉXITO GIGANTE */}
        {albumSuccess && (
          <div className="mb-8 bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-xl text-center font-bold text-lg animate-pulse">
             ¡Álbum publicado con éxito! Revisa el reproductor del artista.
          </div>
        )}

        {/* SELECCIÓN DE ARTISTA */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-8">
          <label className="block text-sm font-bold mb-2">Artista del Álbum</label>
          <select 
            value={selectedArtistId} 
            onChange={e => setSelectedArtistId(e.target.value)}
            className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="">-- Selecciona un artista --</option>
            {artists.map(artist => (
              <option key={artist.id} value={artist.id}>{artist.name}</option>
            ))}
          </select>
        </div>

        {/* LISTA DE CANCIONES */}
        <div className="space-y-4 mb-8">
          {tracks.map((track, index) => (
            <div key={track.id} className={`bg-zinc-900 p-6 rounded-xl border ${track.status === 'success' ? 'border-green-500/50' : track.status === 'error' ? 'border-red-500/50' : 'border-zinc-800'} transition-all`}>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-purple-400">Canción {index + 1}</h3>
                <div className="flex items-center gap-3">
                  {track.status === 'uploading' && <span className="text-xs text-yellow-400 animate-pulse">⏳ Subiendo...</span>}
                  {track.status === 'success' && <span className="text-xs text-green-400 font-bold">{track.message}</span>}
                  {track.status === 'error' && <span className="text-xs text-red-400">{track.message}</span>}
                  <button onClick={() => removeTrack(index)} className="text-red-400 hover:text-red-300 text-sm font-bold">️ Eliminar</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Título de la Canción</label>
                  <input type="text" value={track.title} onChange={e => {
                    const newTracks = [...tracks];
                    newTracks[index].title = e.target.value;
                    setTracks(newTracks);
                  }} placeholder="Ej: Soy Abundancia" className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm focus:border-purple-500 focus:outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Compositor</label>
                  <input type="text" value={track.composer} onChange={e => {
                    const newTracks = [...tracks];
                    newTracks[index].composer = e.target.value;
                    setTracks(newTracks);
                  }} placeholder="Nombre del compositor" className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm focus:border-purple-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Regalía (%)</label>
                  <input type="number" min="0" max="100" value={track.percentage} onChange={e => {
                    const newTracks = [...tracks];
                    newTracks[index].percentage = parseInt(e.target.value) || 0;
                    setTracks(newTracks);
                  }} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm focus:border-purple-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">🎵 Archivo de Audio (WAV/MP3)</label>
                  <input type="file" accept="audio/*" onChange={e => {
                    const newTracks = [...tracks];
                    newTracks[index].audio_file = e.target.files?.[0] || null;
                    setTracks(newTracks);
                  }} className="w-full p-1 bg-zinc-800 rounded border border-zinc-700 text-xs text-zinc-300 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                  {track.audio_file && <p className="text-xs text-green-400 mt-1">✅ {track.audio_file.name}</p>}
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">🖼️ Portada de la Canción (Opcional)</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const newTracks = [...tracks];
                    newTracks[index].cover_file = e.target.files?.[0] || null;
                    setTracks(newTracks);
                  }} className="w-full p-1 bg-zinc-800 rounded border border-zinc-700 text-xs text-zinc-300 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-pink-600 file:text-white hover:file:bg-pink-700" />
                  {track.cover_file && <p className="text-xs text-green-400 mt-1">✅ {track.cover_file.name}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={addTrack} 
            disabled={globalLoading}
            className="flex-1 border-2 border-dashed border-zinc-700 hover:border-purple-500 text-zinc-400 hover:text-purple-400 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="text-2xl">+</span> Agregar otra canción
          </button>

          <button 
            onClick={publishAlbum} 
            disabled={globalLoading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
          >
            {globalLoading ? '🚀 Publicando Álbum...' : '🚀 PUBLICAR ÁLBUM COMPLETO'}
          </button>
        </div>
      </div>
    </main>
  );
}