import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Telegram webhook:', body);
    
    if (body.message?.photo) {
      const chatId = body.message.chat.id;
      const couponCode = `KUPON${Date.now()}`;
      
      // Test verisi kaydet
      await sql`
        INSERT INTO coupons (
          telegram_message_id, 
          coupon_code, 
          total_stake, 
          total_odds, 
          potential_win,
          status
        ) VALUES (
          ${body.message.message_id},
          ${couponCode},
          100,
          2.5,
          250,
          'pending'
        )
      `;
      
      // İstatistikleri güncelle
      await sql`
        UPDATE stats SET 
          total_coupons = total_coupons + 1,
          pending_coupons = pending_coupons + 1,
          total_invested = total_invested + 100,
          updated_at = NOW()
        WHERE id = 1
      `;
      
      // Telegram'a yanıt
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Kupon kaydedildi!\n\n🎫 Kod: ${couponCode}\n💰 Yatırım: 100 TL\n📊 Oran: 2.5\n🎯 Olası Kazanç: 250 TL\n\nDashboard: ${process.env.NEXT_PUBLIC_APP_URL}`
        })
      });
      
      return NextResponse.json({ ok: true });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Telegram webhook active',
    time: new Date().toISOString()
  });
}
