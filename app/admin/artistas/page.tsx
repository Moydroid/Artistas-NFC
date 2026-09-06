"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminArtistas() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [artists, setArtists] = useState<any[]>([]);
  const [editingArtist, setEditingArtist] = useState<any>(null);

  const [formData, setFormData] = useState({
    artist_name: '',
    artist_slug: '',
    short_bio: '',
    instagram_url: '',
    cover_file: null as File | null,
    canvas_file: null as File | null,
    track_title: '',
    audio_file: null as File | null,
    composer_name: '',
    composer_percentage: 0,
  });

  useEffect(() => {
    fetchArtists();
  }, []);

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

  const editArtist = (artist: any) => {
    setEditingArtist(artist);
    setFormData({
      artist_name: artist.name,
      artist_slug: artist.slug,
      short_bio: artist.short_bio || '',
      instagram_url: artist.instagram_url || '',
      cover_file: null,
      canvas_file: null,
      track_title: '',
      audio_file: null,
      composer_name: '',
      composer_percentage: 0,
    });
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublish = async () => {
    setLoading(true);
    setStatus('🚀 Iniciando publicación...');

    try {
      // 1. Subir portada del artista (si hay nueva)
      let coverUrl = editingArtist?.cover_url || '';
      if (formData.cover_file) {
        setStatus('🖼️ Subiendo portada...');
        coverUrl = await uploadFile(formData.cover_file, 'artist-covers');
      }

      // 2. Subir canvas (si hay nuevo)
      let canvasUrl = editingArtist?.canvas_url || '';
      if (formData.canvas_file) {
        setStatus(' Subiendo canvas...');
        canvasUrl = await uploadFile(formData.canvas_file, 'videos');
      }

      // 3. Crear o Actualizar artista
      setStatus('💾 Guardando artista...');
      
      let artistId = editingArtist?.id;
      
      if (editingArtist) {
        // Actualizar artista existente
        const { error: updateError } = await supabase
          .from('artists')
          .update({
            name: formData.artist_name,
            slug: formData.artist_slug,
            short_bio: formData.short_bio,
            instagram_url: formData.instagram_url,
            cover_url: coverUrl,
            canvas_url: canvasUrl,
          })
          .eq('id', editingArtist.id);
        
        if (updateError) throw updateError;
      } else {
        // Crear nuevo artista
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .insert([
            {
              name: formData.artist_name,
              slug: formData.artist_slug,
              short_bio: formData.short_bio,
              instagram_url: formData.instagram_url,
              cover_url: coverUrl,
              canvas_url: canvasUrl,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (artistError) throw artistError;
        artistId = artistData.id;
      }

      // 4. Subir audio y crear canción (solo si hay audio nuevo)
      if (formData.audio_file && formData.track_title) {
        setStatus(' Subiendo audio...');
        const audioUrl = await uploadFile(formData.audio_file, 'audio');
        
        setStatus('🎶 Guardando canción...');
        const { error: trackError } = await supabase.from('tracks').insert([
          {
            artist_id: artistId,
            title: formData.track_title,
            audio_url: audioUrl,
            composer_name: formData.composer_name,
            composer_percentage: formData.composer_percentage,
          },
        ]);

        if (trackError) throw trackError;
      }

      setStatus(editingArtist ? '✅ Artista actualizado exitosamente!' : '✅ Artista publicado exitosamente!');
      fetchArtists();
      
      // Resetear formulario
      setTimeout(() => {
        setFormData({
          artist_name: '',
          artist_slug: '',
          short_bio: '',
          instagram_url: '',
          cover_file: null,
          canvas_file: null,
          track_title: '',
          audio_file: null,
          composer_name: '',
          composer_percentage: 0,
        });
        setEditingArtist(null);
        setStep(1);
        setStatus('');
      }, 2000);

    } catch (error: any) {
      console.error('Error:', error);
      setStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-400">
          {editingArtist ? '️ Editar Artista' : '🎤 Publicar Nuevo Artista'}
        </h1>

        {/* PROGRESO */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded ${step >= s ? 'bg-purple-600' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {/* PASO 1: DATOS DEL ARTISTA */}
        {step === 1 && (
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-xl font-bold mb-4">Paso 1: Datos del Artista</h2>
            
            <div>
              <label className="block text-sm mb-1">Nombre del Artista</label>
              <input type="text" placeholder="Ej: Herencina" value={formData.artist_name} 
                onChange={e => setFormData({...formData, artist_name: e.target.value})}
                className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
            </div>

            <div>
              <label className="block text-sm mb-1">Slug (URL amigable, sin espacios)</label>
              <input type="text" placeholder="Ej: herencina" value={formData.artist_slug} 
                onChange={e => setFormData({...formData, artist_slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
            </div>

            <div>
              <label className="block text-sm mb-1">Biografía Corta</label>
              <textarea placeholder="Ej: Artista de música regional..." value={formData.short_bio} 
                onChange={e => setFormData({...formData, short_bio: e.target.value})}
                className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 h-24" />
            </div>

            <div>
              <label className="block text-sm mb-1">Instagram</label>
              <input type="text" placeholder="https://instagram.com/..." value={formData.instagram_url} 
                onChange={e => setFormData({...formData, instagram_url: e.target.value})}
                className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold">
              Siguiente →
            </button>
          </div>
        )}

        {/* PASO 2: PORTADA Y CANVAS */}
        {step === 2 && (
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-xl font-bold mb-4">Paso 2: Imágenes</h2>
            
            <div>
              <label className="block text-sm mb-1">️ Portada del Artista</label>
              <input type="file" accept="image/*" 
                onChange={e => setFormData({...formData, cover_file: e.target.files?.[0] || null})}
                className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" />
              {formData.cover_file && <p className="text-xs text-green-400 mt-1">✅ {formData.cover_file.name}</p>}
              {!formData.cover_file && editingArtist?.cover_url && <p className="text-xs text-zinc-500 mt-1">Manteniendo portada actual</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">🎬 Canvas (Video de fondo, opcional)</label>
              <input type="file" accept="video/*" 
                onChange={e => setFormData({...formData, canvas_file: e.target.files?.[0] || null})}
                className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" />
              {formData.canvas_file && <p className="text-xs text-green-400 mt-1">✅ {formData.canvas_file.name}</p>}
              {!formData.canvas_file && editingArtist?.canvas_url && <p className="text-xs text-zinc-500 mt-1">Manteniendo canvas actual</p>}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded font-bold">
                ← Atrás
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: CANCIÓN */}
        {step === 3 && (
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-xl font-bold mb-4">Paso 3: Primera Canción (Opcional al editar)</h2>
            
            <div>
              <label className="block text-sm mb-1">Título de la Canción</label>
              <input type="text" placeholder="Ej: Mi Primera Canción" value={formData.track_title} 
                onChange={e => setFormData({...formData, track_title: e.target.value})}
                className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
            </div>

            <div>
              <label className="block text-sm mb-1">🎵 Archivo de Audio</label>
              <input type="file" accept="audio/*" 
                onChange={e => setFormData({...formData, audio_file: e.target.files?.[0] || null})}
                className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" />
              {formData.audio_file && <p className="text-xs text-green-400 mt-1">✅ {formData.audio_file.name}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Compositor</label>
              <input type="text" placeholder="Ej: Juan Pérez" value={formData.composer_name} 
                onChange={e => setFormData({...formData, composer_name: e.target.value})}
                className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
            </div>

            <div>
              <label className="block text-sm mb-1">Porcentaje de Regalía (%)</label>
              <input type="number" min="0" max="100" value={formData.composer_percentage} 
                onChange={e => setFormData({...formData, composer_percentage: parseInt(e.target.value) || 0})}
                className="w-full p-3 bg-zinc-800 rounded border border-zinc-700" />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded font-bold">
                ← Atrás
              </button>
              <button onClick={() => setStep(4)} className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold">
                Revisar →
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: REVISAR Y PUBLICAR */}
        {step === 4 && (
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-xl font-bold mb-4">Paso 4: Revisar y {editingArtist ? 'Actualizar' : 'Publicar'}</h2>
            
            <div className="bg-zinc-800 p-4 rounded space-y-2 text-sm">
              <p><strong>Artista:</strong> {formData.artist_name}</p>
              <p><strong>Slug:</strong> {formData.artist_slug}</p>
              <p><strong>Portada:</strong> {formData.cover_file?.name || (editingArtist?.cover_url ? 'Manteniendo actual' : 'No seleccionada')}</p>
              <p><strong>Canvas:</strong> {formData.canvas_file?.name || (editingArtist?.canvas_url ? 'Manteniendo actual' : 'No seleccionado')}</p>
              <p><strong>Canción:</strong> {formData.track_title || 'Sin canción nueva'}</p>
              <p><strong>Audio:</strong> {formData.audio_file?.name || 'Sin audio nuevo'}</p>
              <p><strong>Compositor:</strong> {formData.composer_name || 'No especificado'}</p>
              <p><strong>Regalía:</strong> {formData.composer_percentage}%</p>
            </div>

            {status && <p className="text-center font-bold">{status}</p>}

            <div className="flex gap-4">
              <button onClick={() => setStep(3)} disabled={loading} className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 py-3 rounded font-bold">
                ← Atrás
              </button>
              <button onClick={handlePublish} disabled={loading} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 py-3 rounded font-bold">
                {loading ? 'Procesando...' : (editingArtist ? '💾 ACTUALIZAR' : ' PUBLICAR')}
              </button>
            </div>
          </div>
        )}

        {/* LISTA DE ARTISTAS */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Artistas Publicados</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map(artist => (
              <div key={artist.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 relative group">
                <img src={artist.cover_url || 'https://via.placeholder.com/200'} alt={artist.name} className="w-full h-40 object-cover rounded mb-3" />
                <h3 className="font-bold">{artist.name}</h3>
                <p className="text-xs text-zinc-500 mb-3">/{artist.slug}</p>
                
                {/* Botón de Editar */}
                <button 
                  onClick={() => editArtist(artist)}
                  className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Editar artista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}