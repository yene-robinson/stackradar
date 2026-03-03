import { useState, useEffect, useCallback } from 'react';

export function useSimulatedLoading(duration = 800) {
  const [isLoading, setIsLoading] = useState(true);

  const triggerRefresh = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return { isLoading, triggerRefresh };
}
