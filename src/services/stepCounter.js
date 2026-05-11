import { todaySteps } from '../store/signals';

const STEPS_PER_METER = 1.4;
let useDeviceMotion = false;
let stepBuffer = 0;
let lastAccelMag = 0;
let stepThreshold = 1.2;
let lastStepTime = 0;

export function initStepCounter() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(state => {
      if (state === 'granted') startMotionListener();
    }).catch(() => {});
  } else if ('DeviceMotionEvent' in window) {
    startMotionListener();
  }
}

function startMotionListener() {
  window.addEventListener('devicemotion', onMotion);
  useDeviceMotion = true;
}

function onMotion(e) {
  const acc = e.accelerationIncludingGravity;
  if (!acc || acc.x === null) return;

  const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  const delta = Math.abs(mag - lastAccelMag);
  lastAccelMag = mag;

  const now = Date.now();
  if (delta > stepThreshold && now - lastStepTime > 250) {
    lastStepTime = now;
    stepBuffer++;
    if (stepBuffer >= 3) {
      todaySteps.value = todaySteps.value + stepBuffer;
      persistSteps();
      stepBuffer = 0;
    }
  }
}

export function countStep(distMeters) {
  if (useDeviceMotion) return;
  const steps = Math.round(distMeters * STEPS_PER_METER);
  todaySteps.value = todaySteps.value + steps;
  persistSteps();
}

function persistSteps() {
  localStorage.setItem('fp_today_steps', String(todaySteps.value));
  localStorage.setItem('fp_today_steps_date', new Date().toISOString().slice(0, 10));
}
