// Minimal service worker: makes the app installable and keeps the shell available offline.
const CACHE = "my-shell-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"]))); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); return res; }).catch(() => caches.match(r).then((m) => m || caches.match("./index.html"))));
});
// push notifications (step 2): show the message text
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : { title: "Мы", body: "Новое сообщение" };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "icon-192.png", badge: "icon-192.png", tag: "msg" }));
});
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(self.clients.openWindow("./")); });
