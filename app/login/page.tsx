'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales incorrectas. Intenta de nuevo.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full mb-4 border border-purple-500/30">
            ACCESO RESTRINGIDO
          </div>
          <h1 className="text-3xl font-bold text-white">Iniciar Sesión</h1>
          <p className="text-zinc-400 text-sm mt-2">Panel de Administración NFC</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none transition" 
              placeholder="admin@digitalia.com" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none transition" 
              placeholder="••••••••" 
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg transition shadow-lg disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar al Panel'}
          </button>
        </form>
      </div>
    </main>
  );
}
