'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NfcPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [artistSlug, setArtistSlug] = useState('');

  useEffect(() => {
    const validateAndRedirect = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        setStatus('error');
        return;
      }

      const cleanCode = code.replace(/\s+/g, '').toUpperCase();

      try {
        // 1. Validar el código
        const { data: codeData, error: codeError } = await supabase
          .from('access_codes')
          .select('*')
          .eq('code', cleanCode)
          .eq('is_active', true)
          .single();

        if (codeError || !codeData) {
          setStatus('error');
          return;
        }

        // 2. Obtener el artista
        const { data: artistData } = await supabase
          .from('artists')
          .select('slug')
          .eq('id', codeData.artist_id)
          .single();

        if (artistData) {
          // 3. Guardar el pase VIP
          localStorage.setItem('vip_access', 'true');
          setArtistSlug(artistData.slug);
          setStatus('success');
          
          // 4. Redirigir automáticamente después de 1 segundo
          setTimeout(() => {
            router.push(`/artistas/${artistData.slug}`);
          }, 1000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Error al validar:', err);
        setStatus('error');
      }
    };

    validateAndRedirect();
  }, [router]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔓</div>
          <h1 className="text-2xl font-bold">Validando tu tarjeta...</h1>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <h1 className="text-2xl font-bold text-green-400">¡Acceso concedido!</h1>
          <p className="text-zinc-400 mt-2">Redirigiendo a la música...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-400">Código inválido</h1>
        <p className="text-zinc-400 mt-2">Este código no es válido o ya fue usado.</p>
      </div>
    </main>
  );
}