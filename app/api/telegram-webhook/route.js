import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Telegram webhook:', body);
    
    // Hem direkt mesajları hem kanal mesajlarını dinle
    const message = body.message || body.channel_post;
    
    if (!message) {
      return NextResponse.json({ ok: true });
    }
    
    // Sadece fotoğraf varsa işle
    if (message.photo) {
      const chatId = message.chat.id;
      const couponCode = `KUPON${Date.now()}`;
      
      // Kupon bilgilerini parse et (şimdilik sabit değerler)
      const stake = 100;
      const odds = 2.5;
      const potentialWin = stake * odds;
      
      // Veritabanına kaydet
      await sql`
        INSERT INTO coupons (
          telegram_message_id, 
          coupon_code, 
          total_stake, 
          total_odds, 
          potential_win,
          status
        ) VALUES (
          ${message.message_id},
          ${couponCode},
          ${stake},
          ${odds},
          ${potentialWin},
          'pending'
        )
      `;
      
      // İstatistikleri güncelle
      await sql`
        UPDATE stats SET 
          total_coupons = total_coupons + 1,
          pending_coupons = pending_coupons + 1,
          total_invested = total_invested + ${stake},
          updated_at = NOW()
        WHERE id = 1
      `;
      
      // Yanıt gönder (sadece direkt mesajlara)
      if (body.message) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ Kupon kaydedildi!\n\n🎫 Kod: ${couponCode}\n💰 Yatırım: ${stake} TL\n📊 Oran: ${odds}\n🎯 Olası Kazanç: ${potentialWin} TL\n\nDashboard: ${process.env.NEXT_PUBLIC_APP_URL}`,
            parse_mode: 'HTML'
          })
        });
      }
      
      return NextResponse.json({ ok: true, saved: couponCode });
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
