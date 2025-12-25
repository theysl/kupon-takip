import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM coupons 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    return Response.json(result.rows);
  } catch (error) {
    console.error('Coupons API error:', error);
    return Response.json([]);
  }
}
