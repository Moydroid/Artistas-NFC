"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/artistas', label: 'Artistas', icon: '🎤' },
    { href: '/admin/codigos', label: 'Códigos', icon: '️' },
    { href: '/admin/regalias', label: 'Regalías', icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* SIDEBAR (Escritorio) */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 p-6 fixed h-full z-20">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-600/20">
            F
          </div>
          <h1 className="text-xl font-bold tracking-wider text-purple-400">FONOTAP</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-zinc-800 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
            <span className="text-xl">🌍</span>
            Ver Landing
          </Link>
          <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-zinc-400 hover:text-red-400 hover:bg-red-900/10 transition-all">
            <span className="text-xl">🚪</span>
            Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* MENÚ MÓVIL */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center font-bold text-sm">F</div>
          <h1 className="text-lg font-bold text-purple-400">FONOTAP Admin</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-2xl text-white">
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/95 pt-20 p-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl font-medium text-lg ${
                pathname === item.href ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl font-medium text-lg text-zinc-400 hover:bg-zinc-800"> Ver Landing</Link>
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl font-medium text-lg text-red-400 hover:bg-red-900/10">🚪 Cerrar Sesión</Link>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}