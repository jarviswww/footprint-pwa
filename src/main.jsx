import { render } from 'preact';
import { App } from './app';
import { startTracking } from './services/tracker';
import { initTrackOnColdStart } from './services/trackSegment';
import { startWeatherPolling } from './services/weather';
import { startStayDetection } from './services/stayDetector';
import { startKeepalive } from './services/keepalive';
import { startTrackUpdater } from './services/trackUpdater';
import { recalcTripsFromPoints } from './services/tripCounter';
import { initStepCounter } from './services/stepCounter';
import { db } from './db/index';
import './styles/global.css';

async function init() {
  await db.open();
  await initTrackOnColdStart();
  recalcTripsFromPoints();
  startTracking();
  startWeatherPolling();
  startStayDetection();
  startKeepalive();
  startTrackUpdater();
  initStepCounter();
}

render(<App />, document.getElementById('root'));
init();
