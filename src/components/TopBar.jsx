import { href } from '../router.js';
import { setMotion, useMotion } from '../motion.js';
import WorldIcon from './WorldIcon.jsx';
export default function TopBar({ current }) {
  const motion = useMotion();
  return <header className="world-header">
    <a className="world-brand" href={href('')} aria-label="Kunjal — back to world"><WorldIcon size={25} /><span>Kunjal<span className="brand-period">.</span></span></a>
    <nav className="world-nav" aria-label="Main navigation">
      {[['', 'World'], ['projects', 'Projects'], ['research', 'Research'], ['creative', 'Creative'], ['contact', 'Contact']].map(([id, label]) => <a key={id} href={href(id)} aria-current={(current || '') === id ? 'page' : undefined}>{label}</a>)}
    </nav>
    <div className="world-header-actions">
      <button className="motion-toggle" type="button" aria-pressed={motion === 'reduced'} onClick={() => setMotion(motion === 'reduced' ? 'full' : 'reduced')} title={motion === 'reduced' ? 'Enable camera motion' : 'Reduce camera motion'}><span className="motion-toggle__dot" />{motion === 'reduced' ? 'Motion off' : 'Motion on'}</button>
      <a className="world-resume" href={href('resume')} aria-current={current === 'resume' ? 'page' : undefined}>Résumé <WorldIcon name="arrow" size={15} /></a>
    </div>
  </header>;
}
