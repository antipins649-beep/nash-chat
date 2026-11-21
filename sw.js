// Service worker: makes the app installable, keeps the shell available offline, shows push notifications.
const CACHE = "my-shell-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"]))); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); return res; }).catch(() => caches.match(r).then((m) => m || caches.match("./index.html"))));
});

const isIOS = /iPhone|iPad|iPod|Macintosh/.test(self.navigator.userAgent);
self.addEventListener("push", (e) => {
  let d = { title: "Мы", body: "Новое сообщение", tag: "chat" };
  try { if (e.data) d = { ...d, ...e.data.json() }; } catch { /* plain text */ }
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // chat is open and on screen: no need to buzz (iOS wants a notification for every push, so show it there anyway)
    if (!isIOS && wins.some((w) => w.visibilityState === "visible")) return;
    await self.registration.showNotification(d.title, { body: d.body, icon: "icon-192.png", badge: "icon-192.png", tag: d.tag, renotify: true, vibrate: [80, 40, 80] });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (wins.length) return wins[0].focus();
    return self.clients.openWindow("./");
  })());
});
