import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, lazy, Suspense, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { CommandPalette } from "./components/CommandPalette";
import { AddPositionModal } from "./components/modals/AddPositionModal";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { PageLoader } from "./components/PageLoader";
import { WalletProvider, useWallet } from "./hooks/useStacksWallet";
import { useSwipeNavigation } from "./hooks/useSwipeNavigation";

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Positions = lazy(() => import('./pages/Positions'));
const PositionDetail = lazy(() => import('./pages/PositionDetail'));
const Yield = lazy(() => import('./pages/Yield'));
const Analytics = lazy(() => import('./pages/Analytics'));

const queryClient = new QueryClient();

function AppInner() {
  const [addPositionOpen, setAddPositionOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const { connect } = useWallet();
  useSwipeNavigation();

  // Handler for connecting wallet - uses direct Stacks popup
  const handleConnectWallet = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet');
    }
  }, [connect]);

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      <CommandPalette onConnectWallet={handleConnectWallet} onAddPosition={() => setAddPositionOpen(true)} />
      <AddPositionModal open={addPositionOpen} onOpenChange={setAddPositionOpen} />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <motion.div
            id="main-content"
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Routes location={location}>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard onOpenAddPosition={() => setAddPositionOpen(true)} onConnectWallet={handleConnectWallet} />} />
              <Route path="/positions" element={<Positions onConnectWallet={handleConnectWallet} />} />
              <Route path="/positions/:id" element={<PositionDetail />} />
              <Route path="/yield" element={<Yield onConnectWallet={handleConnectWallet} />} />
              <Route path="/analytics" element={<Analytics onConnectWallet={handleConnectWallet} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
      {!isLanding && <MobileBottomNav />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
