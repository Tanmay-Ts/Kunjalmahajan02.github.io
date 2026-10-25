import { href } from '../router.js';
import { setMotion, useMotion } from '../motion.js';
import WorldIcon from './WorldIcon.jsx';
export default function TopBar({ current }) {
  const motion = useMotion();
  return <header className={'sanctuary-tools' + (current ? ' sanctuary-tools--inside' : '')} aria-label="Sanctuary controls">
    <a className="sanctuary-resume" href={href('resume')} aria-current={current === 'resume' ? 'page' : undefined}>Résumé <WorldIcon name="arrow" size={12} /></a>
    <button className="sanctuary-motion" type="button" aria-pressed={motion === 'reduced'} onClick={() => setMotion(motion === 'reduced' ? 'full' : 'reduced')} title={motion === 'reduced' ? 'Enable camera and landscape motion' : 'Reduce camera and landscape motion'}><WorldIcon size={13} /><span>{motion === 'reduced' ? 'Motion off' : 'Motion on'}</span></button>
  </header>;
}
