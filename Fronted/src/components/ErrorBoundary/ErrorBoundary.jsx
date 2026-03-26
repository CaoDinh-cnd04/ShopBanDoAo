import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '50px', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>⚠️ Đã xảy ra lỗi</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            {this.state.error?.message || 'Có lỗi xảy ra trong ứng dụng'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Tải lại trang
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px' }}>
            <summary style={{ cursor: 'pointer', color: '#666' }}>Chi tiết lỗi</summary>
            <pre style={{ 
              marginTop: '10px', 
              padding: '15px', 
              backgroundColor: '#fff', 
              borderRadius: '5px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.stack || JSON.stringify(this.state.error, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
