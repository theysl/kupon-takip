'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const statsData = await statsRes.json();
      const couponsData = await couponsRes.json();
      setStats(statsData);
      setCoupons(couponsData);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Yükleniyor...</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'won': return '#10b981';
      case 'lost': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'won': return '✅ Kazandı';
      case 'lost': return '❌ Kaybetti';
      default: return '⏳ Bekliyor';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
            🎯 Kupon Takip Sistemi
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
            Telegram botunuzdan gelen kuponları takip edin
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '15px', 
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ opacity: 0.7, marginBottom: '10px' }}>📋 Toplam Kupon</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              {stats?.total_coupons || 0}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            borderRadius: '15px', 
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ opacity: 0.7, marginBottom: '10px' }}>✅ Kazanan</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
              {stats?.won_coupons || 0}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            borderRadius: '15px', 
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ opacity: 0.7, marginBottom: '10px' }}>❌ Kaybeden</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
              {stats?.lost_coupons || 0}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            borderRadius: '15px', 
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ opacity: 0.7, marginBottom: '10px' }}>⏳ Bekleyen</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats?.pending_coupons || 0}
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: '15px', 
            padding: '25px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ opacity: 0.9, marginBottom: '10px' }}>Toplam Yatırım</div>
            <strong style={{ fontSize: '24px', display: 'block' }}>
              {Number(stats?.total_invested || 0).toFixed(2)} TL
            </strong>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            borderRadius: '15px', 
            padding: '25px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ opacity: 0.9, marginBottom: '10px' }}>Toplam Kazanç</div>
            <strong style={{ fontSize: '24px', display: 'block' }}>
              {Number(stats?.total_returned || 0).toFixed(2)} TL
            </strong>
          </div>

          <div style={{ 
            background: stats?.profit_loss >= 0 
              ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' 
              : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '15px', 
            padding: '25px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ opacity: 0.9, marginBottom: '10px' }}>Net Kar/Zarar</div>
            <strong style={{ fontSize: '24px', display: 'block' }}>
              {stats?.profit_loss >= 0 ? '+' : ''}{Number(stats?.profit_loss || 0).toFixed(2)} TL
            </strong>
          </div>
        </div>

        {/* Coupons List */}
        <div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            📜 Son Kuponlar
          </h2>
          
          {coupons.length === 0 ? (
            <div style={{ 
              background: 'white', 
              borderRadius: '15px', 
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
              <p style={{ color: '#666', fontSize: '16px' }}>
                Henüz kupon yok. Telegram botunuza kupon fotoğrafı gönderin.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {coupons.map((coupon) => (
                <div 
                  key={coupon.id}
                  style={{ 
                    background: 'white', 
                    borderRadius: '15px', 
                    padding: '25px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    borderLeft: `5px solid ${getStatusColor(coupon.status)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {coupon.coupon_code}
                      </h3>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        {new Date(coupon.created_at).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '8px 16px', 
                      borderRadius: '20px',
                      background: getStatusColor(coupon.status),
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(coupon.status)}
                    </div>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '15px',
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid #eee'
                  }}>
                    <div>
                      <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>💰 Yatırım</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {Number(coupon.total_stake).toFixed(2)} TL
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>📊 Oran</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {Number(coupon.total_odds).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>🎯 Olası Kazanç</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#10b981' }}>
                        {Number(coupon.potential_win).toFixed(2)} TL
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
