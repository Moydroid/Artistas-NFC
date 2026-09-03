export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { artist_id, card_count = 1 } = body;

    if (!artist_id) {
      return NextResponse.json({ error: 'Se requiere artist_id' }, { status: 400 });
    }

    const codes = [];
    for (let i = 0; i < card_count; i++) {
      const code = `NFC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('nfc_codes')
        .insert({
          code: code,
          artist_id: artist_id,
          is_used: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error al generar código:', error);
        return NextResponse.json({ error: 'Error al generar código NFC' }, { status: 500 });
      }
      codes.push(data);
    }

    return NextResponse.json({ codes }, { status: 201 });
  } catch (error) {
    console.error('Error en generate-codes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}