const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    // Coupons tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        telegram_message_id INTEGER UNIQUE,
        coupon_code VARCHAR(50) UNIQUE NOT NULL,
        total_stake DECIMAL(10,2) DEFAULT 0,
        total_odds DECIMAL(10,2) DEFAULT 0,
        potential_win DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Coupons table created');

    // Matches tablosu
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
    console.log('✅ Matches table created');

    // Stats tablosu
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
    console.log('✅ Stats table created');

    // İlk stats kaydı
    await sql`
      INSERT INTO stats (id, total_coupons, won_coupons, lost_coupons, pending_coupons, total_invested, total_returned, profit_loss)
      VALUES (1, 0, 0, 0, 0, 0, 0, 0)
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('✅ Stats initialized');

    // İndeksler
    await sql`CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_coupons_created ON coupons(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matches_coupon ON matches(coupon_id)`;
    console.log('✅ Indexes created');

    console.log('\n🎉 Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupDatabase();
