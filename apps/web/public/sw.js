self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request).catch(() => {
      if (request.mode === "navigate") {
        return new Response(
          "<!doctype html><title>TrendBoard</title><meta name='viewport' content='width=device-width, initial-scale=1'><body style='margin:0;font-family:system-ui;background:#07111f;color:#eaffff;display:grid;min-height:100svh;place-items:center;padding:24px;text-align:center'><main><h1>TrendBoard is offline</h1><p>Reconnect and open the app again.</p></main></body>",
          {
            headers: { "content-type": "text/html; charset=utf-8" },
          },
        );
      }

      return new Response("", { status: 503, statusText: "Offline" });
    }),
  );
});
