'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('datos');
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Estados del formulario
  const [artistName, setArtistName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [fullBio, setFullBio] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [social, setSocial] = useState({ instagram: '', tiktok: '', facebook: '', youtube: '' });

  const [youtubeVideos, setYoutubeVideos] = useState<{ id: string; title: string; youtubeId: string }[]>([{ id: Date.now().toString(), title: '', youtubeId: '' }]);

  const [customVideos, setCustomVideos] = useState<{ 
    id: string; 
    title: string; 
    fileName: string; 
    file: File | null;
    thumbnailFile: File | null;
    thumbnailPreview: string | null;
  }[]>([{ id: Date.now().toString(), title: '', fileName: '', file: null, thumbnailFile: null, thumbnailPreview: null }]);

  const [albums, setAlbums] = useState<{
    id: string; 
    name: string; 
    year: string; 
    price: string; 
    collapsed: boolean;
    coverFile: File | null;
    coverPreview: string | null;
    tracks: { 
      id: string; 
      title: string; 
      artist: string; 
      composers: string; 
      royaltyPercentage: string; 
      lyrics: string; 
      fileName: string; 
      file: File | null; 
      price: string; 
      collapsed: boolean; 
    }[];
  }[]>([]);

  const [singles, setSingles] = useState<{
    id: string; 
    title: string; 
    artist: string; 
    composers: string; 
    royaltyPercentage: string; 
    lyrics: string; 
    fileName: string; 
    file: File | null;
    coverFile: File | null;
    coverPreview: string | null;
    price: string; 
    collapsed: boolean;
  }[]>([]);

  const tabs = [
    { id: 'datos', label: '👤 Datos Básicos' },
    { id: 'musica', label: '🎵 Música y Álbumes' },
    { id: 'multimedia', label: '📱 Redes y Videos' },
    { id: 'publicar', label: '🚀 Publicar' }
  ];

  const getCurrentTabIndex = () => tabs.findIndex(t => t.id === activeTab);

  // Cargar borrador
  useEffect(() => {
    const saved = localStorage.getItem('admin-draft');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setArtistName(data.artistName || ''); 
        setSlug(data.slug || '');
        setShortBio(data.shortBio || ''); 
        setFullBio(data.fullBio || '');
        setSocial(data.social || { instagram: '', tiktok: '', facebook: '', youtube: '' });
        if (data.youtubeVideos) setYoutubeVideos(data.youtubeVideos);
        if (data.albums) {
          setAlbums(data.albums.map((a: any) => ({ 
            ...a, 
            coverFile: null, 
            coverPreview: null, 
            tracks: a.tracks.map((t: any) => ({ ...t, file: null })) 
          })));
        }
        if (data.singles) {
          setSingles(data.singles.map((s: any) => ({ 
            ...s, 
            file: null,
            coverFile: null,
            coverPreview: null
          })));
        }
        if (data.customVideos) {
          setCustomVideos(data.customVideos.map((v: any) => ({ 
            ...v, 
            file: null, 
            thumbnailFile: null, 
            thumbnailPreview: null 
          })));
        }
      } catch (e) { 
        console.error('Error cargando borrador:', e); 
      }
    }
  }, []);

  // Guardar borrador
  const saveDraft = () => {
    const cleanAlbums = albums.map(a => ({ 
      ...a, 
      coverFile: null, 
      coverPreview: null, 
      tracks: a.tracks.map(t => ({ ...t, file: null })) 
    }));
    const cleanSingles = singles.map(s => ({ 
      ...s, 
      file: null,
      coverFile: null,
      coverPreview: null
    }));
    const cleanCustomVideos = customVideos.map(v => ({ 
      ...v, 
      file: null, 
      thumbnailFile: null, 
      thumbnailPreview: null 
    }));
    
    const data = { 
      artistName, 
      slug, 
      shortBio, 
      fullBio, 
      social, 
      youtubeVideos, 
      albums: cleanAlbums, 
      singles: cleanSingles, 
      customVideos: cleanCustomVideos 
    };
    localStorage.setItem('admin-draft', JSON.stringify(data));
    setSaveMessage('💾 Borrador guardado en tu navegador');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const clearDraft = (silent = false) => {
    if (!silent && !confirm('¿Seguro que quieres borrar TODO el progreso?')) return;
    localStorage.removeItem('admin-draft');
    setArtistName(''); 
    setSlug(''); 
    setShortBio(''); 
    setFullBio('');
    setCoverPreview(null); 
    setCoverFile(null);
    setSocial({ instagram: '', tiktok: '', facebook: '', youtube: '' });
    setYoutubeVideos([{ id: Date.now().toString(), title: '', youtubeId: '' }]);
    setCustomVideos([{ id: Date.now().toString(), title: '', fileName: '', file: null, thumbnailFile: null, thumbnailPreview: null }]);
    setAlbums([]); 
    setSingles([]);
    if (!silent) { 
      setSaveMessage('🗑️ Formulario limpio'); 
      setTimeout(() => setSaveMessage(''), 3000); 
    }
  };

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 3; i++) { 
      for (let j = 0; j < 4; j++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      if (i < 2) code += '-'; 
    }
    return code;
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  // PUBLICAR CON SUBIDA DE TODOS LOS ARCHIVOS
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveMessage('');

    try {
      let coverUrl = '';
      if (coverFile) {
        setUploadProgress('📤 Subiendo portada del artista...');
        coverUrl = await uploadFile(coverFile, 'covers', `${slug}/cover.jpg`);
      }

      setUploadProgress('💾 Guardando datos del artista...');
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .insert({ 
          slug, 
          name: artistName, 
          short_bio: shortBio, 
          full_bio: fullBio, 
          cover_url: coverUrl || null, 
          social_links: social, 
          is_active: true 
        })
        .select().single();

      if (artistError) {
        if (artistError.code === '23505') {
          throw new Error(`Ya existe un artista con la URL "${slug}". Cambia el nombre.`);
        }
        throw artistError;
      }

      // 3. Procesar Álbumes
      for (const album of albums) {
        if (!album.name) continue;
        
        let albumCoverUrl = '';
        if (album.coverFile) {
          setUploadProgress(`📤 Subiendo portada del álbum: ${album.name}...`);
          const ext = album.coverFile.name.split('.').pop() || 'jpg';
          albumCoverUrl = await uploadFile(
            album.coverFile, 
            'covers', 
            `${slug}/albums/${album.name.replace(/\s+/g, '_')}/cover.${ext}`
          );
        }

        const { data: albumData } = await supabase.from('albums').insert({ 
          artist_id: artistData.id, 
          name: album.name, 
          year: album.year || new Date().getFullYear().toString(), 
          price: parseFloat(album.price) || 0,
          cover_url: albumCoverUrl || null
        }).select().single();

        for (const track of album.tracks) {
          if (!track.title) continue;
          let audioUrl = '';
          if (track.file) {
            setUploadProgress(`🎵 Subiendo audio: ${track.title}...`);
            const ext = track.file.name.split('.').pop() || 'mp3';
            audioUrl = await uploadFile(
              track.file, 
              'audio', 
              `${slug}/${track.title.replace(/\s+/g, '_')}.${ext}`
            );
          }
          await supabase.from('tracks').insert({ 
            artist_id: artistData.id, 
            album_id: albumData?.id || null, 
            title: track.title, 
            artist_performer: track.artist || artistName, 
            composers: track.composers || '', 
            royalty_percentage: parseFloat(track.royaltyPercentage) || 0, 
            lyrics: track.lyrics || '', 
            audio_url: audioUrl, 
            price: parseFloat(track.price) || 0, 
            is_single: false 
          });
        }
      }

      // 4. Procesar SENCILLOS
      for (const single of singles) {
        if (!single.title) continue;
        
        let audioUrl = '';
        if (single.file) {
          setUploadProgress(`🎵 Subiendo sencillo: ${single.title}...`);
          const ext = single.file.name.split('.').pop() || 'mp3';
          audioUrl = await uploadFile(
            single.file, 
            'audio', 
            `${slug}/singles/${single.title.replace(/\s+/g, '_')}.${ext}`
          );
        }

        let singleCoverUrl = '';
        if (single.coverFile) {
          setUploadProgress(`📤 Subiendo portada del sencillo: ${single.title}...`);
          const ext = single.coverFile.name.split('.').pop() || 'jpg';
          singleCoverUrl = await uploadFile(
            single.coverFile, 
            'covers', 
            `${slug}/singles/${single.title.replace(/\s+/g, '_')}/cover.${ext}`
          );
        }

        await supabase.from('tracks').insert({ 
          artist_id: artistData.id, 
          title: single.title, 
          artist_performer: single.artist || artistName, 
          composers: single.composers || '', 
          royalty_percentage: parseFloat(single.royaltyPercentage) || 0, 
          lyrics: single.lyrics || '', 
          audio_url: audioUrl,
          cover_url: singleCoverUrl || null,
          price: parseFloat(single.price) || 0, 
          is_single: true 
        });
      }

      // 5. Procesar Videos de YouTube
      for (const video of youtubeVideos) {
        if (video.youtubeId) {
          await supabase.from('videos').insert({ 
            artist_id: artistData.id, 
            title: video.title || 'Video', 
            video_type: 'youtube', 
            youtube_id: video.youtubeId 
          });
        }
      }

      // 6. Procesar Videos Propios
      for (const video of customVideos) {
        if (video.file) {
          setUploadProgress(`🎬 Subiendo video: ${video.title}...`);
          const ext = video.file.name.split('.').pop() || 'mp4';
          const videoUrl = await uploadFile(
            video.file, 
            'videos', 
            `${slug}/${video.title.replace(/\s+/g, '_')}.${ext}`
          );

          let thumbnailUrl = '';
          if (video.thumbnailFile) {
            setUploadProgress(`📤 Subiendo miniatura del video: ${video.title}...`);
            const thumbExt = video.thumbnailFile.name.split('.').pop() || 'jpg';
            thumbnailUrl = await uploadFile(
              video.thumbnailFile, 
              'covers', 
              `${slug}/videos/${video.title.replace(/\s+/g, '_')}_thumbnail.${thumbExt}`
            );
          }

          await supabase.from('videos').insert({ 
            artist_id: artistData.id, 
            title: video.title || 'Video', 
            video_type: 'custom', 
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl || null
          });
        }
      }

      // 7. Generar claves de acceso
      for (let i = 0; i < 5; i++) {
        await supabase.from('access_codes').insert({ 
          code: generateAccessCode(), 
          artist_id: artistData.id, 
          is_active: true 
        });
      }

      setUploadProgress('');
      setSaveMessage('✅ ¡Artista publicado exitosamente en la nube!');
      setTimeout(() => setSaveMessage(''), 5000);
      clearDraft(true);

    } catch (error: any) {
      console.error('💥 ERROR AL PUBLICAR:', error);
      setUploadProgress('');
      setSaveMessage('❌ Error: ' + error.message);
      setTimeout(() => setSaveMessage(''), 8000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (password === 'admin123') setIsAuthenticated(true); 
    else alert('Contraseña incorrecta'); 
  };

  const handleNameChange = (name: string) => { 
    setArtistName(name); 
    setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); 
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      setCoverFile(file); 
      setCoverPreview(URL.createObjectURL(file)); 
    } 
  };

  const addYoutubeVideo = () => setYoutubeVideos([...youtubeVideos, { id: Date.now().toString(), title: '', youtubeId: '' }]);
  const updateYoutubeVideo = (id: string, field: string, value: string) => setYoutubeVideos(youtubeVideos.map(v => v.id === id ? { ...v, [field]: value } : v));
  const removeYoutubeVideo = (id: string) => setYoutubeVideos(youtubeVideos.filter(v => v.id !== id));

  const addCustomVideo = () => setCustomVideos([...customVideos, { 
    id: Date.now().toString(), 
    title: '', 
    fileName: '', 
    file: null, 
    thumbnailFile: null, 
    thumbnailPreview: null 
  }]);
  
  const updateCustomVideo = (id: string, field: string, value: any) => setCustomVideos(customVideos.map(v => v.id === id ? { ...v, [field]: value } : v));
  const removeCustomVideo = (id: string) => setCustomVideos(customVideos.filter(v => v.id !== id));
  
  const handleCustomVideoFile = (id: string, e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      updateCustomVideo(id, 'fileName', file.name); 
      updateCustomVideo(id, 'file', file); 
    } 
  };

  const handleCustomVideoThumbnail = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateCustomVideo(id, 'thumbnailFile', file);
      updateCustomVideo(id, 'thumbnailPreview', URL.createObjectURL(file));
    }
  };

  const addAlbum = () => setAlbums([...albums, { 
    id: Date.now().toString(), 
    name: '', 
    year: '', 
    price: '99', 
    collapsed: false, 
    coverFile: null, 
    coverPreview: null, 
    tracks: [{ 
      id: Date.now().toString(), 
      title: '', 
      artist: '', 
      composers: '', 
      royaltyPercentage: '', 
      lyrics: '', 
      fileName: '', 
      file: null, 
      price: '', 
      collapsed: false 
    }] 
  }]);
  
  const updateAlbum = (id: string, field: string, value: any) => setAlbums(albums.map(a => a.id === id ? { ...a, [field]: value } : a));
  const toggleAlbumCollapse = (id: string) => setAlbums(albums.map(a => a.id === id ? { ...a, collapsed: !a.collapsed } : a));
  const removeAlbum = (id: string) => { 
    if (confirm('¿Eliminar este álbum?')) setAlbums(albums.filter(a => a.id !== id)); 
  };
  
  const addTrackToAlbum = (albumId: string) => setAlbums(albums.map(a => a.id === albumId ? { 
    ...a, 
    tracks: [...a.tracks, { 
      id: Date.now().toString(), 
      title: '', 
      artist: '', 
      composers: '', 
      royaltyPercentage: '', 
      lyrics: '', 
      fileName: '', 
      file: null, 
      price: '', 
      collapsed: false 
    }] 
  } : a));
  
  const updateTrackInAlbum = (albumId: string, trackId: string, field: string, value: any) => setAlbums(albums.map(a => a.id === albumId ? { 
    ...a, 
    tracks: a.tracks.map(t => t.id === trackId ? { ...t, [field]: value } : t) 
  } : a));
  
  const toggleTrackCollapse = (albumId: string, trackId: string) => setAlbums(albums.map(a => a.id === albumId ? { 
    ...a, 
    tracks: a.tracks.map(t => t.id === trackId ? { ...t, collapsed: !t.collapsed } : t) 
  } : a));
  
  const removeTrackFromAlbum = (albumId: string, trackId: string) => setAlbums(albums.map(a => a.id === albumId ? { 
    ...a, 
    tracks: a.tracks.filter(t => t.id !== trackId) 
  } : a));
  
  const handleTrackFileInAlbum = (albumId: string, trackId: string, e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      updateTrackInAlbum(albumId, trackId, 'fileName', file.name); 
      updateTrackInAlbum(albumId, trackId, 'file', file); 
    } 
  };

  const addSingle = () => setSingles([...singles, { 
    id: Date.now().toString(), 
    title: '', 
    artist: '', 
    composers: '', 
    royaltyPercentage: '', 
    lyrics: '', 
    fileName: '', 
    file: null,
    coverFile: null,
    coverPreview: null,
    price: '', 
    collapsed: false 
  }]);
  
  const updateSingle = (id: string, field: string, value: any) => setSingles(singles.map(s => s.id === id ? { ...s, [field]: value } : s));
  const toggleSingleCollapse = (id: string) => setSingles(singles.map(s => s.id === id ? { ...s, collapsed: !s.collapsed } : s));
  const removeSingle = (id: string) => { 
    if (confirm('¿Eliminar este sencillo?')) setSingles(singles.filter(s => s.id !== id)); 
  };
  
  const handleSingleFile = (id: string, e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      updateSingle(id, 'fileName', file.name); 
      updateSingle(id, 'file', file); 
    } 
  };

  const handleSingleCover = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateSingle(id, 'coverFile', file);
      updateSingle(id, 'coverPreview', URL.createObjectURL(file));
    }
  };

  const NavigationButtons = () => {
    const index = getCurrentTabIndex();
    return (
      <div className="flex justify-between mt-8 pt-6 border-t border-zinc-800">
        {index > 0 ? (
          <button type="button" onClick={() => setActiveTab(tabs[index - 1].id)} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition">⬅️ Anterior</button>
        ) : <div />}
        {index < tabs.length - 1 ? (
          <button type="button" onClick={() => setActiveTab(tabs[index + 1].id)} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition">Siguiente ➡️</button>
        ) : <div />}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center mb-4"><span className="text-3xl">🔐</span></div>
            <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
            <p className="text-zinc-400 text-sm mt-2">Ingresa la contraseña maestra</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500" />
            <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition">Entrar</button>
          </form>
          <p className="text-center text-zinc-600 text-xs mt-6">Contraseña de prueba: admin123</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <nav className="fixed top-0 w-full z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="text-2xl">🎛️</span><h1 className="font-bold text-lg">Disquera Admin</h1></div>
          <div className="flex gap-3 items-center">
            <button onClick={saveDraft} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition">💾 Borrador</button>
            <button onClick={() => clearDraft(false)} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-bold rounded-lg transition">🗑️ Limpiar</button>
            <Link href="/admin/generar-codigos" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition">🏭 Generar Lote</Link>
            <Link href="/" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">Ver Web</Link>
            <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-zinc-800 text-zinc-400 text-sm font-bold rounded-lg hover:bg-zinc-700 transition">Salir</button>
          </div>
        </div>
      </nav>

      {saveMessage && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-50 font-bold animate-bounce ${saveMessage.includes('✅') ? 'bg-green-600 text-white' : saveMessage.includes('❌') ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          {saveMessage}
        </div>
      )}

      {uploadProgress && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-yellow-600 text-white rounded-xl shadow-2xl z-50 font-bold animate-pulse">
          {uploadProgress}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 pt-24">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-zinc-800">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-t-lg font-bold text-sm whitespace-nowrap transition ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handlePublish}>
          {activeTab === 'datos' && (
            <div className="space-y-6">
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Información del Artista</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nombre del Artista</label>
                    <input type="text" value={artistName} onChange={(e) => handleNameChange(e.target.value)} className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl text-white focus:border-purple-500 focus:outline-none" placeholder="Ej. Herencia González Bs." required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">URL Slug (Automático)</label>
                    <input type="text" value={slug} readOnly className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-500 cursor-not-allowed" />
                  </div>
                </div>
                
                {/* Botón para ver la página pública del artista (AQUÍ ESTÁ ARREGLADO) */}
                {slug && (
                  <div className="md:col-span-2 mt-2">
                    <Link 
                      href={`/artistas/${slug}`} 
                      target="_blank"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition shadow-lg"
                    >
                      👁️ Abrir Página Pública del Artista
                    </Link>
                    <p className="text-zinc-500 text-xs mt-2">* Solo funciona si ya publicaste al artista al menos una vez.</p>
                  </div>
                )}

                <div className="mb-4 mt-4">
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Biografía Corta</label>
                  <input type="text" value={shortBio} onChange={(e) => setShortBio(e.target.value)} className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl text-white focus:border-purple-500 focus:outline-none" placeholder="Descripción en una línea..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Biografía Completa</label>
                  <textarea value={fullBio} onChange={(e) => setFullBio(e.target.value)} rows={4} className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl text-white focus:border-purple-500 focus:outline-none resize-none" placeholder="Historia completa..." />
                </div>
              </section>

              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Portada Principal del Artista</h2>
                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-purple-500 transition bg-black/50">
                  {coverPreview ? (
                    <div className="space-y-4">
                      <img src={coverPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-lg" />
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-full">
                        <span className="text-green-400 text-lg">📎</span>
                        <span className="text-green-400 text-sm font-bold truncate max-w-[200px]">{coverFile?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-zinc-400 mb-4">Selecciona la foto de portada del artista</p>
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" id="cover-upload" />
                      <label htmlFor="cover-upload" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer transition">Seleccionar Imagen</label>
                    </div>
                  )}
                </div>
              </section>
              <NavigationButtons />
            </div>
          )}

          {activeTab === 'musica' && (
            <div className="space-y-6">
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Álbumes</h2>
                  <button type="button" onClick={addAlbum} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition">+ Crear Álbum</button>
                </div>
                {albums.length === 0 && <p className="text-zinc-500 text-center py-8">No hay álbumes creados.</p>}
                <div className="space-y-6">
                  {albums.map((album, albumIndex) => (
                    <div key={album.id} className="bg-black/50 border border-purple-500/30 rounded-xl overflow-hidden">
                      <div className="bg-purple-900/30 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button type="button" onClick={() => toggleAlbumCollapse(album.id)} className="text-white text-xl hover:scale-110 transition">{album.collapsed ? '▶' : '▼'}</button>
                          <span className="text-purple-400 font-bold">Álbum #{albumIndex + 1}</span>
                          {album.name && <span className="text-white font-bold">- {album.name}</span>}
                        </div>
                        <button type="button" onClick={() => removeAlbum(album.id)} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg transition">🗑️ Eliminar Álbum</button>
                      </div>
                      {!album.collapsed && (
                        <div className="p-6 space-y-4">
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-xs text-zinc-500 mb-1">Nombre del Álbum</label>
                              <input type="text" value={album.name} onChange={(e) => updateAlbum(album.id, 'name', e.target.value)} placeholder="Ej. 'Raíces'" className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1">Año</label>
                              <input type="text" value={album.year} onChange={(e) => updateAlbum(album.id, 'year', e.target.value)} placeholder="2026" className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Portada del Álbum (Opcional)</label>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  updateAlbum(album.id, 'coverFile', file);
                                  updateAlbum(album.id, 'coverPreview', URL.createObjectURL(file));
                                }
                              }} 
                              className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" 
                            />
                            {album.coverPreview && (
                              <div className="mt-2 flex items-center gap-3 p-2 bg-green-900/20 border border-green-500/30 rounded-lg w-fit">
                                <img src={album.coverPreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                                <span className="text-green-400 text-xs font-bold truncate max-w-[150px]">{album.coverFile?.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                            <h4 className="font-bold text-zinc-300">Canciones del Álbum ({album.tracks.length})</h4>
                            <button type="button" onClick={() => addTrackToAlbum(album.id)} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition">+ Agregar Canción</button>
                          </div>
                          <div className="space-y-3">
                            {album.tracks.map((track, trackIndex) => (
                              <div key={track.id} className="bg-zinc-900/50 border border-zinc-700 rounded-lg overflow-hidden">
                                <div className="p-3 flex items-center justify-between bg-zinc-800/50">
                                  <div className="flex items-center gap-3 flex-1">
                                    <button type="button" onClick={() => toggleTrackCollapse(album.id, track.id)} className="text-white hover:scale-110 transition">{track.collapsed ? '▶' : '▼'}</button>
                                    <span className="text-purple-400 font-bold">#{trackIndex + 1}</span>
                                    <span className="text-white text-sm truncate">{track.title || 'Sin título'}</span>
                                  </div>
                                  <button type="button" onClick={() => removeTrackFromAlbum(album.id, track.id)} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg transition">🗑️</button>
                                </div>
                                {!track.collapsed && (
                                  <div className="p-4 space-y-3">
                                    <input type="text" value={track.title} onChange={(e) => updateTrackInAlbum(album.id, track.id, 'title', e.target.value)} placeholder="Título de la canción" className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none" />
                                    <input type="text" value={track.artist} onChange={(e) => updateTrackInAlbum(album.id, track.id, 'artist', e.target.value)} placeholder="Artista / Intérprete" className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none" />
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <input type="text" value={track.composers} onChange={(e) => updateTrackInAlbum(album.id, track.id, 'composers', e.target.value)} placeholder="Compositores" className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none" />
                                      <input type="number" value={track.royaltyPercentage} onChange={(e) => updateTrackInAlbum(album.id, track.id, 'royaltyPercentage', e.target.value)} placeholder="% de Regalías" min="0" max="100" className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none" />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-zinc-500 mb-1">Archivo de Audio (MP3/WAV)</label>
                                      <input type="file" accept="audio/*" onChange={(e) => handleTrackFileInAlbum(album.id, track.id, e)} className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                                      {track.fileName && (
                                        <div className="mt-2 p-2 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center gap-2">
                                          <span className="text-green-400 text-lg">📎</span>
                                          <span className="text-green-400 text-xs font-bold truncate">{track.fileName}</span>
                                          <span className="text-green-500/70 text-[10px] ml-auto">(Listo para subir)</span>
                                        </div>
                                      )}
                                    </div>
                                    <textarea value={track.lyrics} onChange={(e) => updateTrackInAlbum(album.id, track.id, 'lyrics', e.target.value)} rows={2} placeholder="Letra de la canción..." className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none resize-none text-sm" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Sencillos (Canciones Sueltas)</h2>
                  <button type="button" onClick={addSingle} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition">+ Agregar Sencillo</button>
                </div>
                {singles.length === 0 && <p className="text-zinc-500 text-center py-8">No hay sencillos agregados.</p>}
                <div className="space-y-3">
                  {singles.map((single, index) => (
                    <div key={single.id} className="bg-black/50 border border-zinc-800 rounded-lg overflow-hidden">
                      <div className="p-3 flex items-center justify-between bg-zinc-800/50">
                        <div className="flex items-center gap-3 flex-1">
                          <button type="button" onClick={() => toggleSingleCollapse(single.id)} className="text-white hover:scale-110 transition">{single.collapsed ? '▶' : '▼'}</button>
                          <span className="text-purple-400 font-bold">#{index + 1}</span>
                          <span className="text-white text-sm truncate">{single.title || 'Sin título'}</span>
                        </div>
                        <button type="button" onClick={() => removeSingle(single.id)} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg transition">🗑️</button>
                      </div>
                      {!single.collapsed && (
                        <div className="p-4 space-y-3">
                          <input type="text" value={single.title} onChange={(e) => updateSingle(single.id, 'title', e.target.value)} placeholder="Título de la canción" className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                          <input type="text" value={single.artist} onChange={(e) => updateSingle(single.id, 'artist', e.target.value)} placeholder="Artista / Intérprete" className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                          <div className="grid md:grid-cols-2 gap-4">
                            <input type="text" value={single.composers} onChange={(e) => updateSingle(single.id, 'composers', e.target.value)} placeholder="Compositores" className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                            <input type="number" value={single.royaltyPercentage} onChange={(e) => updateSingle(single.id, 'royaltyPercentage', e.target.value)} placeholder="% de Regalías" min="0" max="100" className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Archivo de Audio (MP3/WAV)</label>
                            <input type="file" accept="audio/*" onChange={(e) => handleSingleFile(single.id, e)} className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                            {single.fileName && (
                              <div className="mt-2 p-2 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center gap-2">
                                <span className="text-green-400 text-lg">📎</span>
                                <span className="text-green-400 text-xs font-bold truncate">{single.fileName}</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Portada del Sencillo (Opcional - Tipo Spotify)</label>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleSingleCover(single.id, e)} 
                              className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" 
                            />
                            {single.coverPreview && (
                              <div className="mt-2 flex items-center gap-3 p-2 bg-green-900/20 border border-green-500/30 rounded-lg w-fit">
                                <img src={single.coverPreview} alt="Cover" className="w-12 h-12 object-cover rounded" />
                                <span className="text-green-400 text-xs font-bold truncate max-w-[150px]">{single.coverFile?.name}</span>
                              </div>
                            )}
                          </div>

                          <textarea value={single.lyrics} onChange={(e) => updateSingle(single.id, 'lyrics', e.target.value)} rows={2} placeholder="Letra de la canción..." className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none resize-none text-sm" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <NavigationButtons />
            </div>
          )}

          {activeTab === 'multimedia' && (
            <div className="space-y-6">
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Redes Sociales</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {['instagram', 'tiktok', 'facebook', 'youtube'].map((network) => (
                    <div key={network}>
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">{network}</label>
                      <input type="text" value={social[network as keyof typeof social]} onChange={(e) => setSocial({ ...social, [network]: e.target.value })} className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl text-white focus:border-purple-500 focus:outline-none" placeholder={`https://${network}.com/...`} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Videos de YouTube</h2>
                  <button type="button" onClick={addYoutubeVideo} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition">+ Agregar Video</button>
                </div>
                <div className="space-y-4">
                  {youtubeVideos.map((video) => (
                    <div key={video.id} className="bg-black/50 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-purple-400 font-bold">Video de YouTube</span>
                        <button type="button" onClick={() => removeYoutubeVideo(video.id)} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg transition">🗑️ Eliminar</button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <input type="text" value={video.title} onChange={(e) => updateYoutubeVideo(video.id, 'title', e.target.value)} placeholder="Título del video" className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                        <input type="text" value={video.youtubeId} onChange={(e) => updateYoutubeVideo(video.id, 'youtubeId', e.target.value)} placeholder="ID de YouTube" className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Videos Propios (MP4/MOV)</h2>
                  <button type="button" onClick={addCustomVideo} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition">+ Agregar Video</button>
                </div>
                <div className="space-y-4">
                  {customVideos.map((video) => (
                    <div key={video.id} className="bg-black/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400 font-bold">Video Propio</span>
                        <button type="button" onClick={() => removeCustomVideo(video.id)} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg transition">🗑️ Eliminar</button>
                      </div>
                      <input type="text" value={video.title} onChange={(e) => updateCustomVideo(video.id, 'title', e.target.value)} placeholder="Título del video" className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none" />
                      
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Archivo de Video (MP4/MOV)</label>
                        <input type="file" accept="video/mp4,video/quicktime" onChange={(e) => handleCustomVideoFile(video.id, e)} className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                        {video.fileName && (
                          <div className="mt-2 p-2 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center gap-2">
                            <span className="text-green-400 text-lg">🎬</span>
                            <span className="text-green-400 text-xs font-bold truncate">{video.fileName}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Miniatura del Video (Opcional - Tipo Spotify Canvas)</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleCustomVideoThumbnail(video.id, e)} 
                          className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" 
                        />
                        {video.thumbnailPreview && (
                          <div className="mt-2 flex items-center gap-3 p-2 bg-green-900/20 border border-green-500/30 rounded-lg w-fit">
                            <img src={video.thumbnailPreview} alt="Thumbnail" className="w-20 h-12 object-cover rounded" />
                            <span className="text-green-400 text-xs font-bold truncate max-w-[150px]">{video.thumbnailFile?.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <NavigationButtons />
            </div>
          )}

          {activeTab === 'publicar' && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-3xl font-bold mb-4">¿Todo listo para lanzar?</h2>
              <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Revisa que todos los datos estén correctos. Al hacer clic, se subirán las portadas, audios, videos y miniaturas.</p>
              <div className="flex justify-center mb-8">
                <button type="button" onClick={() => setActiveTab('multimedia')} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition">⬅️ Revisar Multimedia</button>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-black rounded-xl shadow-2xl shadow-purple-500/30 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Subiendo archivos y publicando...' : 'GUARDAR Y PUBLICAR ARTISTA'}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
