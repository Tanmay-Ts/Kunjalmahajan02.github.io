import { useState } from 'react';
import { href } from '../router.js';
import WorldIcon from './WorldIcon.jsx';
import WorldAtmosphere from './WorldAtmosphere.jsx';
const BASE = import.meta.env.BASE_URL;
const destinations = [
  { id: 'research', name: 'Research', icon: 'book', caption: 'The glass library', x: '31%', y: '45%' },
  { id: 'projects', name: 'Projects', icon: 'telescope', caption: 'The observatory', x: '61%', y: '25%' },
  { id: 'creative', name: 'Creative', icon: 'palette', caption: 'The garden pavilion', x: '87%', y: '31%' },
];
export default function IslandWorld({ section }) {
  const [artFailed, setArtFailed] = useState(false);
  return (
    <section className="island-world" aria-label="Kunjal’s floating world" data-destination={section || 'world'}>
      <div className="island-camera" aria-hidden="true">
        <div className="island-artboard"><img className="island-landscape" src={BASE + 'world/islands.webp'} alt="" fetchpriority="high" onError={() => setArtFailed(true)} /><WorldAtmosphere variant="world" active={section !== 'research'} /></div>
      </div>
      <img className="library-interior" src={BASE + 'world/library.webp'} alt="" aria-hidden="true" />
      <div className="library-aura" aria-hidden="true"><WorldAtmosphere variant="library" active={section === 'research'} /></div>
      <div className="world-atmosphere" aria-hidden="true" />
      {!section && <>
        <div className="world-intro">
          <span className="world-eyebrow"><span /> WELCOME TO MY LITTLE UNIVERSE</span>
          <h1 id="world-title" tabIndex={-1}>A world of <br />curiosity<span>.</span></h1>
          <p>Part engineer, part artist. <br />Always exploring.</p>
        </div>
        <div className="island-targets"><div className="island-artboard">
          {destinations.map((d) => <a key={d.id} id={'island-' + d.id} className={'island-pin island-pin--' + d.id} href={href(d.id)} style={{ '--x': d.x, '--y': d.y }} aria-label={d.name + ' — enter ' + d.caption.toLowerCase()}>
            <span className="island-pin__label"><WorldIcon name={d.icon} size={19} />{d.name}<WorldIcon name="arrow" size={15} /></span>
            <span className="island-pin__line" aria-hidden="true" /><span className="island-pin__dot" aria-hidden="true" />
          </a>)}
        </div></div>
        <div className="world-identity"><WorldIcon size={28} /><div><strong>Kunjal Mahajan</strong><span>AI &amp; Data Science Engineer</span></div></div>
        <div className="world-invitation"><span>Choose an island. Follow your curiosity.</span><WorldIcon name="chevron" size={18} /></div>
        <nav className="world-mobile-destinations" aria-label="Explore the islands">
          {destinations.map((d) => <a key={d.id} href={href(d.id)}><WorldIcon name={d.icon} /><strong>{d.name}</strong><span>{d.caption}</span></a>)}
        </nav>
        {artFailed && <p className="world-image-note">The view couldn’t load. You can still explore every island using the navigation.</p>}
      </>}
      {section && <>
        <a className="world-return" href={href('')}><WorldIcon name="back" size={18} />Back to world</a>
        <span className="world-location"><WorldIcon name={destinations.find((d) => d.id === section)?.icon || 'star'} size={16} />{destinations.find((d) => d.id === section)?.caption || 'A little closer'}</span>
      </>}
    </section>
  );
}
