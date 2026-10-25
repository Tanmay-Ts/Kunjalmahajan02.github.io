import { useEffect, useRef } from 'react';
import { href } from '../router.js';
import { isReducedMotion } from '../motion.js';

const ROOMS = {
  'PROJECTS.EXE': { id: 'projects', name: 'Projects', title: 'The Glasshouse', blurb: 'Things I’ve grown, built and tended.' },
  'RESEARCH.TXT': { id: 'research', name: 'Research', title: 'The Observatory', blurb: 'What I’m reading & looking up at.' },
  'CREATIVE.EXE': { id: 'creative', name: 'Creative', title: 'The Pavilion', blurb: 'Dance, art & the stage.' },
  'CONTACT.ME': { id: 'contact', name: 'Contact', title: 'The Post Garden', blurb: 'Letters, résumé & ways to say hi.' },
  'RESUME.PDF': { id: 'resume', name: 'Résumé', title: 'Résumé' },
};
const ROOM_LINKS = [
  ['projects', 'Glasshouse'],
  ['research', 'Observatory'],
  ['creative', 'Pavilion'],
  ['contact', 'Post Garden'],
];

// The painting remains visible and the room navigation stays available.
// App controls camera arrival; this component only presents the reading surface.
export default function AppWindow({ file, title, crumb, back, tone = 'pink', children }) {
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const room = ROOMS[file] || { id: 'explore', name: 'Explore', title };
  const detail = Boolean(crumb) || room.id === 'resume' || room.id === 'explore';
  const heading = detail ? title : room.title;

  useEffect(() => {
    const body = bodyRef.current;
    body?.scrollTo(0, 0);
    const timer = window.setTimeout(() => titleRef.current?.focus({ preventScroll: true }), isReducedMotion() ? 0 : 350);
    const cancelFocus = () => clearTimeout(timer);
    document.addEventListener('keydown', cancelFocus);
    document.addEventListener('pointerdown', cancelFocus);
    document.addEventListener('focusin', cancelFocus);
    body?.addEventListener('wheel', cancelFocus, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', cancelFocus);
      document.removeEventListener('pointerdown', cancelFocus);
      document.removeEventListener('focusin', cancelFocus);
      body?.removeEventListener('wheel', cancelFocus);
    };
  }, [file, crumb]);

  return (
    <section
      className={`window-layer sanctuary-panel${detail ? ' window-layer--detail' : ''}`}
      data-room={room.id}
      data-view={detail ? 'detail' : 'overview'}
      aria-labelledby="page-title"
    >
      <header className="sanctuary-room-bar">
        <a className="sanctuary-sky-link" href={href('')}><span aria-hidden="true">←</span> To the sky</a>
        <nav className="sanctuary-room-nav" aria-label="Sanctuary rooms">
          {ROOM_LINKS.map(([id, label]) => (
            <a key={id} href={href(id)} aria-current={room.id === id ? 'page' : undefined}>{label}</a>
          ))}
        </nav>
      </header>
      <div className={`window window--${tone} sanctuary-room-content`}>
        <div className="window__body" ref={bodyRef}>
          {back && <a className="window__back" href={href(back.to)}><span aria-hidden="true">←</span> {back.label}</a>}
          <header className="sanctuary-stage-head">
            <p className="sanctuary-eyebrow">{room.name}{detail && crumb ? ' · Working folio' : ''}</p>
            <h1 id="page-title" className="window__title" tabIndex={-1} ref={titleRef}>{heading}</h1>
            {!detail && room.blurb && <p className="sanctuary-blurb">{room.blurb}</p>}
          </header>
          <div className="sanctuary-room-children">{children}</div>
        </div>
      </div>
    </section>
  );
}
