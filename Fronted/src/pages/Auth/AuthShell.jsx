import { motion } from 'framer-motion';
import './Auth.css';

/**
 * Khung chung đăng nhập / đăng ký (panel trái + vùng form bên phải)
 */
export default function AuthShell({
  leftTitle,
  leftSubtitle,
  badges = [],
  children,
}) {
  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-panel-content">
          <div className="auth-logo">⚡ SPORTS</div>
          <h2 className="auth-panel-title">{leftTitle}</h2>
          <p className="auth-panel-sub">{leftSubtitle}</p>
          <div className="auth-panel-badges">
            {badges.map((b) => (
              <span key={b} className="auth-panel-badge">
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>

      <div className="auth-panel-right">
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
