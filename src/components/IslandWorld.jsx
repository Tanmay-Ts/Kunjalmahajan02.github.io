import { useCallback, useEffect, useState } from 'react';
import { href } from '../router.js';
import { profile } from '../data/profile.js';
import IllustratedWorld from '../world/IllustratedWorld.jsx';
import { sanctuaryDestinations, sanctuaryDestinationById } from '../world/sanctuaryDestinations.js';
import WorldIcon from './WorldIcon.jsx';

export default function IslandWorld({ section, onArrival }) {
  const target = section || '';
  const [travel, setTravel] = useState({ section: target, state: 'travelling' });
  const [projected, setProjected] = useState({});
  const [unavailable, setUnavailable] = useState(false);
  const arrived = unavailable || (travel.section === target && travel.state === 'arrived');
  const destination = sanctuaryDestinationById[section === 'resume' ? 'contact' : section];
  const onTravelState = useCallback((event) => {
    if (event.section !== target) return;
    setTravel(event);
    if (event.state === 'arrived') onArrival(event.section);
  }, [target, onArrival]);
  useEffect(() => { if (unavailable) onArrival(target); }, [unavailable, target, onArrival]);

  return <section className={'island-world sanctuary-world' + (unavailable ? ' island-world--unavailable' : '')} aria-label="A sanctuary of floating islands. Choose an island to step inside." data-destination={target || 'world'} data-camera-state={arrived ? 'arrived' : 'travelling'}>
    {!section && <header className="sanctuary-hero">
      <p className="sanctuary-hi">hi, I’m</p>
      <h1 id="world-title" tabIndex={-1}>Kunjal <span>Mahajan</span></h1>
      <p className="sanctuary-role">{profile.headline}</p>
      <p className="sanctuary-tagline">{profile.tagline}</p>
      {unavailable && <p className="sanctuary-fallback-note">The landscape could not load. Every project and note is still available below.</p>}
    </header>}
    <div className="sanctuary-scene">
      <IllustratedWorld section={section} onTravelState={onTravelState} onProjection={setProjected} onUnavailable={setUnavailable} />
      {!section && arrived && !unavailable && <nav className="sanctuary-pins" aria-label="Visit an island">
        {sanctuaryDestinations.map((item) => {
          const anchor = projected[item.id];
          if (!anchor?.visible) return null;
          return <a key={item.id} id={'island-' + item.id} className="sanctuary-pin" data-mode={anchor.mode || item.mode} href={href(item.id)} style={{ left: anchor.x, top: anchor.y }} aria-label={item.name + ' — ' + item.place}>
            <span className="sanctuary-pin__kind">{item.name}</span>
            <span className="sanctuary-pin__name">{item.place}</span>
            <i aria-hidden="true" />
          </a>;
        })}
      </nav>}
      {!section && arrived && <p className="sanctuary-hint">Choose an island to step inside</p>}
    </div>
    {!section && <>
      <nav className="sanctuary-compass" id="compass" aria-label="Islands">
        {sanctuaryDestinations.map(item => <a key={item.id} id={unavailable ? 'island-' + item.id : undefined} href={href(item.id)}>
          <em>{item.place}</em><span>{item.name}</span><small>{item.caption}</small>
        </a>)}
      </nav>
      <p className="sanctuary-attribution">Kunjal Mahajan · Thane, Mumbai</p>
    </>}
    {section && !arrived && <a className="sanctuary-flight-back" href={href('')}><WorldIcon name="back" size={17} /> Return to the sky</a>}
    {!arrived && <div className="sanctuary-travel-status" role="status" aria-live="polite"><span className="sanctuary-travel-star" aria-hidden="true">✧</span>{section ? 'Approaching ' + (destination?.place.toLowerCase() || 'a quiet corner') + '…' : 'Opening the sanctuary…'}</div>}
  </section>;
}
