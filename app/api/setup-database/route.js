import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    console.log('🚀 Starting database setup...');

    // 1. Coupons tablosu (yeni kolonlarla)
    await sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        telegram_message_id INTEGER UNIQUE,
        coupon_code VARCHAR(50) UNIQUE NOT NULL,
        betting_site VARCHAR(100),
        coupon_description TEXT,
        total_stake DECIMAL(10,2) DEFAULT 0,
        total_odds DECIMAL(10,2) DEFAULT 0,
        potential_win DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Coupons table created/verified');

    // 2. Matches tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
        team_home VARCHAR(100),
        team_away VARCHAR(100),
        bet_type VARCHAR(50),
        odds DECIMAL(10,2),
        result VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Matches table created/verified');

    // 3. Stats tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS stats (
        id SERIAL PRIMARY KEY,
        total_coupons INTEGER DEFAULT 0,
        won_coupons INTEGER DEFAULT 0,
        lost_coupons INTEGER DEFAULT 0,
        pending_coupons INTEGER DEFAULT 0,
        total_invested DECIMAL(10,2) DEFAULT 0,
        total_returned DECIMAL(10,2) DEFAULT 0,
        profit_loss DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Stats table created/verified');

    // 4. İlk stats kaydını oluştur
    await sql`
      INSERT INTO stats (id, total_coupons, won_coupons, lost_coupons, pending_coupons, total_invested, total_returned, profit_loss)
      VALUES (1, 0, 0, 0, 0, 0, 0, 0)
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('✅ Stats initialized');

    // 5. Mevcut tabloya yeni kolonları ekle (güvenli şekilde)
    try {
      await sql`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS betting_site VARCHAR(100)`;
      console.log('✅ betting_site column added/verified');
    } catch (error) {
      console.log('⚠️ betting_site column already exists or error:', error.message);
    }

    try {
      await sql`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_description TEXT`;
      console.log('✅ coupon_description column added/verified');
    } catch (error) {
      console.log('⚠️ coupon_description column already exists or error:', error.message);
    }

    // 6. İndeksler (performans için)
    await sql`CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_coupons_created ON coupons(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matches_coupon ON matches(coupon_id)`;
    console.log('✅ Indexes created/verified');

    // 7. Başarı yanıtı
    return NextResponse.json({ 
      success: true,
      message: 'Database tables created/updated successfully!',
      tables: {
        coupons: {
          columns: [
            'id', 'telegram_message_id', 'coupon_code', 
            'betting_site', 'coupon_description',
            'total_stake', 'total_odds', 'potential_win', 
            'status', 'created_at', 'updated_at'
          ]
        },
        matches: {
          columns: [
            'id', 'coupon_id', 'team_home', 'team_away',
            'bet_type', 'odds', 'result', 'created_at'
          ]
        },
        stats: {
          columns: [
            'id', 'total_coupons', 'won_coupons', 'lost_coupons',
            'pending_coupons', 'total_invested', 'total_returned',
            'profit_loss', 'created_at', 'updated_at'
          ]
        }
      },
      indexes: [
        'idx_coupons_status',
        'idx_coupons_created',
        'idx_matches_coupon'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Setup error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
