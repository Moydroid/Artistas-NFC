"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ artists: 0, tracks: 0, codes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: artistsCount } = await supabase.from('artists').select('*', { count: 'exact', head: true }).eq('is_active', true);
      const { count: tracksCount } = await supabase.from('tracks').select('*', { count: 'exact', head: true });
      const { count: codesCount } = await supabase.from('access_codes').select('*', { count: 'exact', head: true }).eq('is_used', false);

      setStats({
        artists: artistsCount || 0,
        tracks: tracksCount || 0,
        codes: codesCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Centro de Mando 🎛️</h1>
        <p className="text-zinc-400">Bienvenido de nuevo. Aquí tienes el resumen de tu imperio.</p>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500">Cargando estadísticas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta Artistas */}
          <Link href="/admin/artistas" className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-purple-500/50 transition-all group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🎤
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">ACTIVOS</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{stats.artists}</h3>
            <p className="text-zinc-400 text-sm">Artistas Publicados</p>
          </Link>

          {/* Tarjeta Canciones */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-pink-600/20 rounded-xl flex items-center justify-center text-2xl">
                🎵
              </div>
              <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">TOTAL</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{stats.tracks}</h3>
            <p className="text-zinc-400 text-sm">Canciones en Plataforma</p>
          </div>

          {/* Tarjeta Códigos */}
          <Link href="/admin/codigos" className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-green-500/50 transition-all group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🎟️
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">DISPONIBLES</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{stats.codes}</h3>
            <p className="text-zinc-400 text-sm">Códigos por Vender</p>
          </Link>
        </div>
      )}

      {/* ACCESOS RÁPIDOS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/artistas" className="bg-gradient-to-r from-purple-900/40 to-zinc-900 border border-purple-500/20 p-6 rounded-2xl flex items-center gap-4 hover:border-purple-500/50 transition-all group">
            <span className="text-3xl group-hover:scale-110 transition-transform">✨</span>
            <div>
              <h3 className="font-bold text-white text-lg">Publicar Nuevo Artista</h3>
              <p className="text-sm text-zinc-400">Sube música, portadas y configura perfiles.</p>
            </div>
          </Link>
          
          <Link href="/admin/codigos" className="bg-gradient-to-r from-green-900/40 to-zinc-900 border border-green-500/20 p-6 rounded-2xl flex items-center gap-4 hover:border-green-500/50 transition-all group">
            <span className="text-3xl group-hover:scale-110 transition-transform"></span>
            <div>
              <h3 className="font-bold text-white text-lg">Generar Códigos NFC</h3>
              <p className="text-sm text-zinc-400">Crea llaves de acceso y descarga los QRs.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}