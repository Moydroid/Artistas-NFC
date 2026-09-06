"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type TrackStatus = 'idle' | 'uploading' | 'success' | 'error';
interface AlbumTrack {
  id: string; title: string; composer: string; percentage: number;
  audio_file: File | null; cover_file: File | null; status: TrackStatus; message: string;
}

export default function AdminPublicar() {
  const router = useRouter();
  const [publishMode, setPublishMode] = useState<'single' | 'album'>('single');
  
  // --- ESTADOS PARA SENCILLO ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [artists, setArtists] = useState<any[]>([]);
  const [editingArtist, setEditingArtist] = useState<any>(null);
  const [formData, setFormData] = useState({
    artist_name: '', artist_slug: '', short_bio: '', instagram_url: '',
    cover_file: null as File | null, canvas_file: null as File | null,
    track_title: '', audio_file: null as File | null, composer_name: '', composer_percentage: 0,
  });

  // --- ESTADOS PARA ÁLBUM ---
  const [albumArtistMode, setAlbumArtistMode] = useState<'existing' | 'new'>('existing');
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [newArtistData, setNewArtistData] = useState({
    name: '', slug: '', short_bio: '', instagram_url: '',
    cover_file: null as File | null, canvas_file: null as File | null
  });
  const [albumTracks, setAlbumTracks] = useState<AlbumTrack[]>([
    { id: crypto.randomUUID(), title: '', composer: '', percentage: 0, audio_file: null, cover_file: null, status: 'idle', message: '' }
  ]);
  const [albumLoading, setAlbumLoading] = useState(false);

  useEffect(() => { fetchArtists(); }, []);

  const fetchArtists = async () => {
    const { data } = await supabase.from('artists').select('*').order('created_at', { ascending: false });
    if (data) setArtists(data);
  };

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ==========================================
  // LÓGICA MODO SENCILLO
  // ==========================================
  const editArtist = (artist: any) => {
    setEditingArtist(artist);
    setFormData({
      artist_name: artist.name, artist_slug: artist.slug, short_bio: artist.short_bio || '',
      instagram_url: artist.instagram_url || '', cover_file: null, canvas_file: null,
      track_title: '', audio_file: null, composer_name: '', composer_percentage: 0,
    });
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublishSingle = async () => {
    setLoading(true); setStatus('🚀 Iniciando...');
    try {
      let coverUrl = editingArtist?.cover_url || '';
      if (formData.cover_file) { coverUrl = await uploadFile(formData.cover_file, 'artist-covers'); }
      let canvasUrl = editingArtist?.canvas_url || '';
      if (formData.canvas_file) { canvasUrl = await uploadFile(formData.canvas_file, 'videos'); }

      let artistId = editingArtist?.id;
      if (editingArtist) {
        await supabase.from('artists').update({ name: formData.artist_name, slug: formData.artist_slug, short_bio: formData.short_bio, instagram_url: formData.instagram_url, cover_url: coverUrl, canvas_url: canvasUrl }).eq('id', editingArtist.id);
      } else {
        const { data: artistData } = await supabase.from('artists').insert([{ name: formData.artist_name, slug: formData.artist_slug, short_bio: formData.short_bio, instagram_url: formData.instagram_url, cover_url: coverUrl, canvas_url: canvasUrl, is_active: true }]).select().single();
        artistId = artistData.id;
      }

      if (formData.audio_file && formData.track_title) {
        const audioUrl = await uploadFile(formData.audio_file, 'audio');
        await supabase.from('tracks').insert([{ artist_id: artistId, title: formData.track_title, audio_url: audioUrl, composer_name: formData.composer_name, composer_percentage: formData.composer_percentage }]);
      }

      setStatus(editingArtist ? '✅ Actualizado' : '✅ Publicado');
      fetchArtists();
      setTimeout(() => {
        setFormData({ artist_name: '', artist_slug: '', short_bio: '', instagram_url: '', cover_file: null, canvas_file: null, track_title: '', audio_file: null, composer_name: '', composer_percentage: 0 });
        setEditingArtist(null); setStep(1); setStatus('');
      }, 3000);
    } catch (error: any) { setStatus('❌ Error: ' + error.message); } finally { setLoading(false); }
  };

  // ==========================================
  // LÓGICA MODO ÁLBUM
  // ==========================================
  const addTrack = () => setAlbumTracks([...albumTracks, { id: crypto.randomUUID(), title: '', composer: '', percentage: 0, audio_file: null, cover_file: null, status: 'idle', message: '' }]);
  const removeTrack = (index: number) => setAlbumTracks(albumTracks.filter((_, i) => i !== index));
  
  const publishAlbum = async () => {
    let finalArtistId = selectedArtistId;

    // 1. Si es artista nuevo, lo creamos primero
    if (albumArtistMode === 'new') {
      if (!newArtistData.name || !newArtistData.slug) { alert('⚠️ Pon el nombre y el slug del artista nuevo.'); return; }
      
      let coverUrl = newArtistData.cover_file ? await uploadFile(newArtistData.cover_file, 'artist-covers') : '';
      let canvasUrl = newArtistData.canvas_file ? await uploadFile(newArtistData.canvas_file, 'videos') : '';

      const { data: artistData, error: artistError } = await supabase.from('artists').insert([{
        name: newArtistData.name, slug: newArtistData.slug, short_bio: newArtistData.short_bio,
        instagram_url: newArtistData.instagram_url, cover_url: coverUrl, canvas_url: canvasUrl, is_active: true
      }]).select().single();

      if (artistError) { alert('❌ Error al crear artista: ' + artistError.message); return; }
      finalArtistId = artistData.id;
      fetchArtists(); // Actualizar la lista
    } else {
      // 2. Si es existente, validamos que haya seleccionado uno
      if (!finalArtistId) { alert('️ Selecciona un artista existente.'); return; }
    }

    // 3. Subir canciones
    setAlbumLoading(true);
    let currentTracks = [...albumTracks];
    const updateTrack = (index: number, field: keyof AlbumTrack, value: any) => { currentTracks[index] = { ...currentTracks[index], [field]: value }; setAlbumTracks([...currentTracks]); };

    for (let i = 0; i < currentTracks.length; i++) {
      const track = currentTracks[i];
      if (!track.audio_file && !track.title) { updateTrack(i, 'status', 'idle'); continue; }
      updateTrack(i, 'status', 'uploading'); updateTrack(i, 'message', 'Subiendo...');
      try {
        let audioUrl = '', coverUrl = '';
        if (track.audio_file) {
          const name = `${Date.now()}-${track.audio_file.name}`;
          await supabase.storage.from('audio').upload(name, track.audio_file);
          audioUrl = supabase.storage.from('audio').getPublicUrl(name).data.publicUrl;
        }
        if (track.cover_file) {
          const name = `${Date.now()}-${track.cover_file.name}`;
          await supabase.storage.from('artist-covers').upload(name, track.cover_file);
          coverUrl = supabase.storage.from('artist-covers').getPublicUrl(name).data.publicUrl;
        }
        await supabase.from('tracks').insert({ artist_id: finalArtistId, title: track.title || 'Sin título', audio_url: audioUrl, cover_url: coverUrl, composer_name: track.composer, composer_percentage: track.percentage });
        updateTrack(i, 'status', 'success'); updateTrack(i, 'message', '✅ Publicada');
      } catch (error: any) { updateTrack(i, 'status', 'error'); updateTrack(i, 'message', '❌ ' + error.message); }
    }
    setAlbumLoading(false);
    alert('🎉 ¡Álbum publicado con éxito!');
  };

  // ==========================================
  // VISTA PRINCIPAL
  // ==========================================
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER Y PESTAÑAS PRINCIPALES */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-6 text-purple-400">Centro de Publicación</h1>
          <div className="inline-flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button onClick={() => setPublishMode('single')} className={`px-8 py-3 rounded-lg font-bold transition-all ${publishMode === 'single' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
               Sencillo
            </button>
            <button onClick={() => setPublishMode('album')} className={`px-8 py-3 rounded-lg font-bold transition-all ${publishMode === 'album' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
              💿 Álbum
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* MODO SENCILLO (WIZARD DE 4 PASOS) */}
        {/* ========================================== */}
        {publishMode === 'single' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4].map((s) => (<div key={s} className={`flex-1 h-2 rounded ${step >= s ? 'bg-purple-600' : 'bg-zinc-800'}`} />))}
            </div>

            {step === 1 && (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
                <h2 className="text-xl font-bold mb-4">Paso 1: Datos del Artista</h2>
                <input type="text" placeholder="Nombre del Artista" value={formData.artist_name} onChange={e => setFormData({...formData, artist_name: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                <input type="text" placeholder="Slug (ej: herencina)" value={formData.artist_slug} onChange={e => setFormData({...formData, artist_slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                <textarea placeholder="Biografía" value={formData.short_bio} onChange={e => setFormData({...formData, short_bio: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 h-24" />
                <input type="text" placeholder="Instagram" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                <button onClick={() => setStep(2)} className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold">Siguiente →</button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
                <h2 className="text-xl font-bold mb-4">Paso 2: Imágenes</h2>
                <input type="file" accept="image/*" onChange={e => setFormData({...formData, cover_file: e.target.files?.[0] || null})} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" />
                <input type="file" accept="video/*" onChange={e => setFormData({...formData, canvas_file: e.target.files?.[0] || null})} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" />
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded font-bold">← Atrás</button>
                  <button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold">Siguiente →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
                <h2 className="text-xl font-bold mb-4">Paso 3: Canción</h2>
                <input type="text" placeholder="Título" value={formData.track_title} onChange={e => setFormData({...formData, track_title: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                <input type="file" accept="audio/*" onChange={e => setFormData({...formData, audio_file: e.target.files?.[0] || null})} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" />
                <input type="text" placeholder="Compositor" value={formData.composer_name} onChange={e => setFormData({...formData, composer_name: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                <input type="number" placeholder="Regalía %" value={formData.composer_percentage} onChange={e => setFormData({...formData, composer_percentage: parseInt(e.target.value) || 0})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded font-bold">← Atrás</button>
                  <button onClick={() => setStep(4)} className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold">Revisar →</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
                <h2 className="text-xl font-bold mb-4">Paso 4: Revisar</h2>
                <div className="bg-zinc-800 p-4 rounded space-y-2 text-sm">
                  <p><strong>Artista:</strong> {formData.artist_name}</p>
                  <p><strong>Canción:</strong> {formData.track_title || 'Sin canción'}</p>
                </div>
                {status && <p className={`text-center font-bold ${status.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>{status}</p>}
                {status.includes('✅') && !status.includes('Actualizado') && (
                  <button onClick={() => router.push('/admin/codigos')} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold">🎟️ Ir a Generar Códigos →</button>
                )}
                <div className="flex gap-4">
                  <button onClick={() => setStep(3)} disabled={loading} className="flex-1 bg-zinc-700 py-3 rounded font-bold">← Atrás</button>
                  <button onClick={handlePublishSingle} disabled={loading} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded font-bold">{loading ? '...' : ' PUBLICAR'}</button>
                </div>
              </div>
            )}

            {/* Lista de artistas existentes */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Artistas Publicados</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artists.map(artist => (
                  <div key={artist.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 relative group">
                    <img src={artist.cover_url || 'https://via.placeholder.com/200'} className="w-full h-40 object-cover rounded mb-3" />
                    <h3 className="font-bold">{artist.name}</h3>
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => router.push('/admin/codigos')} className="bg-green-600 p-2 rounded-lg">🎟️</button>
                      <button onClick={() => editArtist(artist)} className="bg-blue-600 p-2 rounded-lg">️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODO ÁLBUM (ESTUDIO DINÁMICO) */}
        {/* ========================================== */}
        {publishMode === 'album' && (
          <div className="animate-in fade-in duration-300">
            
            {/* SELECCIÓN DE ARTISTA (EXISTENTE O NUEVO) */}
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-8">
              <h2 className="text-xl font-bold mb-4 text-purple-400">1. Configurar Artista</h2>
              
              {/* Interruptor Existente / Nuevo */}
              <div className="inline-flex bg-zinc-800 p-1 rounded-lg border border-zinc-700 mb-4">
                <button onClick={() => setAlbumArtistMode('existing')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${albumArtistMode === 'existing' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>
                  📂 Artista Existente
                </button>
                <button onClick={() => setAlbumArtistMode('new')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${albumArtistMode === 'new' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>
                  🆕 Crear Artista Nuevo
                </button>
              </div>

              {albumArtistMode === 'existing' ? (
                <select value={selectedArtistId} onChange={e => setSelectedArtistId(e.target.value)} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 text-white">
                  <option value="">-- Elige un artista de la lista --</option>
                  {artists.map(artist => (<option key={artist.id} value={artist.id}>{artist.name}</option>))}
                </select>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Nombre del Artista *" value={newArtistData.name} onChange={e => setNewArtistData({...newArtistData, name: e.target.value})} className="p-3 bg-zinc-800 rounded border border-zinc-700" />
                  <input type="text" placeholder="Slug (ej: herencina) *" value={newArtistData.slug} onChange={e => setNewArtistData({...newArtistData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="p-3 bg-zinc-800 rounded border border-zinc-700" />
                  <input type="text" placeholder="Instagram" value={newArtistData.instagram_url} onChange={e => setNewArtistData({...newArtistData, instagram_url: e.target.value})} className="p-3 bg-zinc-800 rounded border border-zinc-700" />
                  <input type="text" placeholder="Biografía corta" value={newArtistData.short_bio} onChange={e => setNewArtistData({...newArtistData, short_bio: e.target.value})} className="p-3 bg-zinc-800 rounded border border-zinc-700" />
                  <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
                    <input type="file" accept="image/*" onChange={e => setNewArtistData({...newArtistData, cover_file: e.target.files?.[0] || null})} className="flex-1 p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                    <input type="file" accept="video/*" onChange={e => setNewArtistData({...newArtistData, canvas_file: e.target.files?.[0] || null})} className="flex-1 p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* LISTA DE CANCIONES DEL ÁLBUM */}
            <div className="space-y-4 mb-8">
              {albumTracks.map((track, index) => (
                <div key={track.id} className={`bg-zinc-900 p-6 rounded-xl border ${track.status === 'success' ? 'border-green-500/50' : track.status === 'error' ? 'border-red-500/50' : 'border-zinc-800'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-purple-400">Canción {index + 1}</h3>
                    <div className="flex items-center gap-3">
                      {track.status === 'uploading' && <span className="text-xs text-yellow-400 animate-pulse">⏳ Subiendo...</span>}
                      {track.status === 'success' && <span className="text-xs text-green-400 font-bold">{track.message}</span>}
                      {track.status === 'error' && <span className="text-xs text-red-400">{track.message}</span>}
                      <button onClick={() => removeTrack(index)} className="text-red-400 hover:text-red-300 text-sm font-bold">🗑️ Eliminar</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Título de la Canción" value={track.title} onChange={e => { const n = [...albumTracks]; n[index].title = e.target.value; setAlbumTracks(n); }} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                    </div>
                    <div>
                      <input type="text" placeholder="Compositor" value={track.composer} onChange={e => { const n = [...albumTracks]; n[index].composer = e.target.value; setAlbumTracks(n); }} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                    </div>
                    <div>
                      <input type="number" placeholder="Regalía %" value={track.percentage} onChange={e => { const n = [...albumTracks]; n[index].percentage = parseInt(e.target.value) || 0; setAlbumTracks(n); }} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                    </div>
                    <div>
                      <input type="file" accept="audio/*" onChange={e => { const n = [...albumTracks]; n[index].audio_file = e.target.files?.[0] || null; setAlbumTracks(n); }} className="w-full p-1 bg-zinc-800 rounded border border-zinc-700 text-xs" />
                    </div>
                    <div>
                      <input type="file" accept="image/*" onChange={e => { const n = [...albumTracks]; n[index].cover_file = e.target.files?.[0] || null; setAlbumTracks(n); }} className="w-full p-1 bg-zinc-800 rounded border border-zinc-700 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button onClick={addTrack} disabled={albumLoading} className="flex-1 border-2 border-dashed border-zinc-700 hover:border-purple-500 text-zinc-400 hover:text-purple-400 py-4 rounded-xl font-bold transition-all">
                <span className="text-2xl">+</span> Agregar otra canción
              </button>
              <button onClick={publishAlbum} disabled={albumLoading} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-lg">
                {albumLoading ? '🚀 Publicando Álbum...' : '🚀 PUBLICAR ÁLBUM COMPLETO'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}