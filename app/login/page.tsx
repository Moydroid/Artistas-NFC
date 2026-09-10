"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Redirigir directamente al admin al iniciar sesión correctamente
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/logo.png" alt="FONOTAP" className="w-24 h-24 mx-auto object-contain" />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Centro de Mando</h1>
          <p className="text-zinc-400">Acceso exclusivo para administradores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-purple-400 mb-2">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fonotap.com"
              className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-purple-400 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-600/20"
          >
            {loading ? 'Entrando...' : '🔓 Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:text-purple-400 transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}