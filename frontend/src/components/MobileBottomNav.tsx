import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, TrendingUp, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const tabs = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Positions', path: '/positions', icon: Layers },
  { label: 'Yield', path: '/yield', icon: TrendingUp },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around h-14">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <NavLink key={tab.path} to={tab.path} aria-current={active ? 'page' : undefined} className="px-3 py-1.5 relative">
              {active && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-full bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                className="relative flex flex-col items-center gap-0.5"
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <motion.div
                  animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  key={`${tab.path}-${active}`}
                >
                  <tab.icon className={cn('w-5 h-5', active ? 'text-primary' : 'text-muted-foreground')} />
                </motion.div>
                {active && (
                  <motion.div
                    layoutId="activeTabDot"
                    className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_hsla(33,93%,54%,0.6)]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{
                      type: 'spring', stiffness: 500, damping: 30,
                      scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                      opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  />
                )}
                <span className={cn('text-[10px] font-medium transition-colors', active ? 'text-primary' : 'text-muted-foreground')}>{tab.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
