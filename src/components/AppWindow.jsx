import { useEffect, useRef } from 'react';
import { href } from '../router.js';
import { isReducedMotion } from '../motion.js';
import WorldIcon from './WorldIcon.jsx';
// A reading drawer in the landscape. Navigation stays available while reading.
export default function AppWindow({ file, title, crumb, back, tone = 'pink', children }) {
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const sectionName = { 'PROJECTS.EXE': 'Projects', 'RESEARCH.TXT': 'Research', 'CREATIVE.EXE': 'Creative', 'CONTACT.ME': 'Contact', 'RESUME.PDF': 'Résumé' }[file] || 'Explore';
  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0);
    const timer = window.setTimeout(() => titleRef.current?.focus({ preventScroll: true }), isReducedMotion() ? 0 : 350);
    const cancelFocus = () => clearTimeout(timer);
    const onKey = (e) => {
      if (e.key === 'Tab') cancelFocus();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', cancelFocus);
    document.addEventListener('focusin', cancelFocus);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', cancelFocus); document.removeEventListener('focusin', cancelFocus); };
  }, [file, crumb]);
  return <section className={'window-layer' + (crumb ? ' window-layer--detail' : '')} aria-labelledby="page-title">
    <div className={'window window--' + tone}>
      <header className="window__bar">
        <nav className="drawer-crumb" aria-label="Breadcrumb"><WorldIcon size={14} /><a href={href('')}>World</a><span aria-hidden="true">/</span><span>{sectionName}</span>{crumb && <><span aria-hidden="true">/</span><span className="drawer-crumb__detail">{crumb}</span></>}</nav>
        <span className="drawer-ornament" aria-hidden="true"><i /><WorldIcon size={14} /><i /></span>
        <a className="window__close" href={href('')} aria-label="Close contents and return to world">×</a>
      </header>
      <div className="window__body" ref={bodyRef}>
        {back && <a className="window__back" href={href(back.to)}><WorldIcon name="back" size={16} /> {back.label}</a>}
        <h1 id="page-title" className="window__title" tabIndex={-1} ref={titleRef}>{title}</h1>
        {children}
      </div>
    </div>
  </section>;
}
