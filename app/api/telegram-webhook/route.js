import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Telegram webhook:', body);
    
    const message = body.message || body.channel_post;
    
    if (!message) {
      return NextResponse.json({ ok: true });
    }
    
    if (message.photo) {
      const chatId = message.chat.id;
      const caption = message.caption || '';
      
      // En yüksek çözünürlüklü fotoğrafı al
      const photo = message.photo[message.photo.length - 1];
      const fileId = photo.file_id;
      
      // Telegram'dan fotoğraf URL'ini al
      const photoUrl = await getTelegramPhotoUrl(fileId);
      
      // OCR ile fotoğrafı oku
      const ocrText = await performOCR(photoUrl);
      console.log('OCR Result:', ocrText);
      
      // Bilgileri parse et
      const parsedData = parseOCRText(ocrText, caption);
      
      const couponCode = `KUPON${Date.now()}`;
      const stake = parsedData.maxBet || 100;
      const odds = parsedData.totalOdds || 2.5;
      const potentialWin = stake * odds;
      
      // Veritabanına kaydet
      await sql`
        INSERT INTO coupons (
          telegram_message_id, 
          coupon_code, 
          betting_site,
          coupon_description,
          total_stake, 
          total_odds, 
          potential_win,
          status
        ) VALUES (
          ${message.message_id},
          ${couponCode},
          ${parsedData.bettingSite || 'Bilinmeyen'},
          ${parsedData.description || ''},
          ${stake},
          ${odds},
          ${potentialWin},
          'pending'
        )
      `;
      
      // Maç detaylarını kaydet
      if (parsedData.matches && parsedData.matches.length > 0) {
        const couponId = await sql`SELECT id FROM coupons WHERE coupon_code = ${couponCode}`;
        const cId = couponId.rows[0].id;
        
        for (const match of parsedData.matches) {
          await sql`
            INSERT INTO matches (
              coupon_id,
              team_home,
              team_away,
              bet_type,
              odds
            ) VALUES (
              ${cId},
              ${match.teamHome || ''},
              ${match.teamAway || ''},
              ${match.betType || ''},
              ${match.odds || 0}
            )
          `;
        }
      }
      
      // İstatistikleri güncelle
      await sql`
        UPDATE stats SET 
          total_coupons = total_coupons + 1,
          pending_coupons = pending_coupons + 1,
          total_invested = total_invested + ${stake},
          updated_at = NOW()
        WHERE id = 1
      `;
      
      // Yanıt gönder
      if (body.message) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const responseText = `✅ Kupon kaydedildi!\n\n🎫 Kod: ${couponCode}\n🏢 Site: ${parsedData.bettingSite || 'Bilinmeyen'}\n💰 Yatırım: ${stake} TL\n📊 Oran: ${odds}\n🎯 Olası Kazanç: ${potentialWin.toFixed(2)} TL\n\n📱 Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}`;
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText
          })
        });
      }
      
      console.log(`✅ Kupon kaydedildi: ${couponCode} - ${parsedData.bettingSite} - ${stake}TL x ${odds}`);
      return NextResponse.json({ ok: true, saved: couponCode });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Telegram'dan fotoğraf URL'i al
async function getTelegramPhotoUrl(fileId) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const fileInfoUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
  
  const response = await fetch(fileInfoUrl);
  const data = await response.json();
  
  if (data.ok && data.result.file_path) {
    return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
  }
  
  throw new Error('Fotoğraf URL alınamadı');
}

// OCR.space API ile OCR
async function performOCR(imageUrl) {
  try {
    const ocrApiKey = process.env.OCR_SPACE_API_KEY || 'K87899142388957'; // Free key
    
    const formData = new URLSearchParams();
    formData.append('url', imageUrl);
    formData.append('language', 'tur');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');
    
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': ocrApiKey
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.ParsedResults && data.ParsedResults[0]) {
      return data.ParsedResults[0].ParsedText;
    }
    
    return '';
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

// OCR text'ini parse et
function parseOCRText(ocrText, caption) {
  const result = {
    bettingSite: null,
    totalOdds: null,
    maxBet: null,
    description: '',
    matches: []
  };
  
  const combinedText = `${ocrText}\n${caption}`.toLowerCase();
  
  // Site adı tespiti
  const sitePatterns = [
    { pattern: /ikas|ikasbet|iqbet/i, name: 'İkasbet' },
    { pattern: /odeon|odeonbet/i, name: 'Odeonbet' },
    { pattern: /superbonus|süperbonus/i, name: 'Superbonus' },
    { pattern: /bets10/i, name: 'Bets10' },
    { pattern: /mobilbahis/i, name: 'Mobilbahis' }
  ];
  
  for (const site of sitePatterns) {
    if (site.pattern.test(combinedText)) {
      result.bettingSite = site.name;
      break;
    }
  }
  
  // Oran tespiti (çok formatl)
  const oddsPatterns = [
    /(?:özel\s+)?oran[:\s]+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s+oran/i,
    /toplam\s+oran[:\s]+(\d+(?:\.\d+)?)/i
  ];
  
  for (const pattern of oddsPatterns) {
    const match = combinedText.match(pattern);
    if (match) {
      result.totalOdds = parseFloat(match[1]);
      break;
    }
  }
  
  // Max bahis tespiti
  const maxBetPatterns = [
    /max(?:\s+bah[iı]s)?[:\s]+(\d+)/i,
    /m[iı]n[-\s]?max\s+bah[iı]s[:\s]+(\d+)/i,
    /(\d+)tl/i,
    /(\d+)₺/
  ];
  
  for (const pattern of maxBetPatterns) {
    const match = combinedText.match(pattern);
    if (match) {
      result.maxBet = parseInt(match[1]);
      break;
    }
  }
  
  // Maç bilgisi tespiti
  const matchPatterns = [
    /([a-zğüşıöç\s]+)\s+(?:maç[ıi]|ma[cç])\s+(kazan[ıi]r|kaybed)/i,
    /([a-zğüşıöç\s]+)\s+[-–]\s+([a-zğüşıöç\s]+)/i,
    /(\d+\.\d+)\s+[üu]st\s+say[ıi]\s+atar/i
  ];
  
  // Açıklama oluştur
  const descLines = [];
  
  // "Alperen 21.5 Üst Sayı Atar" gibi bahisler
  const playerBetMatch = combinedText.match(/([a-zğüşıöç]+)\s+(\d+\.?\d*)\s+[üu]st\s+say[ıi]\s+atar/i);
  if (playerBetMatch) {
    descLines.push(`${playerBetMatch[1]} ${playerBetMatch[2]} üst sayı atar`);
    result.matches.push({
      betType: `${playerBetMatch[1]} ${playerBetMatch[2]} üst`,
      odds: result.totalOdds
    });
  }
  
  // "Houston Rockets Maçı Kazanır" gibi bahisler
  const teamWinMatch = combinedText.match(/([a-zğüşıöç\s]+)\s+(?:maç[ıi]|ma[cç])\s+(kazan[ıi]r)/i);
  if (teamWinMatch) {
    const teamName = teamWinMatch[1].trim();
    descLines.push(`${teamName} maçı kazanır`);
    result.matches.push({
      teamHome: teamName,
      betType: 'Kazanır',
      odds: result.totalOdds
    });
  }
  
  result.description = descLines.join(', ');
  
  return result;
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Telegram webhook active with OCR',
    time: new Date().toISOString()
  });
}
