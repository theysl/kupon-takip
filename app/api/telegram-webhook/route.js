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
      const caption = message.caption || '';
      
      // Caption'dan bilgileri parse et
      const parsedData = parseCouponCaption(caption);
      
      const couponCode = `KUPON${Date.now()}`;
      const stake = parsedData.maxBet || 100; // Default 100 TL
      const odds = parsedData.totalOdds || 2.5; // Default 2.5
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
            text: `✅ Kupon kaydedildi!\n\n🎫 Kod: ${couponCode}\n💰 Yatırım: ${stake} TL\n📊 Oran: ${odds}\n🎯 Olası Kazanç: ${potentialWin.toFixed(2)} TL\n\n📱 Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}`,
            parse_mode: 'HTML'
          })
        });
      }
      
      console.log(`✅ Kupon kaydedildi: ${couponCode} - ${stake}TL x ${odds} = ${potentialWin}TL`);
      return NextResponse.json({ ok: true, saved: couponCode });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Caption parser fonksiyonu
function parseCouponCaption(caption) {
  const result = {
    totalOdds: null,
    maxBet: null,
    matches: []
  };
  
  if (!caption) return result;
  
  // Oran tespiti (örnek: "13 Oran", "🔼 11 Oran")
  const oddsMatch = caption.match(/(\d+(?:\.\d+)?)\s*Oran/i);
  if (oddsMatch) {
    result.totalOdds = parseFloat(oddsMatch[1]);
  }
  
  // Max bahis tespiti (örnek: "Max 100₺", "💵 Max 400₺", "MAX BAHİS:400₺")
  const maxBetMatch = caption.match(/Max\s*(?:Bahis|Bet)?[:\s]*(\d+)/i);
  if (maxBetMatch) {
    result.maxBet = parseInt(maxBetMatch[1]);
  }
  
  // Alternatif max bahis formatları
  if (!result.maxBet) {
    const altMaxMatch = caption.match(/(\d+)₺/);
    if (altMaxMatch) {
      result.maxBet = parseInt(altMaxMatch[1]);
    }
  }
  
  return result;
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Telegram webhook active',
    time: new Date().toISOString()
  });
}
