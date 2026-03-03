import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
// Static protocols list for landing page showcase
import { protocols } from '@/data/mock';

const statsContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const statsItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const protocolContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const protocolItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="font-mono text-4xl font-bold text-foreground">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  { target: 12500000, prefix: '$', suffix: '', label: 'TVL Tracked', display: '12.5M' },
  { target: 500, prefix: '', suffix: '+', label: 'Active Users' },
  { target: 10, prefix: '', suffix: '+', label: 'Protocols Integrated' },
];

export function SocialProof() {
  return (
    <section id="stats" aria-label="Social proof and statistics" className="py-10 border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm text-muted-foreground text-center mb-6 tracking-wide uppercase"
        >
          Trusted by the Stacks community
        </motion.p>

        <motion.div
          variants={statsContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-6"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={statsItemVariants}
              className="space-y-2"
            >
              {s.display ? (
                <span className="font-mono text-4xl font-bold text-foreground">{s.prefix}{s.display}</span>
              ) : (
                <AnimatedCounter target={s.target} prefix={s.prefix} suffix={s.suffix} />
              )}
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="w-16 h-px bg-border mx-auto mb-5" />

        {/* Protocol parade */}
        <motion.div
          variants={protocolContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-3 sm:gap-4 sm:flex-wrap"
        >
          {protocols.map((p) => (
            <motion.div
              key={p.id}
              variants={protocolItemVariants}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-border/30 transition-all duration-200 hover:scale-105"
              style={{ ['--hover-color' as string]: p.color }}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold font-mono"
                style={{ background: `${p.color}20`, color: p.color }}
              >
                {p.icon}
              </div>
              <span className="text-sm text-muted-foreground font-medium">{p.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
