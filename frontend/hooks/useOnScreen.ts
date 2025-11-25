
import { useState, useEffect, useRef } from 'react';

interface UseOnScreenOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

// Custom hook for Intersection Observer
const useOnScreen = (options: UseOnScreenOptions) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (options.triggerOnce && ref.current) {
            observer.unobserve(ref.current);
        }
      } else {
        if (!options.triggerOnce) {
          setIsVisible(false);
        }
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, options.threshold, options.root, options.rootMargin, options.triggerOnce]);

  return [ref, isVisible] as const;
};

export default useOnScreen;
