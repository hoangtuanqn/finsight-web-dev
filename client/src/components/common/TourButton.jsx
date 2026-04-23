import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useTourContext } from '../../context/TourContext';

/**
 * Nút floating "?" ở góc dưới phải màn hình.
 * Người dùng nhấn để replay tour bất cứ lúc nào.
 */
export default function TourButton() {
  const { startTour } = useTourContext();

  return (
    <motion.button
      id="tour-replay-btn"
      onClick={startTour}
      title="Xem lại hướng dẫn"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position:     'fixed',
        bottom:       24,
        right:        24,
        zIndex:       9999999,
        width:        44,
        height:       44,
        borderRadius: '50%',
        border:       '1px solid rgba(59,130,246,0.35)',
        background:   'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))',
        backdropFilter: 'blur(12px)',
        boxShadow:    '0 4px 20px rgba(59,130,246,0.3), 0 0 0 1px rgba(59,130,246,0.1)',
        color:        '#60a5fa',
        cursor:       'pointer',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        transition:   'box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 30px rgba(59,130,246,0.5), 0 0 0 1px rgba(59,130,246,0.25)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.3), 0 0 0 1px rgba(59,130,246,0.1)'; }}
    >
      <HelpCircle size={20} />
    </motion.button>
  );
}
