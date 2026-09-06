"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';
import JSZip from 'jszip';

export default function AdminCodigos() {
  const [artists, setArtists] = useState([]);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState([]);

  useEffect(() => { fetchArtists(); }, []);

  const fetchArtists = async () => {
    const { data } = await supabase.from('artists').select('id, name, slug').order('name');
    if (data) setArtists(data);
  };

  const generateUniqueCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'FONO-';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  const handleGenerate = async () => {
    if (!selectedArtistId) { alert('Selecciona un artista'); return; }
    setLoading(true);
    setStatus('⏳ Generando códigos y QRs...');
    setGeneratedCodes([]);

    try {
      const newCodes = [];
      const csvRows = ['Código,Artista,Slug,URL'];
      const artist = artists.find(a => a.id === selectedArtistId);
      const baseUrl = window.location.origin;
      const zip = new JSZip();

      for (let i = 0; i < quantity; i++) {
        const code = generateUniqueCode();
        const accessUrl = `${baseUrl}/acceso/${artist.slug}/${code}`;
        
        // Generar imagen QR
        const qrDataUrl = await QRCode.toDataURL(accessUrl, { 
          width: 500, 
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        
        // Convertir a base64 para el ZIP
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        zip.file(`${code}.png`, base64Data, { base64: true });

        csvRows.push(`${code},${artist.name},${artist.slug},${accessUrl}`);
        newCodes.push({ code, artist_id: selectedArtistId, access_url: accessUrl, is_used: false });
      }

      setStatus('💾 Guardando en base de datos...');
      const { error } = await supabase.from('access_codes').insert(newCodes);
      if (error) throw error;

      // Descargar CSV
      const csvContent = csvRows.join('\n');
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const csvLink = document.createElement('a');
      csvLink.href = URL.createObjectURL(csvBlob);
      csvLink.download = `codigos-${artist.slug}.csv`;
      csvLink.click();

      // Descargar ZIP con los QR
      setStatus('📦 Comprimiendo QRs en ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipLink = document.createElement('a');
      zipLink.href = URL.createObjectURL(zipBlob);
      zipLink.download = `codigos-qr-${artist.slug}.zip`;
      zipLink.click();

      setGeneratedCodes(newCodes);
      setStatus(` ¡Éxito! ${quantity} códigos generados, guardados, CSV y ZIP descargados.`);
      
    } catch (error) {
      console.error('Error:', error);
      setStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-400">📱 Generador Masivo NFC/QR</h1>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-6">
          <div>
            <label className="block text-sm mb-2">1. Selecciona el Artista</label>
            <select value={selectedArtistId} onChange={e => setSelectedArtistId(e.target.value)} 
              className="w-full p-3 bg-zinc-800 rounded border border-zinc-700">
              <option value="">-- Selecciona --</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name} (/{a.slug})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">2. Cantidad (1 a 1000)</label>
            <input type="number" min="1" max="1000" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} 
              className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 text-xl font-bold" />
          </div>

          <button onClick={handleGenerate} disabled={loading || !selectedArtistId} 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-700 py-4 rounded font-bold text-lg">
            {loading ? '⏳ PROCESANDO...' : '🚀 GENERAR TODO (CSV + ZIP CON QR)'}
          </button>
        </div>

        {status && <div className="mt-6 p-4 bg-zinc-800 rounded border border-zinc-700 text-center font-bold">{status}</div>}

        {generatedCodes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Últimos generados ({generatedCodes.length})</h2>
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden max-h-60 overflow-y-auto">
              {generatedCodes.map((c, i) => (
                <div key={i} className="p-3 border-b border-zinc-800 flex justify-between text-sm font-mono">
                  <span className="text-green-400">{c.code}</span>
                  <span className="text-zinc-500 truncate ml-4">{c.access_url}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}