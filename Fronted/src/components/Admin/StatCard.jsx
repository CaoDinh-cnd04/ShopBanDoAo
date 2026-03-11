import { Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import './StatCard.css';

const StatCard = ({ title, value, icon, color = 'surface', trend, trendValue }) => {
  const Icon = typeof icon === 'function' ? icon : null;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <Card className={`admin-kpi admin-kpi-${color}`}>
        <Card.Body className="admin-kpi-body">
          <div className="admin-kpi-top">
            <div className="admin-kpi-text">
              <div className="admin-kpi-title">{title}</div>
              <div className="admin-kpi-value">{value}</div>
            </div>
            {Icon ? (
              <div className="admin-kpi-icon">
                <Icon size={18} />
              </div>
            ) : null}
          </div>

          {trendValue ? (
            <div className={`admin-kpi-sub ${trend === 'down' ? 'is-down' : 'is-up'}`}>
              {trendValue}
            </div>
          ) : null}
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default StatCard;
