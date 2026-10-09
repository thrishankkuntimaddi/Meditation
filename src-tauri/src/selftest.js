// Debug-only: exercise every bridge call from inside the real web view.
(async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const r = {};
  const step = async (name, fn) => { try { r[name] = await fn(); } catch (e) { r[name] = 'ERR ' + e; } };
  await step('appRendered', () => !!document.querySelector('#nav-home'));
  await step('theme', () => document.documentElement.dataset.theme);
  await step('info', () => invoke('desktop_info'));
  await step('awakeOn', () => invoke('keep_awake', { on: true }));
  await step('alertsMuted', () => invoke('set_alerts_muted', { muted: true }));
  await step('alertsRestored', () => invoke('set_alerts_muted', { muted: false }));
  await step('awakeOff', () => invoke('keep_awake', { on: false }));
  await step('reminders', () => invoke('set_reminders', { items: [] }).then(() => 'ok'));
  await step('autostart', () => invoke('get_autostart'));
  await step('deviceName', () => JSON.parse(localStorage.getItem('meditation_settings') || '{}').deviceName);
  await step('idb', () => typeof indexedDB);
  await step('secure', () => window.isSecureContext);
  await step('audio', () => typeof (window.AudioContext || window.webkitAudioContext));
  invoke('selftest_report', { report: JSON.stringify(r) });
})();
