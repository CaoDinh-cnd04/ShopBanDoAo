import { Spinner } from 'react-bootstrap';
import { useEffect, useRef } from 'react';

const Loading = ({ size = 'md', className = '' }) => {
  const spinnerRef = useRef(null);

  useEffect(() => {
    // Simple rotation animation using CSS instead of nested motion
    if (spinnerRef.current) {
      const interval = setInterval(() => {
        if (spinnerRef.current) {
          spinnerRef.current.style.transform = `rotate(${Date.now() / 10 % 360}deg)`;
        }
      }, 16);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className={`d-flex justify-content-center align-items-center p-5 ${className}`}>
      <div ref={spinnerRef} style={{ transition: 'transform 0.1s linear' }}>
        <Spinner
          animation="border"
          role="status"
          size={size}
          style={{
            borderColor: 'var(--primary-color)',
            borderRightColor: 'transparent',
          }}
        >
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    </div>
  );
};

export default Loading;
