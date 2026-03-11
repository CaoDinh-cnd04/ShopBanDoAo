import { Card } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiBarChart2 } from 'react-icons/fi';

const RevenueChart = ({ data }) => {
    const hasData = Array.isArray(data) && data.length > 0;

    return (
        <Card className="admin-panel">
          <Card.Header className="admin-panel-header">
            <div className="admin-panel-title">Doanh thu theo ngày (30 ngày)</div>
          </Card.Header>
          <Card.Body className="admin-panel-body">
            {!hasData ? (
              <div className="admin-empty">
                <FiBarChart2 size={44} className="admin-empty-icon" />
                <div className="admin-empty-title">Chưa có dữ liệu</div>
                <div className="admin-empty-sub">Doanh thu trong 30 ngày gần nhất sẽ hiển thị tại đây.</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data}>
                  <CartesianGrid stroke="rgba(255,255,255,0.10)" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="Date"
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.70)' }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.70)' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 26, 46, 0.95)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      color: 'rgba(255,255,255,0.92)',
                    }}
                    formatter={(value) =>
                      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
                    }
                    labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.70)' }} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    name="Doanh thu"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>
    );
};

export default RevenueChart;
