export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabase';

import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// ConfiguraciÃ³n de Supabase para el servidor


// FunciÃ³n para generar un cÃ³digo aleatorio formato XXXX-XXXX-XXXX
const generateRandomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (i < 2) code += '-';
  }
  return code;
};

export async function POST(request: Request) {
  try {
    const { artistId, quantity } = await request.json();

    if (!artistId || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Datos invÃ¡lidos' }, { status: 400 });
    }

    // LÃ­mite de seguridad por peticiÃ³n para no colgar el servidor
    const MAX_BATCH = 1000; 
    const safeQuantity = Math.min(quantity, MAX_BATCH);

    const generatedCodes = [];
    let attempts = 0;
    const maxAttempts = safeQuantity * 3; // Intentos mÃ¡ximos para evitar bucles infinitos

    while (generatedCodes.length < safeQuantity && attempts < maxAttempts) {
      const newCode = generateRandomCode();
      
      // Verificar que el cÃ³digo no exista ya en la base de datos
      const { data: existingCode } = await supabase
        .from('access_codes')
        .select('id')
        .eq('code', newCode)
        .single();

      if (!existingCode) {
        // Si no existe, lo insertamos
        const { error } = await supabase
          .from('access_codes')
          .insert({
            code: newCode,
            artist_id: artistId,
            is_active: true
          });

        if (!error) {
          generatedCodes.push(newCode);
        }
      }
      attempts++;
    }

    if (generatedCodes.length < safeQuantity) {
      return NextResponse.json({ 
        error: 'No se pudieron generar todos los cÃ³digos. Intenta de nuevo.', 
        generated: generatedCodes.length 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      codes: generatedCodes,
      message: `Se generaron ${generatedCodes.length} cÃ³digos exitosamente.` 
    });

  } catch (error) {
    console.error('Error en generate-codes API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
