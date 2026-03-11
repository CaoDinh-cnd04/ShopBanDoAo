import { motion } from 'framer-motion';
import { useMemo } from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  // Generate shapes data once using useMemo to avoid re-renders
  const shapes = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: 20 + Math.random() * 40,
      height: 20 + Math.random() * 40,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
      xOffset: Math.random() * 20 - 10,
    }));
  }, []);

  return (
    <div className="animated-background">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="floating-shape"
          style={{
            left: `${shape.left}%`,
            top: `${shape.top}%`,
            width: `${shape.width}px`,
            height: `${shape.height}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, shape.xOffset, 0],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay,
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
