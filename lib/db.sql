CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  telegram_message_id VARCHAR(255),
  coupon_code VARCHAR(100),
  total_stake DECIMAL(10,2),
  total_odds DECIMAL(10,2),
  potential_win DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  result_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER REFERENCES coupons(id),
  match_id VARCHAR(100),
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  prediction VARCHAR(50),
  odds DECIMAL(10,2),
  match_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  final_score VARCHAR(20),
  result VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  total_coupons INTEGER DEFAULT 0,
  won_coupons INTEGER DEFAULT 0,
  lost_coupons INTEGER DEFAULT 0,
  pending_coupons INTEGER DEFAULT 0,
  total_invested DECIMAL(10,2) DEFAULT 0,
  total_returned DECIMAL(10,2) DEFAULT 0,
  profit_loss DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
