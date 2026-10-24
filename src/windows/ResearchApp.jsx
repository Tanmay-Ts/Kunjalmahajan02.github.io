import { useEffect, useState } from 'react';
import { topics, topicById, fields } from '../data/research.js';
import { projectById } from '../data/projects.js';
import { href, useDocumentTitle } from '../router.js';
import AppWindow from '../components/AppWindow.jsx';

// These are interests and working notes. Published work appears only when
// the corresponding papers or notes arrays contain real entries.
export default function ResearchApp({ topicId }) {
  const topic = topicById[topicId];
  const [selectedField, setSelectedField] = useState(() => topic?.field || 'ai');
  useDocumentTitle(topic ? topic.short : 'Research');

  useEffect(() => {
    if (topic) setSelectedField(topic.field);
  }, [topic]);

  if (topic) {
    return (
      <AppWindow file="RESEARCH.TXT" crumb={topic.short} title={topic.name} back={{ to: 'research', label: 'All topics' }} tone="lilac">
        <article className="research-detail">
          <p className="research-kicker">{fields.find((field) => field.id === topic.field)?.name} · Working notes</p>
          <p className="research-detail__lead">{topic.why}</p>
          <section className="research-section" aria-labelledby="r-exploring">
            <h2 id="r-exploring">What I’m exploring</h2>
            <ul className="research-notes">
              {topic.exploring.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <div className="research-detail__columns">
            <section className="research-section" aria-labelledby="r-projects">
              <h2 id="r-projects">Where it shows up</h2>
              {topic.projects.length ? (
                <ul className="research-links">
                  {topic.projects.map((id) => (
                    <li key={id}>
                      <a href={href(`projects/${id}`)}>{projectById[id].name}<span aria-hidden="true">↗</span></a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="research-note">No project of mine uses this yet — it’s on the reading list.</p>
              )}
            </section>
            <section className="research-section" aria-labelledby="r-related">
              <h2 id="r-related">Connected topics</h2>
              <ul className="research-links">
                {topic.related.map((id) => (
                  <li key={id}>
                    <a href={href(`research/${id}`)}>{topicById[id].short}<span aria-hidden="true">→</span></a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <Papers topic={topic} />
        </article>
      </AppWindow>
    );
  }

  const fieldTopics = topics.filter((item) => item.field === selectedField);
  const fieldName = fields.find((field) => field.id === selectedField)?.name;

  return (
    <AppWindow file="RESEARCH.TXT" title="What I’m reading & exploring" tone="lilac">
      <div className="research-overview">
        <div className="research-intro">
          <p>Interests &amp; working notes · not published research</p>
        </div>
        <div className="research-toolbar">
          <div className="research-filters" role="group" aria-label="Filter research topics">
            {fields.map((field) => (
              <button key={field.id} type="button" aria-pressed={selectedField === field.id} aria-controls="research-topics" onClick={() => setSelectedField(field.id)}>
                <TopicIcon id={field.id === 'ai' ? 'deep' : 'drake'} />
                {field.name}
              </button>
            ))}
          </div>
          <span className="research-count" aria-live="polite">{fieldTopics.length} topics to explore</span>
        </div>
        <ul id="research-topics" className="research-grid" aria-label={`${fieldName} topics`}>
          {fieldTopics.map((item) => (
            <li key={item.id}>
              <a className={`research-topic research-topic--${item.field}`} href={href(`research/${item.id}`)}>
                <span className="research-topic__icon"><TopicIcon id={item.id} /></span>
                <h2>{item.short}</h2>
                <p>{excerpt(item.why)}</p>
                <span className="research-topic__link">Explore notes <span aria-hidden="true">→</span></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </AppWindow>
  );
}

function excerpt(text) {
  if (text.length <= 135) return text;
  const boundary = text.lastIndexOf(' ', 132);
  return `${text.slice(0, boundary).replace(/[.,;:—-]$/, '').trim()}…`;
}

function Papers({ topic }) {
  if (!topic.papers.length && !topic.notes.length) {
    return <p className="research-empty">No papers or write-ups here yet — they’ll appear as I publish them.</p>;
  }
  return (
    <section className="research-section" aria-labelledby="r-papers">
      <h2 id="r-papers">Papers &amp; notes</h2>
      <ul className="research-links">
        {[...topic.papers, ...topic.notes].map((paper) => (
          <li key={paper.href}>
            <a href={paper.href} target="_blank" rel="noreferrer">
              <span>{paper.title}{paper.venue && ` — ${paper.venue}`}</span><span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TopicIcon({ id }) {
  const drawings = {
    vision: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="3" /></>,
    deep: <><path d="m6 5 6 7m6-7-6 7m-6 7 6-7 6 7M6 5h12M6 19h12" /><circle cx="6" cy="5" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    nlp: <><path d="M4 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4V4Zm3 4h7m-7 4h4M18 8h2v12l-4-2h-4" /></>,
    speech: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8" /></>,
    data: <><path d="M4 3v17h17M8 15l4-5 4 2 5-7M8 20v-2m4 2v-6m4 6v-4m4 4v-9" /></>,
    hci: <><circle cx="12" cy="4" r="2" /><path d="m4 8 8 2 8-2m-8 2v5m0 0-5 7m5-7 5 7" /></>,
    drake: <><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-35 12 12)" /><path d="m18 2 .5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5Z" /></>,
    fermi: <><path d="M7 18a7 7 0 1 1 10 0m-8 3h6m-3-5v-1c0-2 3-2 3-4a3 3 0 0 0-6 0" /><circle cx="12" cy="18" r=".6" /></>,
    wormholes: <><ellipse cx="5" cy="12" rx="3" ry="8" /><ellipse cx="19" cy="12" rx="3" ry="8" /><path d="M5 4c7 10 7 10 14 0M5 20c7-10 7-10 14 0M5 8c6 4 8 4 14 0M5 16c6-4 8-4 14 0" /></>,
    ftl: <><path d="m13 2-8 12h6l-1 8 9-13h-6l1-7M2 6h4M1 18h4m14 0h4" /></>,
    blackholes: <><circle cx="12" cy="12" r="4" /><path d="M3 10a9 9 0 0 1 17-3M21 14a9 9 0 0 1-17 3" /><ellipse cx="12" cy="12" rx="11" ry="3" transform="rotate(-25 12 12)" /></>,
    relativity: <><path d="M3 5c6 0 5 14 9 14S16 5 21 5M3 11c6 0 5 10 9 10s4-10 9-10M3 17c4 0 5 5 9 5s5-5 9-5M6 3v17m12-17v17" /><circle cx="12" cy="7" r="2" /></>,
    darkmatter: <><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="9" strokeDasharray="2 4" /><path d="m12 2 1 2-1 2-1-2Zm8 15 1 2-1 2-1-2ZM3 11l1 2-1 2-1-2Z" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {drawings[id] || drawings.drake}
    </svg>
  );
}
