import { render } from 'preact';
import { App } from './app';
import { startTracking } from './services/tracker';
import { initTrackOnColdStart } from './services/trackSegment';
import { startWeatherPolling } from './services/weather';
import { startStayDetection } from './services/stayDetector';
import { startKeepalive } from './services/keepalive';
import { db } from './db/index';
import './styles/global.css';

async function init() {
  await db.open();
  await initTrackOnColdStart();
  startTracking();
  startWeatherPolling();
  startStayDetection();
  startKeepalive();
}

render(<App />, document.getElementById('root'));
init();
