export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">Panel de Administración</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/artists" className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-purple-500">
            <h2 className="text-2xl font-bold mb-2">Gestionar Artistas</h2>
            <p className="text-zinc-400">Editar perfiles, portadas y bios.</p>
          </Link>
          <Link href="/admin/codes" className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-purple-500">
            <h2 className="text-2xl font-bold mb-2">Códigos NFC</h2>
            <p className="text-zinc-400">Generar y asignar códigos QR/NFC.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
