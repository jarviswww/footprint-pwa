import { render } from 'preact';
import { App } from './app';
import { startTracking } from './services/tracker';
import { initTrackOnColdStart } from './services/trackSegment';
import { db } from './db/index';
import './styles/global.css';

async function init() {
  await db.open();
  await initTrackOnColdStart();
  startTracking();
}

render(<App />, document.getElementById('root'));
init();
