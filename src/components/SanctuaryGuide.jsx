import { useEffect, useRef, useState } from 'react';
import { href } from '../router.js';
import { useMotion } from '../motion.js';
import WorldIcon from './WorldIcon.jsx';

const KEY = 'kunjal-sanctuary-guide-collapsed';
const COMPACT = '(max-width: 760px), (max-aspect-ratio: 5/4)';
function initiallyCollapsed() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved !== null) return saved === 'true';
  } catch { /* The guide also works when storage is unavailable. */ }
  return typeof window !== 'undefined' && window.matchMedia(COMPACT).matches;
}

export default function SanctuaryGuide({ section }) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const [open, setOpen] = useState(false);
  const motion = useMotion();
  const characterRef = useRef(null);
  const toggleRef = useRef(null);
  const restoreFocus = useRef(false);

  useEffect(() => { if (section) setOpen(false); }, [section]);
  useEffect(() => {
    if (!restoreFocus.current) return;
    (collapsed ? toggleRef.current : characterRef.current)?.focus({ preventScroll: true });
    restoreFocus.current = false;
  }, [collapsed]);

  const collapse = (next) => {
    try { localStorage.setItem(KEY, String(next)); } catch { /* Keep the choice for this visit. */ }
    restoreFocus.current = true;
    setOpen(false);
    setCollapsed(next);
  };
  const dismissMessage = () => {
    setOpen(false);
    characterRef.current?.focus({ preventScroll: true });
  };

  if (section) return null;
  return <aside className={'sanctuary-guide' + (collapsed ? ' sanctuary-guide--collapsed' : '')} data-motion={motion} aria-label="Mini Kunjal guide" onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); dismissMessage(); }
  }}>
    {collapsed ? <button className="sanctuary-guide__restore" type="button" ref={toggleRef} aria-label="Show Mini Kunjal guide" aria-expanded={false} onClick={() => collapse(false)}><WorldIcon name="star" size={22} /></button> : <>
      <button className="sanctuary-guide__character" type="button" ref={characterRef} aria-label="Ask Mini Kunjal about the Glasshouse" aria-expanded={open} aria-controls="sanctuary-guide-message" onClick={() => setOpen((value) => !value)}>
        <img src={import.meta.env.BASE_URL + 'world/mini-kunjal.webp'} alt="" draggable={false} width="128" height="190" />
      </button>
      <button className="sanctuary-guide__dismiss" type="button" aria-label="Hide Mini Kunjal guide" onClick={() => collapse(true)}>×</button>
      <div className="sanctuary-guide__message" id="sanctuary-guide-message" hidden={!open}>
        <p>My projects grow in the Glasshouse.<br />Want to see?</p>
        <div className="sanctuary-guide__actions"><a href={href('projects')} onClick={() => setOpen(false)}>Show me <span aria-hidden="true">✧</span></a><button type="button" onClick={dismissMessage}>Later</button></div>
      </div>
    </>}
  </aside>;
}
