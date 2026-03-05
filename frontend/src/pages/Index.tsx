import { LandingHeader } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { SocialProof } from '@/components/landing/SocialProof';
import { Footer } from '@/components/landing/Footer';
import { SEOHead } from '@/components/SEOHead';
import { useWallet } from '@/hooks/useStacksWallet';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ctaContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const ctaItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const { connect, connected, isLoading } = useWallet();

  const handleLaunchApp = async () => {
    // If already connected, go to dashboard
    if (connected) {
      navigate('/dashboard');
      return;
    }

    try {
      await connect();
      // Toast is handled by useStacksWallet hook
      // Only navigate if connection was successful (no error thrown)
      navigate('/dashboard');
    } catch (error) {
      // Error toast is handled by useStacksWallet hook
      console.error('Connection error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="sBTC Portfolio Intelligence" description="Track, analyze, and optimize your sBTC portfolio across the Stacks ecosystem." />
      <LandingHeader onLaunchApp={handleLaunchApp} isConnecting={isLoading} />
      <main id="main-content">
        <Hero onLaunchApp={handleLaunchApp} isConnecting={isLoading} />
        <Features />
        <SocialProof />

        {/* Closing CTA */}
        <section className="py-12 relative mesh-background overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <motion.div
            variants={ctaContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="container mx-auto px-4 sm:px-6 text-center relative z-10 space-y-4"
          >
            <motion.h2 variants={ctaItemVariants} className="text-3xl sm:text-4xl font-bold text-foreground">
              Ready to optimize your{' '}
              <span className="gradient-text-orange">sBTC portfolio</span>?
            </motion.h2>
            <motion.p variants={ctaItemVariants} className="text-muted-foreground text-lg max-w-lg mx-auto">
              Join hundreds of users tracking their positions across the Stacks ecosystem.
            </motion.p>
            <motion.button
              variants={ctaItemVariants}
              onClick={handleLaunchApp}
              disabled={isLoading}
              className="btn-primary-gradient inline-flex items-center gap-2 text-base px-7 py-3 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
