import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const stats = [
  { label: 'Users', value: 50000, suffix: '+' },
  { label: 'Satisfaction', value: 98, suffix: '%' },
  { label: '24/7 AI Support', value: 1, suffix: '' }
];

function useCountUp(target, duration = 1200, startCounting = false) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (!startCounting) return;
    let start = 0;
    const step = () => {
      start += Math.ceil(target / (duration / 16));
      if (start >= target) {
        setCount(target);
      } else {
        setCount(start);
        ref.current = requestAnimationFrame(step);
      }
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration, startCounting]);
  return count;
}

export default function StatisticsSection() {
  const controls = useAnimation();
  const [inView, setInView] = useState(false);
  const sectionRef = useRef();

  // Only trigger count up when in view
  const counts = stats.map((stat, i) => useCountUp(stat.value, 1200, inView));

  useEffect(() => {
    const onScroll = () => {
      if (!inView && sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          setInView(true);
        }
      }
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [inView]);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [inView, controls]);

  return (
    <section id="statistics" ref={sectionRef} className="max-w-5xl mx-auto px-6 py-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Our Impact</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.2 }}
            className="bg-white/5 backdrop-blur rounded-2xl p-10 border border-blue-900/30 shadow-lg"
          >
            <div className="text-5xl font-extrabold text-blue-300 mb-2">
              {counts[i].toLocaleString()}{stat.suffix}
            </div>
            <div className="text-blue-100 font-semibold text-lg">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
