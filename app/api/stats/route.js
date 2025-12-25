import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM stats WHERE id = 1`;
    
    if (result.rows.length === 0) {
      return Response.json({
        total_coupons: 0,
        won_coupons: 0,
        lost_coupons: 0,
        pending_coupons: 0,
        total_invested: 0,
        total_returned: 0,
        profit_loss: 0
      });
    }
    
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Stats API error:', error);
    return Response.json({
      total_coupons: 0,
      won_coupons: 0,
      lost_coupons: 0,
      pending_coupons: 0,
      total_invested: 0,
      total_returned: 0,
      profit_loss: 0
    });
  }
}
