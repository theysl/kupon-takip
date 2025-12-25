import { sql } from '@vercel/postgres';
import axios from 'axios';

export async function GET(req) {
  try {
    // Bekleyen maçları getir
    const pendingMatches = await sql`
      SELECT m.*, c.id as coupon_id 
      FROM matches m 
      JOIN coupons c ON m.coupon_id = c.id 
      WHERE m.status = 'pending' 
      AND m.match_date < NOW()
    `;
    
    for (const match of pendingMatches.rows) {
      // API Football'dan sonuç çek
      const response = await axios.get(
        `https://apiv3.apifootball.com/?action=get_events&match_id=${match.match_id}&APIkey=${process.env.FOOTBALL_API_KEY}`
      );
      
      const matchData = response.data[0];
      
      if (matchData && matchData.match_status === 'Finished') {
        const homeScore = parseInt(matchData.match_hometeam_score);
        const awayScore = parseInt(matchData.match_awayteam_score);
        const finalScore = `${homeScore}-${awayScore}`;
        
        // Tahmini kontrol et
        let result = 'lost';
        if (match.prediction === 'MS1' && homeScore > awayScore) result = 'won';
        if (match.prediction === 'MS2' && awayScore > homeScore) result = 'won';
        if (match.prediction === 'MSX' && homeScore === awayScore) result = 'won';
        if (match.prediction === 'KG' && homeScore > 0 && awayScore > 0) result = 'won';
        
        // Maç durumunu güncelle
        await sql`
          UPDATE matches 
          SET status = 'finished', final_score = ${finalScore}, result = ${result}
          WHERE id = ${match.id}
        `;
        
        // Kuponun tüm maçlarını kontrol et
        await checkCouponStatus(match.coupon_id);
      }
    }
    
    return Response.json({ success: true, checked: pendingMatches.rows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function checkCouponStatus(couponId) {
  const matches = await sql`
    SELECT * FROM matches WHERE coupon_id = ${couponId}
  `;
  
  const allFinished = matches.rows.every(m => m.status === 'finished');
  const allWon = matches.rows.every(m => m.result === 'won');
  const anyLost = matches.rows.some(m => m.result === 'lost');
  
  if (allFinished) {
    const status = allWon ? 'won' : 'lost';
    
    await sql`
      UPDATE coupons 
      SET status = ${status}, result_date = NOW()
      WHERE id = ${couponId}
    `;
    
    // İstatistikleri güncelle
    await updateStats();
  }
}

async function updateStats() {
  await sql`
    INSERT INTO stats (id, total_coupons, won_coupons, lost_coupons, pending_coupons, 
                       total_invested, total_returned, profit_loss, updated_at)
    VALUES (1,
      (SELECT COUNT(*) FROM coupons),
      (SELECT COUNT(*) FROM coupons WHERE status = 'won'),
      (SELECT COUNT(*) FROM coupons WHERE status = 'lost'),
      (SELECT COUNT(*) FROM coupons WHERE status = 'pending'),
      (SELECT COALESCE(SUM(total_stake), 0) FROM coupons),
      (SELECT COALESCE(SUM(potential_win), 0) FROM coupons WHERE status = 'won'),
      (SELECT COALESCE(SUM(potential_win), 0) FROM coupons WHERE status = 'won') - 
      (SELECT COALESCE(SUM(total_stake), 0) FROM coupons),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      total_coupons = EXCLUDED.total_coupons,
      won_coupons = EXCLUDED.won_coupons,
      lost_coupons = EXCLUDED.lost_coupons,
      pending_coupons = EXCLUDED.pending_coupons,
      total_invested = EXCLUDED.total_invested,
      total_returned = EXCLUDED.total_returned,
      profit_loss = EXCLUDED.profit_loss,
      updated_at = NOW()
  `;
}
