'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function BoletosPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [boletoGenerado, setBoletoGenerado] = useState(false);
  const [boletoId, setBoletoId] = useState('');

  const generarBoleto = (e: React.FormEvent) => {
    e.preventDefault();
    // Generar un ID único simulado
    const id = `HB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    setBoletoId(id);
    setBoletoGenerado(true);
  };

  // URL del QR (usando API pública gratuita)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(boletoId)}`;

  // Si ya se generó el boleto, mostrar el TICKET PREMIUM
  if (boletoGenerado) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-purple-950 text-white flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full">
          
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full mb-3 border border-green-500/30">
              ✅ Boleto Confirmado
            </div>
            <h1 className="text-2xl font-bold">¡Tu entrada está lista!</h1>
            <p className="text-zinc-400 text-sm mt-1">Presenta este código QR en la entrada</p>
          </div>

          {/* DISEÑO DEL TICKET PREMIUM */}
          <div className="bg-white text-black rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Parte Superior (Header del evento) */}
            <div className="bg-gradient-to-r from-purple-700 to-pink-600 p-6 text-white relative">
              <div className="absolute top-2 right-3 text-[10px] font-bold tracking-widest opacity-70">ADMIT ONE</div>
              <p className="text-xs font-bold tracking-widest uppercase opacity-80 mb-1">Tour Exclusivo 2026</p>
              <h2 className="text-2xl font-black leading-tight">HERENCIA GONZÁLEZ BS.</h2>
              <p className="text-sm mt-1 opacity-90">En concierto</p>
            </div>

            {/* Parte Media (Detalles - Separada por borde rasgado) */}
            <div className="p-6 relative">
              {/* Efecto de borde rasgado (círculos a los lados) */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-900 rounded-full"></div>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-900 rounded-full"></div>
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-gray-300"></div>

              <div className="grid grid-cols-2 gap-4 pt-2 pb-2">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Fecha</p>
                  <p className="font-bold text-sm">15 NOV 2026</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Puertas</p>
                  <p className="font-bold text-sm">8:00 PM</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Lugar</p>
                  <p className="font-bold text-sm">Foro Sol, CDMX</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Sección</p>
                  <p className="font-bold text-sm">VIP - A1</p>
                </div>
              </div>
            </div>

            {/* Parte Inferior (QR y Datos del Fan) */}
            <div className="bg-gray-50 p-6 flex flex-col items-center border-t border-gray-200">
              <div className="bg-white p-2 rounded-xl shadow-inner border border-gray-200 mb-4">
                <img 
                  src={qrUrl} 
                  alt="QR del boleto" 
                  className="w-40 h-40"
                />
              </div>
              
              <div className="w-full space-y-2 text-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Asistente</p>
                  <p className="font-bold text-sm truncate">{nombre}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Folio</p>
                  <p className="font-mono text-xs text-purple-700 font-bold">{boletoId}</p>
                </div>
              </div>
            </div>
          </div>
          {/* FIN DEL TICKET */}

          {/* Botones de acción */}
          <div className="mt-8 space-y-3">
            <button 
              onClick={() => window.print()}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <span>🖨️</span> Imprimir / Guardar PDF
            </button>
            <button 
              onClick={() => setBoletoGenerado(false)}
              className="w-full py-3 bg-transparent border border-zinc-700 text-zinc-400 font-bold rounded-xl hover:bg-zinc-800 hover:text-white transition text-sm"
            >
              Generar otro boleto
            </button>
          </div>

          <a 
            href={`/artistas/${slug}`}
            className="block text-center mt-6 text-zinc-500 hover:text-purple-400 text-sm transition"
          >
            ← Volver al perfil del artista
          </a>
        </div>
      </main>
    );
  }

  // Si NO se ha generado, mostrar el FORMULARIO
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-purple-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full mb-4 border border-purple-500/30">
            ️ ENTRADA DIGITAL
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Genera tu Boleto
          </h1>
          <p className="text-zinc-400 text-sm">Completa tus datos para obtener tu entrada VIP</p>
        </div>

        <form onSubmit={generarBoleto} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              placeholder="tu@email.com"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition shadow-lg shadow-purple-500/20 mt-2"
          >
            Generar mi Boleto con QR
          </button>
        </form>

        <a 
          href={`/artistas/${slug}`}
          className="block text-center mt-6 text-zinc-500 hover:text-white text-sm transition"
        >
          ← Volver al perfil del artista
        </a>
      </div>
    </main>
  );
}