export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export default async function TestDB() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl || '', supabaseKey || '');

  const { data: artists, error: artistsError } = await supabase.from('artists').select('*').limit(3);
  const { data: tracks, error: tracksError } = await supabase.from('tracks').select('*').limit(3);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-green-400">🔍 Test de Conexión a Supabase</h1>

      <div className="space-y-6 max-w-4xl">
        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">1. Variables de Entorno:</h2>
          <p className="text-zinc-400 break-all">URL: {supabaseUrl || 'NO ENCONTRADA'}</p>
          <p className="text-zinc-400">Key: {supabaseKey ? 'SÍ EXISTE' : 'NO ENCONTRADA'}</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2 text-purple-400">2. Tabla artists:</h2>
          {artistsError ? (
            <p className="text-red-400">Error: {artistsError.message}</p>
          ) : (
            <pre className="text-sm text-green-400 overflow-auto">{JSON.stringify(artists, null, 2)}</pre>
          )}
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2 text-purple-400">3. Tabla tracks:</h2>
          {tracksError ? (
            <p className="text-red-400">Error: {tracksError.message}</p>
          ) : (
            <pre className="text-sm text-green-400 overflow-auto">{JSON.stringify(tracks, null, 2)}</pre>
          )}
        </div>
      </div>
    </main>
  );
}