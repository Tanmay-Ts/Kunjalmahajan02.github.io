export default function WorldIcon({ name = 'star', size = 20, ...props }) {
  const shapes = {
    star: <><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z" /><path d="M5 3v4M3 5h4" /></>,
    book: <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z" /><path d="M12 5v15M5 8h4M5 12h4M15 8h4M15 12h4" /></>,
    telescope: <><path d="m4 9 13-6 3 7-13 5-3-6ZM12 14l-4 8M12 14l5 8M12 14v8M3 10l-2 1 2 4 3-1" /><path d="m16 4 3 7" /></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.5 1.5 0 0 1 1-2.8H18c5 0 4-11.5-6-11.5Z" /><circle cx="7" cy="10" r="1" /><circle cx="11" cy="7" r="1" /><circle cx="16" cy="8" r="1" /><circle cx="6" cy="15" r="1" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    chevron: <path d="m5 9 7 7 7-7" />,
    moon: <path d="M20.7 13A9 9 0 0 1 11 3.3 9 9 0 1 0 20.7 13Z" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name] || shapes.star}</svg>;
}
