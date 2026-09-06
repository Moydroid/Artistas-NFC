"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminRegalias() {
  const [composers, setComposers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => { fetchRoyalties(); }, []);

  const fetchRoyalties = async () => {
    setLoading(true);
    const { data: tracks } = await supabase.from('tracks').select('id, title, composer_name, artist_id');
    const { data: usedCodes } = await supabase.from('access_codes').select('id, artist_id').eq('is_used', true);

    const royaltyMap: any = {};
    
    tracks?.forEach((track: any) => {
      if (track.composer_name) {
        const key = track.composer_name.toLowerCase();
        if (!royaltyMap[key]) royaltyMap[key] = { name: track.composer_name, tracks: 0, cardsSold: 0, totalOwed: 0 };
        royaltyMap[key].tracks += 1;
      }
    });

    usedCodes?.forEach((code: any) => {
      const track = tracks?.find((t: any) => t.artist_id === code.artist_id);
      if (track?.composer_name) {
        const key = track.composer_name.toLowerCase();
        if (royaltyMap[key]) {
          royaltyMap[key].cardsSold += 1;
          royaltyMap[key].totalOwed = royaltyMap[key].cardsSold * 1; // 1 peso por tarjeta
        }
      }
    });

    setComposers(Object.values(royaltyMap));
    setLoading(false);
  };

  const handleMarkAsPaid = async (composerName: string, amount: number) => {
    if (!confirm(`¿Confirmar pago de $${amount}.00 a ${composerName}?`)) return;
    
    setPaying(composerName);
    try {
      const { error } = await supabase.from('royalty_payments').insert([
        { composer_name: composerName, amount: amount, notes: 'Pago por activación de tarjetas' }
      ]);

      if (error) throw error;

      alert(`✅ Pago de $${amount}.00 registrado exitosamente para ${composerName}`);
      // Opcional: Aquí podrías restar lo pagado del total, pero por ahora lo dejamos simple.
    } catch (error: any) {
      alert('❌ Error al registrar el pago: ' + error.message);
    } finally {
      setPaying(null);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-green-400">💰 Dashboard de Regalías</h1>
        
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-6 flex justify-between items-center">
          <p className="text-zinc-400">Tarjetas Activadas x $1.00 MXN</p>
          <button onClick={fetchRoyalties} disabled={loading} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-bold">
            {loading ? 'Calculando...' : '🔄 Actualizar'}
          </button>
        </div>

        {composers.length === 0 ? (
          <p className="text-center text-zinc-500 py-10">No hay compositores registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-800 text-zinc-400">
                  <th className="p-4 rounded-tl-lg">Compositor</th>
                  <th className="p-4">Canciones</th>
                  <th className="p-4">Tarjetas</th>
                  <th className="p-4 text-right rounded-tr-lg">Total a Pagar</th>
                </tr>
              </thead>
              <tbody>
                {composers.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="p-4 font-bold">{c.name}</td>
                    <td className="p-4">{c.tracks}</td>
                    <td className="p-4 text-green-400 font-bold">{c.cardsSold}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <span className="text-2xl font-bold text-green-400">${c.totalOwed}.00</span>
                        <button 
                          onClick={() => handleMarkAsPaid(c.name, c.totalOwed)}
                          disabled={paying === c.name || c.totalOwed === 0}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 px-4 py-2 rounded text-sm font-bold transition-all"
                        >
                          {paying === c.name ? '💸 Pagando...' : '💸 Pagar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}