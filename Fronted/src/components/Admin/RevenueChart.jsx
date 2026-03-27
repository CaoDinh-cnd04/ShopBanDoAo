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
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="Date"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      color: '#0f172a',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    }}
                    formatter={(value) =>
                      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
                    }
                    labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                  />
                  <Legend wrapperStyle={{ color: '#64748b' }} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#0d9488"
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
