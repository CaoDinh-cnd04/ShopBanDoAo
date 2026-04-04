import { Card } from 'react-bootstrap';
import { FiAward, FiPackage } from 'react-icons/fi';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const MEDAL = ['🥇', '🥈', '🥉'];

const TopProducts = ({ products }) => {
  const items = Array.isArray(products) ? products : [];
  const maxQty = items[0]?.totalQuantity || 1;

  return (
    <Card className="admin-panel mb-3">
      <Card.Header className="admin-panel-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiAward size={16} style={{ color: '#E00000' }} />
        <span className="admin-panel-title" style={{ margin: 0 }}>Top sản phẩm bán chạy</span>
      </Card.Header>
      <Card.Body className="admin-panel-body" style={{ padding: 0 }}>
        {items.length === 0 ? (
          <div className="admin-empty">
            <FiPackage size={44} className="admin-empty-icon" />
            <div className="admin-empty-title">Chưa có dữ liệu</div>
            <div className="admin-empty-sub">Sản phẩm bán chạy sẽ hiển thị khi có đơn hàng hoàn thành.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', width: 48, textAlign: 'center' }}>#</th>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>Sản phẩm</th>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', width: 200 }}>Đã bán</th>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', width: 160, textAlign: 'right' }}>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => {
                  const pct = Math.round(((p.totalQuantity || 0) / maxQty) * 100);
                  const rawImg = typeof p.image === 'string' ? p.image : p.image?.imageUrl;
                  const img = rawImg ? resolveMediaUrl(rawImg) : null;
                  return (
                    <tr
                      key={p.productId || i}
                      style={{
                        borderBottom: '1px solid #f5f5f5',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                    >
                      {/* Rank */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, fontSize: i < 3 ? '1.1rem' : '0.85rem', color: '#888' }}>
                        {i < 3 ? MEDAL[i] : i + 1}
                      </td>

                      {/* Product info */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {img ? (
                            <img
                              src={img}
                              alt={p.productName}
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0, border: '1px solid #eee' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 4, background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FiPackage size={16} style={{ color: '#bbb' }} />
                            </div>
                          )}
                          <span style={{ fontWeight: 600, color: '#111' }}>{p.productName}</span>
                        </div>
                      </td>

                      {/* Qty + progress */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: i === 0 ? '#111' : i === 1 ? '#555' : '#999', borderRadius: 3, transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', minWidth: 32, textAlign: 'right' }}>
                            {p.totalQuantity ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#111', textAlign: 'right' }}>
                        {fmt(p.totalRevenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default TopProducts;
