// Imported by the generated service worker: open the app when a reminder is tapped.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const kind = event.notification.data && event.notification.data.kind;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = all[0];
    if (client) {
      await client.focus();
      client.postMessage({ type: 'reminder-tap', kind });
    } else {
      await self.clients.openWindow(self.registration.scope + (kind ? `?practice=${kind}` : ''));
    }
  })());
});
