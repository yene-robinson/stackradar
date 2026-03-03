import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TAB_PATHS = ['/dashboard', '/positions', '/yield', '/analytics'];
const MIN_DISTANCE = 50;
const MAX_TIME = 400;
const MAX_DRAG = 120;

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isDragging = useRef(false);
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);

  const getContentEl = useCallback(() => {
    return document.getElementById('main-content');
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const currentIndex = TAB_PATHS.indexOf(location.pathname);
    if (currentIndex === -1) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      startTime.current = Date.now();
      isDragging.current = false;
      directionLocked.current = null;

      const el = getContentEl();
      if (el) {
        el.style.transition = 'none';
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - startX.current;
      const deltaY = e.touches[0].clientY - startY.current;

      // Lock direction after 10px of movement
      if (!directionLocked.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        directionLocked.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }

      if (directionLocked.current !== 'horizontal') return;

      // Don't drag past bounds
      if (deltaX > 0 && currentIndex === 0) return;
      if (deltaX < 0 && currentIndex === TAB_PATHS.length - 1) return;

      isDragging.current = true;
      const clampedDelta = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
      const opacity = 1 - Math.abs(clampedDelta) / MAX_DRAG * 0.3;

      const el = getContentEl();
      if (el) {
        el.style.transform = `translateX(${clampedDelta}px)`;
        el.style.opacity = String(opacity);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const el = getContentEl();

      // Reset styles with spring-like transition
      if (el) {
        el.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease';
        el.style.transform = '';
        el.style.opacity = '';
      }

      if (directionLocked.current !== 'horizontal') return;

      const deltaX = e.changedTouches[0].clientX - startX.current;
      const deltaY = e.changedTouches[0].clientY - startY.current;
      const elapsed = Date.now() - startTime.current;

      if (Math.abs(deltaY) > Math.abs(deltaX)) return;
      if (Math.abs(deltaX) < MIN_DISTANCE || elapsed > MAX_TIME) return;

      let navigated = false;
      if (deltaX < 0 && currentIndex < TAB_PATHS.length - 1) {
        navigate(TAB_PATHS[currentIndex + 1]);
        navigated = true;
      } else if (deltaX > 0 && currentIndex > 0) {
        navigate(TAB_PATHS[currentIndex - 1]);
        navigated = true;
      }

      if (navigated && navigator.vibrate) {
        navigator.vibrate(10);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      // Clean up any lingering styles
      const el = getContentEl();
      if (el) {
        el.style.transform = '';
        el.style.opacity = '';
        el.style.transition = '';
      }
    };
  }, [location.pathname, navigate, getContentEl]);
}
