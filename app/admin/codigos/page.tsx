"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function AdminCodigos() {
  const router = useRouter();
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    const { data } = await supabase.from('artists').select('id, name, slug').order('name');
    if (data) setArtists(data as any[]);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
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

      const newCodes: any[] = [];
      const codesToInsert: any[] = [];

      for (let i = 0; i < quantity; i++) {
        const code = `FONO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const access_url = `/acceso/${artist.slug}`;
        const full_url = `https://fonotap.vercel.app${access_url}`;
        
        newCodes.push({ code, artist_id: selectedArtistId, access_url, full_url, is_used: false });
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
      csvContent += `${row.code},${row.full_url},Disponible\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `codigos_${artist.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPNG = async (code: any) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 500;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#9333EA';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      ctx.fillStyle = '#9333EA';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FONOTAP', canvas.width / 2, 50);

      const qrDataUrl = await QRCode.toDataURL(code.full_url, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });

      const qrX = (canvas.width - 250) / 2;
      const qrY = 80;
      ctx.drawImage(qrImg, qrX, qrY, 250, 250);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(code.code, canvas.width / 2, 380);

      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.fillText('Escanea el QR o ingresa el código', canvas.width / 2, 420);
      ctx.fillText('en fonotap.vercel.app', canvas.width / 2, 445);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${code.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar PNG:', error);
      alert('❌ Error al generar la imagen');
    }
  };

  const downloadAllPNGs = async () => {
    if (codes.length === 0) return;
    
    setStatus('📦 Generando todas las imágenes...');
    
    for (let i = 0; i < codes.length; i++) {
      await downloadPNG(codes[i]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setStatus(`✅ ${codes.length} imágenes descargadas.`);
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
            {loading ? '🚀 Generando...' : '🚀 GENERAR CÓDIGOS'}
          </button>

          {status && <p className={`text-center font-bold ${status.includes('✅') ? 'text-green-400' : status.includes('❌') ? 'text-red-400' : 'text-white'}`}>{status}</p>}

          {codes.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex gap-4">
                <button onClick={downloadCSV} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold">
                  ⬇️ Descargar CSV
                </button>
                <button onClick={downloadAllPNGs} className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold">
                  📦 Descargar Todas las Imágenes
                </button>
              </div>

              <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 max-h-96 overflow-y-auto space-y-3">
                {codes.map((item: any, i: number) => (
                  <div key={i} className="bg-zinc-900 p-4 rounded-lg border border-zinc-700">
                    {/* CÓDIGO ALFANUMÉRICO CON BOTÓN DE COPIAR */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 bg-zinc-800 border border-purple-500/30 rounded-lg px-4 py-3 font-mono text-purple-400 text-lg font-bold">
                        {item.code}
                      </div>
                      <button 
                        onClick={() => copyCode(item.code)}
                        className={`${copiedCode === item.code ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'} px-4 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap`}
                      >
                        {copiedCode === item.code ? '✅ Copiado' : '📋 Copiar'}
                      </button>
                      <button 
                        onClick={() => downloadPNG(item)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-bold text-sm whitespace-nowrap"
                      >
                        📥 PNG
                      </button>
                    </div>

                    {/* ENLACE PARA NFC */}
                    <div className="bg-zinc-800/50 rounded p-3 border border-zinc-700">
                      <p className="text-xs text-zinc-400 mb-1 font-bold">📱 Enlace para programar NFC:</p>
                      <p className="text-green-400 font-mono text-sm break-all">{item.full_url}</p>
                    </div>
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