import { useEffect, useRef, useState } from 'react';

export function useValueFlash(value: string | number) {
  const [flashing, setFlashing] = useState(false);
  const prevValue = useRef(value);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      prevValue.current = value;
      return;
    }
    if (prevValue.current !== value) {
      prevValue.current = value;
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return flashing;
}
