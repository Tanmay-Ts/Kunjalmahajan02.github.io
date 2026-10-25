import { useCallback, useEffect, useRef, useState } from 'react';
import { go, href, useDocumentTitle, useRoute } from './router.js';
import { projectById } from './data/projects.js';
import { topicById } from './data/research.js';
import TopBar from './components/TopBar.jsx';
import IslandWorld from './components/IslandWorld.jsx';
import AppWindow from './components/AppWindow.jsx';
import ProjectsApp from './windows/ProjectsApp.jsx';
import ResearchApp from './windows/ResearchApp.jsx';
import CreativeApp from './windows/CreativeApp.jsx';
import ContactApp from './windows/ContactApp.jsx';
import ResumeApp from './windows/ResumeApp.jsx';
const ALIASES = { universe: '', lab: 'projects', inventor: 'projects', archive: 'projects', observatory: 'research', garden: 'research', system: 'research', daydream: 'creative', about: 'contact' };
function resolve([section, sub, third]) {
  if (section === 'research' && sub === 'map') return ['research', third];
  if (section in ALIASES) {
    const to = ALIASES[section];
    if (!to) return [];
    return [to, ['lab', 'inventor', 'archive', 'observatory'].includes(section) ? sub : undefined];
  }
  return [section, sub];
}
function windowFor([section, sub]) {
  switch (section) {
    case undefined: return null;
    case 'projects': return sub && !projectById[sub] ? <NotFound /> : <ProjectsApp project={projectById[sub]} />;
    case 'research': return sub && !topicById[sub] ? <NotFound /> : <ResearchApp topicId={sub} />;
    case 'creative': return <CreativeApp />;
    case 'contact': return <ContactApp />;
    case 'resume': return <ResumeApp />;
    default: return <NotFound />;
  }
}
function NotFound() {
  useDocumentTitle('Not found');
  return <AppWindow file="ERROR.TXT" title="An undiscovered corner" tone="lilac"><p className="window__lead">This path hasn’t been mapped. Choose another island to keep exploring.</p><a className="btn" href={href('')}>Back to the world</a></AppWindow>;
}
export default function App() {
  const raw = useRoute();
  const route = resolve(raw);
  const [section] = route;
  const target = section || '';
  // Arrival belongs to a particular journey. Revisiting a section while another
  // flight is being cancelled must never briefly reveal an earlier drawer.
  const journey = useRef({ section: target, serial: 0 });
  if (journey.current.section !== target) {
    journey.current = { section: target, serial: journey.current.serial + 1 };
  }
  const serial = journey.current.serial;
  const [arrival, setArrival] = useState(null);
  const arrived = arrival?.section === target && arrival.serial === serial;
  const onArrival = useCallback((arrivedSection) => {
    if (journey.current.section !== arrivedSection || journey.current.serial !== serial) return;
    setArrival({ section: arrivedSection, serial });
  }, [serial]);
  const win = arrived ? windowFor(route) : null;
  useEffect(() => {
    if (raw[0] in ALIASES || (raw[0] === 'research' && raw[1] === 'map')) window.history.replaceState(null, '', href(route.filter(Boolean).join('/')));
  }, [raw, route]);
  const lastIsland = useRef(section);
  useEffect(() => {
    if (section) { lastIsland.current = section; return; }
    document.title = 'Kunjal — A Little World of Curiosity';
    if (arrived && lastIsland.current) {
      (document.getElementById('island-' + lastIsland.current) || document.getElementById('world-title'))?.focus({ preventScroll: true });
      lastIsland.current = undefined;
    }
  }, [section, arrived]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && section) {
        event.preventDefault();
        go('');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [section]);
  const skipToContent = (e) => {
    e.preventDefault();
    (document.getElementById('page-title') ?? document.getElementById('world-title') ?? document.getElementById('main'))?.focus();
  };
  return <div className="universe-app" data-section={section || 'world'}>
    <a className="skip-link" href="#main" onClick={skipToContent}>Skip to content</a>
    <TopBar current={section} />
    <main id="main" tabIndex={-1} className="world-main"><IslandWorld section={section} onArrival={onArrival} />{win}</main>
    <footer className="world-footer"><span>A LITTLE WORLD, A LOT TO EXPLORE</span><span>Made with curiosity in Thane, Mumbai <span aria-hidden="true">✧</span></span></footer>
  </div>;
}
