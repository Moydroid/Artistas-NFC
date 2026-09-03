'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import JSZip from 'jszip';
import QRCode from 'qrcode';

export default function GenerarCodigosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [quantity, setQuantity] = useState(10);
  
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  // Login simple
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') setIsAuthenticated(true);
    else alert('Contraseña incorrecta');
  };

  // Cargar artistas al entrar
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchArtists = async () => {
      const { data } = await supabase.from('artists').select('id, name, slug').order('name');
      if (data) setArtists(data);
    };
    fetchArtists();
  }, [isAuthenticated]);

  // Función para llamar al motor de generación
  const handleGenerate = async () => {
    if (!selectedArtistId) {
      setMessage('❌ Selecciona un artista primero.');
      return;
    }
    if (quantity < 1 || quantity > 10000) {
      setMessage('❌ La cantidad debe ser entre 1 y 10,000.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setGeneratedCodes([]);

    try {
      const res = await fetch('/api/generate-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: selectedArtistId, quantity })
      });
      const data = await res.json();

      if (data.success) {
        setGeneratedCodes(data.codes);
        setMessage(`✅ ¡Éxito! Se generaron ${data.codes.length} códigos nuevos.`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Descargar CSV para NFC Tools
  const downloadCSV = () => {
    if (generatedCodes.length === 0) return;
    
    // Obtener el slug del artista para construir la URL
    const artist = artists.find(a => a.id === selectedArtistId);
    const baseUrl = window.location.origin;
    
    // Formato CSV: Código, URL
    let csvContent = "data:text/csv;charset=utf-8,Código,URL\n";
    generatedCodes.forEach(code => {
      csvContent += `${code},${baseUrl}/nfc?code=${code}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `codigos_nfc_${artist?.slug || 'artista'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Descargar ZIP con PNGs para Photoshop
  const downloadZIP = async () => {
    if (generatedCodes.length === 0) return;
    
    setIsLoading(true);
    setMessage(' Generando ZIP con los QRs (esto puede tardar unos segundos)...');

    try {
      const zip = new JSZip();
      const artist = artists.find(a => a.id === selectedArtistId);
      const folderName = `QRs_${artist?.slug || 'artista'}`;
      const imgFolder = zip.folder(folderName);

      // Generar QRs en paralelo para no congelar la UI
      const qrPromises = generatedCodes.map(async (code, index) => {
        // Generar imagen PNG en base64
        const dataUrl = await QRCode.toDataURL(code, { 
          width: 500, 
          margin: 1, 
          color: { dark: '#000000', light: '#ffffff' } 
        });
        
        // Convertir base64 a buffer para JSZip
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const fileName = `${artist?.slug || 'code'}_${String(index + 1).padStart(4, '0')}.png`;
        imgFolder?.file(fileName, base64Data, { base64: true });
      });

      await Promise.all(qrPromises);

      // Generar el archivo ZIP y descargarlo
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage('✅ ZIP descargado correctamente.');
    } catch (error) {
      console.error(error);
      setMessage('❌ Error al generar el ZIP.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🏭</div>
            <h1 className="text-2xl font-bold text-white">Fábrica de Códigos</h1>
            <p className="text-zinc-400 text-sm mt-2">Acceso restringido</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500" />
            <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition">Entrar</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <nav className="fixed top-0 w-full z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="text-zinc-400 hover:text-white transition font-bold">⬅️ Volver al Admin</Link>
          <h1 className="font-bold text-lg">🏭 Fábrica de Códigos NFC/QR</h1>
          <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-zinc-800 text-zinc-400 text-sm font-bold rounded-lg hover:bg-zinc-700 transition">Salir</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-24 space-y-8">
        
        {/* PANEL DE GENERACIÓN */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">⚙️</span> Configurar Lote
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">1. Selecciona el Artista</label>
              <select 
                value={selectedArtistId} 
                onChange={(e) => setSelectedArtistId(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">-- Elige un artista --</option>
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id}>{artist.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">2. Cantidad de Códigos</label>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
                className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
              />
              <p className="text-zinc-500 text-xs mt-1">Máximo 10,000 por lote para evitar bloqueos.</p>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading || !selectedArtistId}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-800 disabled:text-zinc-500 text-white text-lg font-bold rounded-xl shadow-lg transition transform hover:scale-[1.01]"
          >
            {isLoading ? '⏳ Generando en la nube...' : '🚀 GENERAR LOTE DE CÓDIGOS'}
          </button>

          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center font-bold ${message.includes('✅') ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
              {message}
            </div>
          )}
        </section>

        {/* PANEL DE DESCARGA */}
        {generatedCodes.length > 0 && (
          <section className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span className="text-3xl">📥</span> Descarga tu Lote
            </h2>
            <p className="text-zinc-400 mb-6">Se generaron <span className="text-white font-bold">{generatedCodes.length}</span> códigos únicos. Descarga los archivos para tu producción.</p>

            <div className="grid md:grid-cols-2 gap-4">
              <button 
                onClick={downloadCSV}
                className="p-6 bg-black/50 border border-zinc-700 hover:border-blue-500 rounded-xl flex flex-col items-center text-center transition group"
              >
                <span className="text-4xl mb-3 group-hover:scale-110 transition"></span>
                <h3 className="text-xl font-bold text-white mb-1">Descargar CSV</h3>
                <p className="text-zinc-500 text-sm">Para programar chips NFC con la app "NFC Tools".</p>
              </button>

              <button 
                onClick={downloadZIP}
                className="p-6 bg-black/50 border border-zinc-700 hover:border-green-500 rounded-xl flex flex-col items-center text-center transition group"
              >
                <span className="text-4xl mb-3 group-hover:scale-110 transition">🖼️</span>
                <h3 className="text-xl font-bold text-white mb-1">Descargar ZIP (PNGs)</h3>
                <p className="text-zinc-500 text-sm">Imágenes QR listas para pegar en tu diseño de Photoshop.</p>
              </button>
            </div>

            {/* Vista previa de códigos */}
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-500 uppercase mb-3">Vista previa de los códigos generados:</h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-zinc-300 max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-2">
                {generatedCodes.map((code, i) => (
                  <div key={i} className="bg-zinc-900 px-2 py-1 rounded text-center border border-zinc-800">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
