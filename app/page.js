'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_coupons: 0,
    won_coupons: 0,
    lost_coupons: 0,
    pending_coupons: 0,
    total_invested: 0,
    total_returned: 0,
    profit_loss: 0
  });
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, couponsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/coupons')
      ]);
      
      if (!statsRes.ok || !couponsRes.ok) {
        throw new Error('API yanıt vermedi');
      }
      
      const statsData = await statsRes.json();
      const couponsData = await couponsRes.json();
      
      setStats(statsData);
      setCoupons(couponsData);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>⏳ Yükleniyor...</div>
        {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '28px', margin: 0, color: '#1a1a1a' }}>
          🎯 Kupon Takip Sistemi
        </h1>
        <div onClick={fetchData} style={{
          cursor: 'pointer',
          fontSize: '24px',
          padding: '10px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s'
        }} title="Yenile">
          🔄
        </div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard title="Toplam Kupon" value={stats.total_coupons || 0} icon="📋" />
        <StatCard title="Kazanan" value={stats.won_coupons || 0} icon="✅" color="green" />
        <StatCard title="Kaybeden" value={stats.lost_coupons || 0} icon="❌" color="red" />
        <StatCard title="Bekleyen" value={stats.pending_coupons || 0} icon="⏳" color="orange" />
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ opacity: 0.9, marginBottom: '10px' }}>Toplam Yatırım</div>
          <strong style={{ fontSize: '24px', display: 'block' }}>
            {(stats.total_invested || 0).toFixed(2)} TL
          </strong>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ opacity: 0.9, marginBottom: '10px' }}>Toplam Kazanç</div>
          <strong style={{ fontSize: '24px', display: 'block', color: '#10b981' }}>
            {(stats.total_returned || 0).toFixed(2)} TL
          </strong>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ opacity: 0.9, marginBottom: '10px' }}>Net Kar/Zarar</div>
          <strong style={{ 
            fontSize: '24px', 
            display: 'block',
            color: (stats.profit_loss || 0) >= 0 ? '#10b981' : '#ef4444'
          }}>
            {(stats.profit_loss || 0) >= 0 ? '+' : ''}{(stats.profit_loss || 0).toFixed(2)} TL
          </strong>
        </div>
      </div>

      <div>
        <h2 style={{ marginBottom: '20px', color: '#1a1a1a' }}>Son Kuponlar</h2>
        {coupons.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
            <div style={{ fontSize: '18px', color: '#64748b' }}>
              Henüz kupon yok. Telegram botunuza kupon fotoğrafı gönderin.
            </div>
          </div>
        ) : (
          coupons.map(coupon => <CouponCard key={coupon.id} coupon={coupon} />)
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = 'blue' }) {
  const colors = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    orange: '#f59e0b'
  };

  return (
    <div style={{
      background: 'white',
      padding: '25px',
      borderRadius: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${colors[color]}`,
      transition: 'transform 0.3s',
      cursor: 'default'
    }}>
      <div style={{ fontSize: '40px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
          {value}
        </div>
        <div style={{ color: '#64748b', fontSize: '14px' }}>{title}</div>
      </div>
    </div>
  );
}

function CouponCard({ coupon }) {
  const statusColors = {
    won: '#10b981',
    lost: '#ef4444',
    pending: '#f59e0b'
  };

  const statusText = {
    won: '✅ Kazandı',
    lost: '❌ Kaybetti',
    pending: '⏳ Bekliyor'
  };

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s',
      cursor: 'default'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1a1a1a' }}>
          {coupon.coupon_code}
        </span>
        <span style={{
          padding: '5px 15px',
          borderRadius: '20px',
          color: 'white',
          fontSize: '12px',
          background: statusColors[coupon.status] || '#64748b'
        }}>
          {statusText[coupon.status] || '❓ Bilinmiyor'}
        </span>
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '10px',
        flexWrap: 'wrap',
        fontSize: '14px'
      }}>
        <div>💰 Yatırım: <strong>{coupon.total_stake || 0} TL</strong></div>
        <div>📊 Oran: <strong>{coupon.total_odds || 0}</strong></div>
        <div>🎯 Kazanç: <strong>{coupon.potential_win || 0} TL</strong></div>
      </div>
      <div style={{ color: '#94a3b8', fontSize: '12px' }}>
        {new Date(coupon.created_at).toLocaleString('tr-TR')}
      </div>
    </div>
  );
}
