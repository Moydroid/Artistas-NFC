import { NextRequest, NextResponse } from 'next/server';

// Lista de tokens válidos (Para el piloto, los ponemos aquí. Luego vendrán de una base de datos)
const VALID_TOKENS = [
  'CHIP-VIP-001',
  'CHIP-VIP-002',
  'HERENCIA-2026-PRO'
];

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (token && VALID_TOKENS.includes(token)) {
    return NextResponse.json({ valid: true, message: 'Acceso VIP concedido' });
  }

  return NextResponse.json({ valid: false, message: 'Token no válido' }, { status: 403 });
}
