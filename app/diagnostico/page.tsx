export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';

export default async function DiagnosticoPage() {
  // Obtener TODOS los campos de un artista de prueba
  const { data: artists } = await supabase.from('artists').select('*').limit(1);
  
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-green-400">🔍 Diagnóstico de Columnas</h1>
      
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Campos reales en la tabla artists:</h2>
        <pre className="text-sm text-green-400 overflow-auto bg-black p-4 rounded">
          {JSON.stringify(artists, null, 2)}
        </pre>
      </div>
      
      <div className="bg-zinc-900 p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Instrucciones:</h2>
        <p className="text-zinc-300 mb-2">1. Mira el cuadro de arriba y busca los nombres de las columnas.</p>
        <p className="text-zinc-300 mb-2">2. ¿La columna del slug se llama <strong>slug</strong> o <strong>babosa</strong>?</p>
        <p className="text-zinc-300 mb-2">3. ¿La columna del nombre se llama <strong>name</strong> o <strong>nombre</strong>?</p>
        <p className="text-zinc-300">4. Mándame una captura de pantalla de ese cuadro verde.</p>
      </div>
    </main>
  );
}
