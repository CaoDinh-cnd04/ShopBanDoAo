import { Card } from 'react-bootstrap';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import { useState } from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const fmtShort = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e5e5',
      borderRadius: 6,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      minWidth: 200,
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 6, color: '#111' }}>
        {label ? new Date(label).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: '0.8rem', color: p.color, fontWeight: 600, marginTop: 2 }}>
          <span>{p.name}</span>
          <span>{p.dataKey === 'revenue' ? fmt(p.value) : p.value + ' đơn'}</span>
        </div>
      ))}
    </div>
  );
};

const RevenueChart = ({ data }) => {
  const [mode, setMode] = useState('area'); // 'area' | 'bar'
  const hasData = Array.isArray(data) && data.length > 0;

  const totalRevenue = hasData ? data.reduce((s, d) => s + (d.revenue || 0), 0) : 0;
  const totalOrders  = hasData ? data.reduce((s, d) => s + (d.orders  || 0), 0) : 0;

  return (
    <Card className="admin-panel mb-3">
      <Card.Header className="admin-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiTrendingUp size={16} style={{ color: '#E00000' }} />
          <span className="admin-panel-title" style={{ margin: 0 }}>Doanh thu 30 ngày gần nhất</span>
        </div>
        {hasData && (
          <div style={{ display: 'flex', gap: 6 }}>
            {['area', 'bar'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '3px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: '1.5px solid',
                  borderColor: mode === m ? '#111' : '#ddd',
                  borderRadius: 4,
                  background: mode === m ? '#111' : 'transparent',
                  color: mode === m ? '#fff' : '#888',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'area' ? 'Đường' : 'Cột'}
              </button>
            ))}
          </div>
        )}
      </Card.Header>

      {hasData && (
        <div style={{ display: 'flex', gap: 24, padding: '12px 20px 0', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tổng doanh thu (30 ngày)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>{fmt(totalRevenue)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tổng đơn hàng (30 ngày)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>{totalOrders} đơn</div>
          </div>
        </div>
      )}

      <Card.Body className="admin-panel-body" style={{ paddingTop: hasData ? 8 : undefined }}>
        {!hasData ? (
          <div className="admin-empty">
            <FiBarChart2 size={44} className="admin-empty-icon" />
            <div className="admin-empty-title">Chưa có dữ liệu</div>
            <div className="admin-empty-sub">Doanh thu trong 30 ngày gần nhất sẽ hiển thị tại đây.</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            {mode === 'area' ? (
              <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#111111" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#E00000" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#E00000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f0f0f0" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#999' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="rev"
                  tick={{ fontSize: 11, fill: '#999' }}
                  tickFormatter={fmtShort}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <YAxis
                  yAxisId="ord"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#bbb' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.78rem', color: '#666' }} />
                <Area
                  yAxisId="rev"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#111111"
                  strokeWidth={2.5}
                  fill="url(#gradRevenue)"
                  name="Doanh thu"
                  dot={false}
                  activeDot={{ r: 4, fill: '#111' }}
                />
                <Area
                  yAxisId="ord"
                  type="monotone"
                  dataKey="orders"
                  stroke="#E00000"
                  strokeWidth={1.8}
                  fill="url(#gradOrders)"
                  name="Đơn hàng"
                  dot={false}
                  activeDot={{ r: 4, fill: '#E00000' }}
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f0f0f0" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#999' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#999' }}
                  tickFormatter={fmtShort}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.78rem', color: '#666' }} />
                <Bar dataKey="revenue" fill="#111111" name="Doanh thu" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
};

export default RevenueChart;
