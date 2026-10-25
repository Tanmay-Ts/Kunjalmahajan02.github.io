import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/caveat/600.css';
import '@fontsource-variable/manrope';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource-variable/jost';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/site.css';
import './styles/widgets.css';
import './styles/world.css';
import './styles/research.css';
import './styles/sanctuary.css';
import './styles/sanctuary-guide.css';
import './styles/sanctuary-panels.css';
import App from './App.jsx';
import { initMotion } from './motion.js';

initMotion();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
