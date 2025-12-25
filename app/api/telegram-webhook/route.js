import { Telegraf } from 'telegraf';
import { createWorker } from 'tesseract.js';
import { sql } from '@vercel/postgres';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Fotoğraf kontrolü
    if (body.message?.photo) {
      const photo = body.message.photo[body.message.photo.length - 1];
      const fileId = photo.file_id;
      
      // Telegram'dan fotoğrafı indir
      const fileLink = await bot.telegram.getFileLink(fileId);
      
      // OCR ile metni çıkar
      const worker = await createWorker('tur');
      const { data: { text } } = await worker.recognize(fileLink.href);
      await worker.terminate();
      
      // Kupon bilgilerini parse et
      const couponData = parseCouponText(text);
      
      if (couponData) {
        // Veritabanına kaydet
        const result = await sql`
          INSERT INTO coupons (telegram_message_id, coupon_code, total_stake, total_odds, potential_win)
          VALUES (${body.message.message_id}, ${couponData.code}, ${couponData.stake}, ${couponData.odds}, ${couponData.potentialWin})
          RETURNING id
        `;
        
        const couponId = result.rows[0].id;
        
        // Maçları kaydet
        for (const match of couponData.matches) {
          await sql`
            INSERT INTO matches (coupon_id, home_team, away_team, prediction, odds, match_date)
            VALUES (${couponId}, ${match.homeTeam}, ${match.awayTeam}, ${match.prediction}, ${match.odds}, ${match.date})
          `;
        }
        
        await bot.telegram.sendMessage(
          body.message.chat.id,
          `✅ Kupon kaydedildi!\n💰 Yatırım: ${couponData.stake} TL\n📊 Oran: ${couponData.odds}\n🎯 Kazanç: ${couponData.potentialWin} TL`
        );
      }
    }
    
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function parseCouponText(text) {
  try {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Kupon kodu
    const codeMatch = text.match(/(?:Kupon|Kod|Code)[:.\s]*([A-Z0-9]{6,})/i);
    const code = codeMatch ? codeMatch[1] : `AUTO${Date.now()}`;
    
    // Toplam oran
    const oddsMatch = text.match(/(?:Toplam|Total)?\s*Oran[:.\s]*([\d.,]+)/i);
    const odds = oddsMatch ? parseFloat(oddsMatch[1].replace(',', '.')) : 0;
    
    // Yatırım
    const stakeMatch = text.match(/(?:Yatırım|Tutar)[:.\s]*([\d.,]+)/i);
    const stake = stakeMatch ? parseFloat(stakeMatch[1].replace(',', '.')) : 0;
    
    const potentialWin = stake * odds;
    
    // Maçları parse et
    const matches = [];
    const matchPattern = /([\w\s]+)\s*-\s*([\w\s]+).*?(MS|KG|Alt|Üst|İY).*?([\d.,]+)/gi;
    let matchResult;
    
    while ((matchResult = matchPattern.exec(text)) !== null) {
      matches.push({
        homeTeam: matchResult[1].trim(),
        awayTeam: matchResult[2].trim(),
        prediction: matchResult[3],
        odds: parseFloat(matchResult[4].replace(',', '.')),
        date: new Date()
      });
    }
    
    return { code, stake, odds, potentialWin, matches };
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}
