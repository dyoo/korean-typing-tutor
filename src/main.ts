import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

// Clean up any stale coi-serviceworker registration left over from previous deployments
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      if (reg.active && reg.active.scriptURL.includes('coi-serviceworker')) {
        reg.unregister();
      }
    }
  });
}

const target = document.getElementById('app');
if (!target) {
  throw new Error('Target element #app not found');
}

const app = mount(App, {
  target,
});

export default app;
