import { sql } from '@vercel/postgres';

export async function GET() {
  const stats = await sql`SELECT * FROM stats WHERE id = 1`;
  return Response.json(stats.rows[0] || {
    total_coupons: 0, won_coupons: 0, lost_coupons: 0,
    pending_coupons: 0, total_invested: 0, total_returned: 0, profit_loss: 0
  });
}
