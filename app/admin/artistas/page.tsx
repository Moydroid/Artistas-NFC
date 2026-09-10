"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const normalizeSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function AdminPublicar() {
  const router = useRouter();
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [copiedArtist, setCopiedArtist] = useState<string | null>(null);
  
  // Estados para crear/editar artista
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState<any>(null);
  const [artistForm, setArtistForm] = useState({
    name: '', slug: '', short_bio: '', instagram_url: '',
    cover_file: null as File | null, canvas_file: null as File | null,
  });
  const [artistLoading, setArtistLoading] = useState(false);

  // Estados para crear/editar canción
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [trackForm, setTrackForm] = useState({
    title: '', audio_file: null as File | null, cover_file: null as File | null,
    composer_name: '', composer_percentage: 0,
  });
  const [trackLoading, setTrackLoading] = useState(false);

  // QA Player
  const [qaArtist, setQaArtist] = useState<any>(null);
  const [qaTracks, setQaTracks] = useState<any[]>([]);
  const [qaTrackIndex, setQaTrackIndex] = useState(0);
  const [qaIsPlaying, setQaIsPlaying] = useState(false);
  const audioQaRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { fetchArtists(); }, []);

  const fetchArtists = async () => {
    const { data } = await supabase.from('artists').select('*').order('created_at', { ascending: false });
    if (data) setArtists(data);
  };

  const fetchTracks = async (artistId: string) => {
    const { data } = await supabase.from('tracks').select('*').eq('artist_id', artistId).order('created_at', { ascending: true });
    if (data) setTracks(data);
  };

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const activeArtists = artists.filter(a => a.is_active !== false);
  const trashedArtists = artists.filter(a => a.is_active === false);

  const copyArtistLink = async (artist: any) => {
    const link = `https://fonotap.vercel.app/acceso/${artist.slug}`;
    try { await navigator.clipboard.writeText(link); } catch {
      const t = document.createElement('textarea'); t.value = link; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
    }
    setCopiedArtist(artist.id); setTimeout(() => setCopiedArtist(null), 2000);
  };

  // ===== GESTIÓN DE ARTISTAS =====
  const openArtistForm = (artist?: any) => {
    if (artist) {
      setEditingArtist(artist);
      setArtistForm({
        name: artist.name, slug: artist.slug, short_bio: artist.short_bio || '',
        instagram_url: artist.instagram_url || '', cover_file: null, canvas_file: null,
      });
    } else {
      setEditingArtist(null);
      setArtistForm({ name: '', slug: '', short_bio: '', instagram_url: '', cover_file: null, canvas_file: null });
    }
    setShowArtistForm(true);
    setShowTrackForm(false);
  };

  const saveArtist = async () => {
    if (!artistForm.name || !artistForm.slug) { alert('Nombre y slug son obligatorios'); return; }
    setArtistLoading(true);
    try {
      let coverUrl = editingArtist?.cover_url || '';
      if (artistForm.cover_file) coverUrl = await uploadFile(artistForm.cover_file, 'artist-covers');
      let canvasUrl = editingArtist?.canvas_url || '';
      if (artistForm.canvas_file) canvasUrl = await uploadFile(artistForm.canvas_file, 'videos');

      if (editingArtist) {
        await supabase.from('artists').update({
          name: artistForm.name, slug: artistForm.slug, short_bio: artistForm.short_bio,
          instagram_url: artistForm.instagram_url, cover_url: coverUrl, canvas_url: canvasUrl,
        }).eq('id', editingArtist.id);
      } else {
        await supabase.from('artists').insert([{
          name: artistForm.name, slug: artistForm.slug, short_bio: artistForm.short_bio,
          instagram_url: artistForm.instagram_url, cover_url: coverUrl, canvas_url: canvasUrl, is_active: true,
        }]);
      }
      await fetchArtists();
      setShowArtistForm(false);
    } catch (e: any) { alert('Error: ' + e.message); } finally { setArtistLoading(false); }
  };

  const deleteArtist = async (artist: any) => {
    if (!window.confirm(`¿Mandar a "${artist.name}" a la papelera?`)) return;
    try {
      await supabase.from('artists').update({ is_active: false }).eq('id', artist.id);
      await fetchArtists();
      if (selectedArtist?.id === artist.id) { setSelectedArtist(null); setTracks([]); }
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const restoreArtist = async (artist: any) => {
    try { await supabase.from('artists').update({ is_active: true }).eq('id', artist.id); await fetchArtists(); } catch (e: any) { alert('Error: ' + e.message); }
  };

  const permanentDelete = async (artist: any) => {
    if (!window.confirm(`¿BORRAR PERMANENTEMENTE a "${artist.name}"?`)) return;
    try {
      await supabase.from('tracks').delete().eq('artist_id', artist.id);
      await supabase.from('access_codes').delete().eq('artist_id', artist.id);
      await supabase.from('artists').delete().eq('id', artist.id);
      await fetchArtists();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  // ===== GESTIÓN DE CANCIONES =====
  const selectArtist = async (artist: any) => {
    setSelectedArtist(artist);
    await fetchTracks(artist.id);
    setShowArtistForm(false);
    setShowTrackForm(false);
  };

  const openTrackForm = (track?: any) => {
    if (track) {
      setEditingTrack(track);
      setTrackForm({
        title: track.title, audio_file: null, cover_file: null,
        composer_name: track.composer_name || '', composer_percentage: track.composer_percentage || 0,
      });
    } else {
      setEditingTrack(null);
      setTrackForm({ title: '', audio_file: null, cover_file: null, composer_name: '', composer_percentage: 0 });
    }
    setShowTrackForm(true);
    setShowArtistForm(false);
  };

  const saveTrack = async () => {
    if (!selectedArtist) return;
    if (!trackForm.title) { alert('El título es obligatorio'); return; }
    if (!editingTrack && !trackForm.audio_file) { alert('Debes subir un archivo de audio'); return; }
    
    setTrackLoading(true);
    try {
      let audioUrl = editingTrack?.audio_url || '';
      if (trackForm.audio_file) audioUrl = await uploadFile(trackForm.audio_file, 'audio');
      let coverUrl = editingTrack?.cover_url || '';
      if (trackForm.cover_file) coverUrl = await uploadFile(trackForm.cover_file, 'artist-covers');

      if (editingTrack) {
        await supabase.from('tracks').update({
          title: trackForm.title, audio_url: audioUrl, cover_url: coverUrl,
          composer_name: trackForm.composer_name, composer_percentage: trackForm.composer_percentage,
        }).eq('id', editingTrack.id);
      } else {
        await supabase.from('tracks').insert([{
          artist_id: selectedArtist.id, title: trackForm.title, audio_url: audioUrl, cover_url: coverUrl,
          composer_name: trackForm.composer_name, composer_percentage: trackForm.composer_percentage,
        }]);
      }
      await fetchTracks(selectedArtist.id);
      setShowTrackForm(false);
    } catch (e: any) { alert('Error: ' + e.message); } finally { setTrackLoading(false); }
  };

  const deleteTrack = async (track: any) => {
    if (!window.confirm(`¿Eliminar la canción "${track.title}"?`)) return;
    try {
      await supabase.from('tracks').delete().eq('id', track.id);
      await fetchTracks(selectedArtist.id);
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  // ===== QA PLAYER =====
  const openQaPlayer = async (artist: any) => {
    setQaArtist(artist);
    const { data } = await supabase.from('tracks').select('*').eq('artist_id', artist.id).order('created_at', { ascending: true });
    if (data && data.length > 0) { setQaTracks(data); setQaTrackIndex(0); setQaIsPlaying(false); }
    else { setQaTracks([]); alert('Este artista aún no tiene canciones.'); }
  };

  const toggleQaPlay = () => {
    if (audioQaRef.current) {
      if (qaIsPlaying) audioQaRef.current.pause();
      else audioQaRef.current.play();
      setQaIsPlaying(!qaIsPlaying);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-purple-400">🎛️ Centro de Administración</h1>
          <button onClick={() => router.push('/admin/codigos')} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold">🎟️ Generar Códigos</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: LISTA DE ARTISTAS */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Artistas</h2>
                <button onClick={() => openArtistForm()} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm">+ Nuevo</button>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activeArtists.map(artist => (
                  <div key={artist.id} className={`p-3 rounded-lg cursor-pointer transition-all ${selectedArtist?.id === artist.id ? 'bg-purple-600/20 border border-purple-500/50' : 'bg-zinc-800 hover:bg-zinc-700'}`} onClick={() => selectArtist(artist)}>
                    <div className="flex items-center gap-3">
                      <img src={artist.cover_url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{artist.name}</p>
                        <p className="text-xs text-zinc-500 truncate">/{artist.slug}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {trashedArtists.length > 0 && (
                <button onClick={() => setShowTrash(!showTrash)} className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg text-sm">🗑️ Papelera ({trashedArtists.length})</button>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: DETALLE DEL ARTISTA SELECCIONADO */}
          <div className="lg:col-span-2">
            {!selectedArtist && !showArtistForm && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
                <p className="text-zinc-500 text-lg">Selecciona un artista o crea uno nuevo</p>
              </div>
            )}

            {selectedArtist && !showArtistForm && !showTrackForm && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img src={selectedArtist.cover_url || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-xl object-cover" />
                    <div>
                      <h2 className="text-2xl font-bold">{selectedArtist.name}</h2>
                      <p className="text-zinc-500 text-sm">/{selectedArtist.slug}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openArtistForm(selectedArtist)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">✏️ Editar</button>
                        <button onClick={() => copyArtistLink(selectedArtist)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm">{copiedArtist === selectedArtist.id ? '✅' : '🔗'}</button>
                        <button onClick={() => openQaPlayer(selectedArtist)} className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm">🎧 QA</button>
                        <button onClick={() => deleteArtist(selectedArtist)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Canciones ({tracks.length})</h3>
                    <button onClick={() => openTrackForm()} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold text-sm">+ Agregar Canción</button>
                  </div>
                  {tracks.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No hay canciones aún</p>
                  ) : (
                    <div className="space-y-2">
                      {tracks.map(track => (
                        <div key={track.id} className="bg-zinc-800 p-4 rounded-lg flex items-center gap-4">
                          <img src={track.cover_url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{track.title}</p>
                            {track.composer_name && <p className="text-xs text-zinc-500">Compositor: {track.composer_name} ({track.composer_percentage}%)</p>}
                          </div>
                          <button onClick={() => openTrackForm(track)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">✏️</button>
                          <button onClick={() => deleteTrack(track)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">🗑️</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {showArtistForm && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6">{editingArtist ? 'Editar Artista' : 'Nuevo Artista'}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-400 mb-1">Nombre</label>
                    <input type="text" value={artistForm.name} onChange={e => setArtistForm({...artistForm, name: e.target.value, slug: normalizeSlug(e.target.value)})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-500 mb-1">Slug (URL)</label>
                    <input type="text" value={artistForm.slug} onChange={e => setArtistForm({...artistForm, slug: normalizeSlug(e.target.value)})} className="w-full p-3 bg-zinc-800/50 rounded border border-zinc-700 text-zinc-400 font-mono text-sm" />
                  </div>
                  <textarea placeholder="Biografía" value={artistForm.short_bio} onChange={e => setArtistForm({...artistForm, short_bio: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 h-24" />
                  <input type="text" placeholder="Instagram" value={artistForm.instagram_url} onChange={e => setArtistForm({...artistForm, instagram_url: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                  <div>
                    <label className="block text-sm font-bold text-purple-400 mb-1">🖼️ Portada</label>
                    <input type="file" accept="image/*" onChange={e => setArtistForm({...artistForm, cover_file: e.target.files?.[0] || null})} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-400 mb-1">🎥 Canvas/Video</label>
                    <input type="file" accept="video/*" onChange={e => setArtistForm({...artistForm, canvas_file: e.target.files?.[0] || null})} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowArtistForm(false)} className="flex-1 bg-zinc-700 py-3 rounded font-bold">Cancelar</button>
                    <button onClick={saveArtist} disabled={artistLoading} className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold">{artistLoading ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </div>
              </div>
            )}

            {showTrackForm && selectedArtist && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6">{editingTrack ? 'Editar Canción' : 'Nueva Canción'}</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Título" value={trackForm.title} onChange={e => setTrackForm({...trackForm, title: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                  <div>
                    <label className="block text-sm font-bold text-purple-400 mb-1">🎵 Audio {editingTrack && '(dejar vacío para mantener el actual)'}</label>
                    <input type="file" accept="audio/*" onChange={e => setTrackForm({...trackForm, audio_file: e.target.files?.[0] || null})} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-400 mb-1">🖼️ Portada {editingTrack && '(dejar vacío para mantener la actual)'}</label>
                    <input type="file" accept="image/*" onChange={e => setTrackForm({...trackForm, cover_file: e.target.files?.[0] || null})} className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 text-sm" />
                  </div>
                  <input type="text" placeholder="Compositor" value={trackForm.composer_name} onChange={e => setTrackForm({...trackForm, composer_name: e.target.value})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                  <input type="number" placeholder="Regalía %" value={trackForm.composer_percentage} onChange={e => setTrackForm({...trackForm, composer_percentage: parseInt(e.target.value) || 0})} className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
                  <div className="flex gap-4">
                    <button onClick={() => setShowTrackForm(false)} className="flex-1 bg-zinc-700 py-3 rounded font-bold">Cancelar</button>
                    <button onClick={saveTrack} disabled={trackLoading} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-bold">{trackLoading ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showTrash && (
          <div className="mt-8 bg-zinc-900 border border-red-500/30 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">🗑️ Papelera</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {trashedArtists.map(artist => (
                <div key={artist.id} className="bg-zinc-800 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-bold line-through">{artist.name}</p>
                    <p className="text-xs text-zinc-500">/{artist.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => restoreArtist(artist)} className="bg-green-600 px-3 py-1 rounded text-sm">♻️</button>
                    <button onClick={() => permanentDelete(artist)} className="bg-red-800 px-3 py-1 rounded text-sm">💀</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {qaArtist && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full relative">
              <button onClick={() => { setQaArtist(null); if(audioQaRef.current) audioQaRef.current.pause(); }} className="absolute top-4 right-4 text-zinc-500 hover:text-white text-2xl">✕</button>
              <h3 className="text-xl font-bold text-purple-400 mb-4">🎧 QA: {qaArtist.name}</h3>
              {qaTracks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={qaTracks[qaTrackIndex]?.cover_url || qaArtist.cover_url} className="w-24 h-24 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-lg font-bold">{qaTracks[qaTrackIndex]?.title}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setQaTrackIndex((p) => (p - 1 + qaTracks.length) % qaTracks.length); setQaIsPlaying(true); }} className="text-zinc-400 hover:text-white">⏮</button>
                        <button onClick={toggleQaPlay} className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">{qaIsPlaying ? '⏸' : '▶'}</button>
                        <button onClick={() => { setQaTrackIndex((p) => (p + 1) % qaTracks.length); setQaIsPlaying(true); }} className="text-zinc-400 hover:text-white">⏭</button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {qaTracks.map((t, i) => (
                      <button key={t.id} onClick={() => { setQaTrackIndex(i); setQaIsPlaying(true); }} className={`w-full text-left p-2 rounded text-sm ${i === qaTrackIndex ? 'bg-purple-600/20 text-purple-300' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                        {i + 1}. {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <audio ref={audioQaRef} src={qaTracks[qaTrackIndex]?.audio_url} onEnded={() => { setQaTrackIndex(p => (p+1) % qaTracks.length); setQaIsPlaying(true); }} onPlay={() => setQaIsPlaying(true)} onPause={() => setQaIsPlaying(false)} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}