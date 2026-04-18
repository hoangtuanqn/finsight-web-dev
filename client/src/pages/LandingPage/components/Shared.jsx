import { useRef, useState, useEffect } from 'react';
import { motion, useInView, animate } from 'framer-motion';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

export function AnimatedCounter({ target, suffix = '', duration = 2 }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isInView) return;
    if (isMobile) {
      setDisplay(target.toString());
      return;
    }
    const val = { v: 0 };
    const ctrl = animate(val.v, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(typeof target === 'number' && target % 1 === 0 ? Math.round(v).toString() : v.toFixed(1)),
    });
    return () => ctrl.stop();
  }, [isInView, target, duration, isMobile]);

  return <span ref={ref}>{display}{suffix}</span>;
}

export function Section({ children, className = '', id, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const isMobile = useIsMobile();

  const baseClass = `py-24 px-6 max-w-7xl mx-auto w-full relative z-10 ${className}`;

  if (isMobile) {
    return <section id={id} className={baseClass}>{children}</section>;
  }

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={baseClass}
    >
      {children}
    </motion.section>
  );
}

export function StaggerGroup({ children, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const isMobile = useIsMobile();

  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const FeatureCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  );
}
