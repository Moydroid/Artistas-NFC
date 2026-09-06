"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminCodigos() {
  const router = useRouter();
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    const { data } = await supabase.from('artists').select('id, name, slug').order('name');
    if (data) setArtists(data);
  };

  const generateCodes = async () => {
    if (!selectedArtistId) {
      alert('⚠️ Selecciona un artista primero.');
      return;
    }
    if (quantity < 1 || quantity > 1000) {
      alert('⚠️ La cantidad debe ser entre 1 y 1000.');
      return;
    }

    setLoading(true);
    setStatus('🚀 Generando códigos...');
    setCodes([]);

    try {
      const artist = artists.find((a: any) => a.id === selectedArtistId);
      if (!artist) throw new Error('Artista no encontrado');

      const newCodes = [];
      const codesToInsert = [];

      for (let i = 0; i < quantity; i++) {
        const code = `FONO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const access_url = `/acceso/${artist.slug}`;
        
        newCodes.push({ code, artist_id: selectedArtistId, access_url, is_used: false });
        codesToInsert.push({ code, artist_id: selectedArtistId, access_url, is_used: false });
      }

      const { error } = await supabase.from('access_codes').insert(codesToInsert);
      if (error) throw error;

      setCodes(newCodes);
      setStatus(`✅ ${quantity} códigos generados exitosamente.`);
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (codes.length === 0) return;
    const artist = artists.find((a: any) => a.id === selectedArtistId);
    if (!artist) return;

    let csvContent = "data:text/csv;charset=utf-8,Código,URL de Acceso,Estado\n";
    codes.forEach((row: any) => {
      csvContent += `${row.code},https://fonotap.vercel.app${row.access_url},Disponible\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `codigos_${artist.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-purple-400">🎟️ Generador de Códigos</h1>
          <button onClick={() => router.push('/admin/artistas')} className="text-sm text-zinc-400 hover:text-white">← Volver a Artistas</button>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">1. Selecciona el Artista</label>
            <select 
              value={selectedArtistId} 
              onChange={e => setSelectedArtistId(e.target.value)}
              className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 text-white"
            >
              <option value="">-- Elige un artista --</option>
              {artists.map((artist: any) => (
                <option key={artist.id} value={artist.id}>{artist.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">2. Cantidad de Códigos</label>
            <input 
              type="number" 
              min="1" 
              max="1000" 
              value={quantity} 
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 text-white"
            />
          </div>

          <button 
            onClick={generateCodes} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 py-4 rounded-xl font-bold text-lg transition-all"
          >
            {loading ? '🚀 Generando...' : ' GENERAR CÓDIGOS'}
          </button>

          {status && <p className={`text-center font-bold ${status.includes('✅') ? 'text-green-400' : status.includes('') ? 'text-red-400' : 'text-white'}`}>{status}</p>}

          {codes.length > 0 && (
            <div className="mt-6">
              <button onClick={downloadCSV} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold mb-4">
                ⬇️ Descargar CSV
              </button>
              <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 max-h-60 overflow-y-auto">
                {codes.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between py-2 border-b border-zinc-800 last:border-0 text-sm">
                    <span className="font-mono text-purple-400">{item.code}</span>
                    <span className="text-zinc-500 text-xs truncate ml-4">{item.access_url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}