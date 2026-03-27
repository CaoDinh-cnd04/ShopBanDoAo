import { Card, Table } from 'react-bootstrap';

const TopProducts = ({ products }) => {
  const items = Array.isArray(products) ? products : [];

  return (
    <Card className="admin-panel">
      <Card.Header className="admin-panel-header">
        <div className="admin-panel-title">Top sản phẩm bán chạy</div>
      </Card.Header>
      <Card.Body className="admin-panel-body">
        <Table responsive hover className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>#</th>
              <th>Sản phẩm</th>
              <th style={{ width: 140 }}>Số lượng</th>
              <th style={{ width: 200 }}>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((product, index) => (
                <tr key={product.productId || product.ProductID || index}>
                  <td>{index + 1}</td>
                  <td className="fw-semibold">{product.productName || product.ProductName}</td>
                  <td>
                    <span className="admin-pill">{product.totalQuantity ?? product.TotalQuantity ?? 0}</span>
                  </td>
                  <td className="fw-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      product.totalRevenue ?? product.TotalRevenue ?? 0
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-muted">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default TopProducts;
