import { BarChart3, Bell, Eye, Gauge, Smartphone, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const features = [
  { icon: Eye, title: 'Unified View', description: 'See all your sBTC positions across every Stacks protocol in one dashboard.', hero: true },
  { icon: TrendingUp, title: 'Yield Tracker', description: 'Real-time APY tracking and yield aggregation across lending, LPs, and staking.', hero: true },
  { icon: Bell, title: 'Smart Alerts', description: 'Get notified about APY changes, position health, and new opportunities.' },
  { icon: BarChart3, title: 'Deep Analytics', description: 'Institutional-grade charts and performance breakdowns for your portfolio.' },
  { icon: Gauge, title: 'Risk Score', description: 'Protocol-level risk analysis with concentration warnings and recommendations.' },
  { icon: Smartphone, title: 'Mobile Ready', description: 'Full-featured responsive design — manage your portfolio from anywhere.' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-12 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need for <span className="gradient-text-orange">sBTC DeFi</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Professional-grade tools built for the sBTC ecosystem.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className={cn(
                'glass-card-hover p-5 space-y-2 relative overflow-hidden',
                f.hero && 'lg:col-span-1'
              )}
            >
              {/* Accent gradient line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
              <div className={cn(
                'rounded-xl flex items-center justify-center',
                f.hero ? 'w-12 h-12 bg-primary/10' : 'w-11 h-11 bg-primary/10'
              )}>
                <f.icon className={cn('text-primary', f.hero ? 'w-6 h-6' : 'w-5 h-5')} />
              </div>
              <h3 className={cn(
                'font-semibold text-foreground',
                f.hero ? 'text-xl' : 'text-lg'
              )}>{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
