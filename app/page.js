'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Her 30 saniyede güncelle
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, couponsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/coupons')
      ]);
      setStats(await statsRes.json());
      setCoupons(await couponsRes.json());
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="container">
      <header className="header">
        <h1>🎯 Kupon Takip Sistemi</h1>
        <div className="refresh" onClick={fetchData}>🔄</div>
      </header>

      <div className="stats-grid">
        <StatCard 
          title="Toplam Kupon" 
          value={stats.total_coupons} 
          icon="📋"
        />
        <StatCard 
          title="Kazanan" 
          value={stats.won_coupons} 
          icon="✅" 
          color="green"
        />
        <StatCard 
          title="Kaybeden" 
          value={stats.lost_coupons} 
          icon="❌" 
          color="red"
        />
        <StatCard 
          title="Bekleyen" 
          value={stats.pending_coupons} 
          icon="⏳" 
          color="orange"
        />
      </div>

      <div className="profit-card">
        <div className="profit-item">
          <span>Toplam Yatırım</span>
          <strong>{stats.total_invested.toFixed(2)} TL</strong>
        </div>
        <div className="profit-item">
          <span>Toplam Kazanç</span>
          <strong className="green">{stats.total_returned.toFixed(2)} TL</strong>
        </div>
        <div className="profit-item">
          <span>Net Kar/Zarar</span>
          <strong className={stats.profit_loss >= 0 ? 'green' : 'red'}>
            {stats.profit_loss >= 0 ? '+' : ''}{stats.profit_loss.toFixed(2)} TL
          </strong>
        </div>
      </div>

      <div className="coupons-list">
        <h2>Son Kuponlar</h2>
        {coupons.map(coupon => (
          <CouponCard key={coupon.id} coupon={coupon} />
        ))}
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 28px;
          margin: 0;
        }
        .refresh {
          cursor: pointer;
          font-size: 24px;
          padding: 10px;
          border-radius: 50%;
          transition: transform 0.3s;
        }
        .refresh:hover {
          transform: rotate(180deg);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .profit-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 15px;
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .profit-item {
          text-align: center;
        }
        .profit-item span {
          display: block;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        .profit-item strong {
          font-size: 24px;
          display: block;
        }
        .green { color: #10b981; }
        .red { color: #ef4444; }
        .coupons-list h2 {
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .profit-card {
            flex-direction: column;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon, color = 'blue' }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="icon">{icon}</div>
      <div className="content">
        <div className="value">{value}</div>
        <div className="title">{title}</div>
      </div>
      <style jsx>{`
        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.3s;
        }
        .stat-card:hover {
          transform: translateY(-5px);
        }
        .icon {
          font-size: 40px;
        }
        .value {
          font-size: 32px;
          font-weight: bold;
        }
        .title {
          color: #64748b;
          font-size: 14px;
        }
        .green { border-left: 4px solid #10b981; }
        .red { border-left: 4px solid #ef4444; }
        .orange { border-left: 4px solid #f59e0b; }
        .blue { border-left: 4px solid #3b82f6; }
      `}</style>
    </div>
  );
}

function CouponCard({ coupon }) {
  const statusColors = {
    won: '#10b981',
    lost: '#ef4444',
    pending: '#f59e0b'
  };
  
  return (
    <div className="coupon-card">
      <div className="coupon-header">
        <span className="coupon-code">{coupon.coupon_code}</span>
        <span className="status" style={{ background: statusColors[coupon.status] }}>
          {coupon.status === 'won' ? '✅ Kazandı' : coupon.status === 'lost' ? '❌ Kaybetti' : '⏳ Bekliyor'}
        </span>
      </div>
      <div className="coupon-details">
        <div>💰 Yatırım: <strong>{coupon.total_stake} TL</strong></div>
        <div>📊 Oran: <strong>{coupon.total_odds}</strong></div>
        <div>🎯 Kazanç: <strong>{coupon.potential_win} TL</strong></div>
      </div>
      <div className="coupon-date">
        {new Date(coupon.created_at).toLocaleString('tr-TR')}
      </div>
      <style jsx>{`
        .coupon-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .coupon-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .coupon-code {
          font-weight: bold;
          font-size: 16px;
        }
        .status {
          padding: 5px 15px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
        }
        .coupon-details {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
        }
        .coupon-date {
          color: #94a3b8;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
