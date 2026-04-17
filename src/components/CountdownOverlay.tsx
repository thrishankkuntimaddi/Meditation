import React, { useEffect, useState } from 'react';

interface Props {
  count: number; // 3 → 2 → 1 → 0 (start)
}

const CountdownOverlay: React.FC<Props> = ({ count }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (count === 0) {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
    setVisible(true);
  }, [count]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(250,250,249,0.96)' }}
    >
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <span
          className="font-light text-stone-300 tracking-widest uppercase text-sm"
          style={{ letterSpacing: '0.3em' }}
        >
          Beginning in
        </span>
        <span
          key={count}
          className="font-thin text-stone-600 animate-slide-up"
          style={{ fontSize: 96, lineHeight: 1, transition: 'all 0.3s' }}
        >
          {count === 0 ? '✦' : count}
        </span>
      </div>
    </div>
  );
};

export default CountdownOverlay;
