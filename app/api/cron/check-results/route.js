import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'Cron job active',
    message: 'Maç kontrol sistemi yakında eklenecek'
  });
}
