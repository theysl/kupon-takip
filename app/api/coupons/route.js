import { sql } from '@vercel/postgres';

export async function GET() {
  const coupons = await sql`
    SELECT * FROM coupons ORDER BY created_at DESC LIMIT 20
  `;
  return Response.json(coupons.rows);
}
