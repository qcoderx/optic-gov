import { useState, useEffect } from 'react';
import { useInView } from '@/hooks/useInView';

interface TypewriterOnViewProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}

export const TypewriterOnView = ({ 
  text, 
  delay = 0, 
  speed = 50,
  className = ''
}: TypewriterOnViewProps) => {
  const { ref, isInView } = useInView(0.3);
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (isInView && !started) {
      setStarted(true);
    }
  }, [isInView, started]);

  useEffect(() => {
    if (!started) return;
    
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, currentIndex === 0 ? delay : speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, delay, speed, started]);

  return (
    <span ref={ref} className={className}>
      {displayText}
      {started && currentIndex < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
};