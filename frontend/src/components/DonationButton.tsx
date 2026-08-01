import { useState, useEffect, useCallback, CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { DonationModal } from './DonationModal';
import { burstConfetti } from '../lib/confetti';
import pinImg from '../../assets/donation-pin.png';

export function DonationButton() {
  const { pathname } = useLocation();
  const [open,     setOpen]     = useState(false);
  const [swinging, setSwinging] = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (pathname.startsWith('/overlay')) return;

    let outer: ReturnType<typeof setTimeout>;
    let inner: ReturnType<typeof setTimeout>;

    function schedule() {
      outer = setTimeout(() => {
        setSwinging(true);
        inner = setTimeout(() => setSwinging(false), 700);
        schedule();
      }, 8000 + Math.random() * 4000);
    }

    schedule();
    return () => { clearTimeout(outer); clearTimeout(inner); };
  }, [pathname]);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    setRotation(parseFloat((Math.random() * 6 - 3).toFixed(1)));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  if (pathname.startsWith('/overlay')) return null;

  const btnStyle = { '--pin-rot': `${rotation}deg` } as CSSProperties;
  const swingClass = swinging && !hovered ? ' donation-pin--swinging' : '';

  return (
    <>
      <button
        className={`donation-pin${swingClass}`}
        style={btnStyle}
        onClick={e => {
          const r = e.currentTarget.getBoundingClientRect();
          burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
          setOpen(true);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Apoie o desenvolvedor — clique para saber mais"
        title="Apoie o desenvolvedor"
        type="button"
      >
        <img
          src={pinImg}
          alt=""
          width={132}
          height={132}
          draggable={false}
        />
      </button>
      {open && <DonationModal onClose={() => setOpen(false)} />}
    </>
  );
}
