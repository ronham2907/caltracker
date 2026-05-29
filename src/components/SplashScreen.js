import React, { useEffect, useState } from 'react';
import Logo from './Logo';

export default function SplashScreen({ onDone }) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 1600);
    const t2 = setTimeout(onDone, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`splash-screen${hiding ? ' hiding' : ''}`}>
      <div className="splash-logo-wrap">
        <Logo size={88} />
      </div>
      <div className="splash-name">FitForge</div>
      <div className="splash-tagline">Train Smarter. Eat Better. Live Strong.</div>
    </div>
  );
}
