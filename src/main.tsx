import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

async function setupServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    // Evict any legacy vite-plugin-pwa dev-sw.js registrations that intercepted navigations
    const existing = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      existing.map(async (reg) => {
        const scriptUrl =
          reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
        if (scriptUrl.includes('dev-sw.js')) {
          await reg.unregister().catch(() => {});
        }
      })
    );

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    void registration.update().catch(() => {});
  } catch {
    // Ignore registration errors in restricted iframes or private browsing modes
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    void setupServiceWorker();
  });
}
