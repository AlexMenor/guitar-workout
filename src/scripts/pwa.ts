if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let controlled = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) document.querySelector<HTMLElement>('#pwa-update')!.hidden = false;
    controlled = true;
  });
  document.querySelector('#pwa-reload')?.addEventListener('click', () => location.reload());
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      const check = () => { if (!document.hidden) void registration.update().catch(() => {}); };
      document.addEventListener('visibilitychange', check);
      window.addEventListener('pageshow', check);
      check();
    } catch (error) { console.error('Offline support could not be registered:', error); }
  });
}
