"use client";

import { useEffect, useRef, useState } from "react";

interface CounterProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  label: string;
  light?: boolean;
}

export function Counter({
  end,
  prefix = "",
  suffix = "",
  duration = 2000,
  label,
  light = false,
}: CounterProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="text-center">
      <div
        className={`text-3xl font-bold sm:text-4xl lg:text-5xl ${
          light ? "text-brand-dark" : "text-white"
        }`}
      >
        {prefix}
        {isVisible ? count.toLocaleString("pt-BR") : "0"}
        {suffix}
      </div>
      <div
        className={`mt-2 text-sm font-medium sm:text-base ${
          light ? "text-brand-primary" : "text-brand-accent"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
