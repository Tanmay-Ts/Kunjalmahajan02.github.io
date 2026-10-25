import { useCallback, useEffect, useState } from 'react';
import { href } from '../router.js';
import WorldScene from '../world/WorldScene.jsx';
import WorldIcon from './WorldIcon.jsx';

const destinations = [
  { id: 'research', name: 'Research', icon: 'book', caption: 'The glass library', journey: 'Entering the glass library…' },
  { id: 'projects', name: 'Projects', icon: 'telescope', caption: 'The observatory', journey: 'Approaching the observatory…' },
  { id: 'creative', name: 'Creative', icon: 'palette', caption: 'The garden pavilion', journey: 'Visiting the garden pavilion…' },
];

export default function IslandWorld({ section, onArrival }) {
  const target = section || '';
  const [travel, setTravel] = useState({ section: target, state: 'travelling' });
  const [projected, setProjected] = useState({});
  const [unavailable, setUnavailable] = useState(false);
  const arrived = unavailable || (travel.section === target && travel.state === 'arrived');
  const destination = destinations.find((item) => item.id === section);
  const onTravelState = useCallback((event) => {
    if (event.section !== target) return;
    setTravel(event);
    if (event.state === 'arrived') onArrival(event.section);
  }, [target, onArrival]);

  // Navigation and all portfolio content remain available without WebGL.
  useEffect(() => {
    if (unavailable) onArrival(target);
  }, [unavailable, target, onArrival]);

  return (
    <section className={'island-world' + (unavailable ? ' island-world--unavailable' : '')} aria-label="Kunjal’s floating world" data-destination={target || 'world'} data-camera-state={arrived ? 'arrived' : 'travelling'}>
      <WorldScene section={section} onTravelState={onTravelState} onProjection={setProjected} onUnavailable={setUnavailable} />
      {!section && <>
        <div className="world-intro">
          <span className="world-eyebrow"><span /> WELCOME TO MY LITTLE UNIVERSE</span>
          <h1 id="world-title" tabIndex={-1}>{unavailable ? 'Explore the portfolio' : <>A world of <br />curiosity<span>.</span></>}</h1>
          <p>{unavailable ? 'The 3D world is unavailable in this browser. Every project, research note, and creative work is still here.' : <>Part engineer, part artist. <br />Always exploring.</>}</p>
        </div>
        {arrived && !unavailable && <nav className="island-targets" aria-label="Visit an island">
          {destinations.map((item) => {
            const anchor = projected[item.id];
            if (!anchor?.visible) return null;
            return <a key={item.id} id={'island-' + item.id} className={'island-pin island-pin--' + item.id} href={href(item.id)} style={{ left: anchor.x, top: anchor.y }} aria-label={item.name + ' — enter ' + item.caption.toLowerCase()}>
              <span className="island-pin__label"><WorldIcon name={item.icon} size={18} />{item.name}<WorldIcon name="arrow" size={14} /></span>
              <span className="island-pin__line" aria-hidden="true" /><span className="island-pin__dot" aria-hidden="true" />
            </a>;
          })}
        </nav>}
        <div className="world-identity"><WorldIcon size={25} /><div><strong>Kunjal Mahajan</strong><span>AI &amp; Data Science Engineer</span></div></div>
        {arrived && <>
          <div className="world-invitation"><span>Choose an island. Follow your curiosity.</span><small>Drag to look around · Scroll to zoom</small></div>
          <nav className="world-mobile-destinations" aria-label="Explore the portfolio">
            {destinations.map((item) => <a key={item.id} id={unavailable ? 'island-' + item.id : undefined} href={href(item.id)}><WorldIcon name={item.icon} /><strong>{item.name}</strong><span>{item.caption}</span></a>)}
          </nav>
        </>}
      </>}
      {section && <>
        <a className="world-return" href={href('')}><WorldIcon name="back" size={18} />Back to world</a>
        {arrived && <span className="world-location"><WorldIcon name={destination?.icon || 'star'} size={16} />{destination?.caption || 'A little closer'}</span>}
      </>}
      {!arrived && <div className="world-travel-status" role="status" aria-live="polite"><WorldIcon name={destination?.icon || 'star'} size={18} /><span>{section ? destination?.journey || 'Finding a quiet corner…' : 'Returning to the islands…'}</span>{section && <small>Esc to return</small>}</div>}
    </section>
  );
}
