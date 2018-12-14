const CACHE_NAME = 'restaurantReviews-v2';
const MAP_CACHE = 'map-cache';
const filesToCache = [
  '/',
  'index.html',
  'restaurant.html',
  '404.html',
  'dist/js/main.bundle.js',
  'dist/js/restaurant.bundle.js',
  'dist/css/all.css',
  'img/logo.svg',
  'img/pen.svg',
  'dist/img/1.jpg',
  'dist/img/2.jpg',
  'dist/img/3.jpg',
  'dist/img/4.jpg',
  'dist/img/5.jpg',
  'dist/img/6.jpg',
  'dist/img/7.jpg',
  'dist/img/8.jpg',
  'dist/img/9.jpg',
  'dist/img/10.jpg',
  'dist/img/error.jpg'
];

/* add files to cache */
self.addEventListener('install', (evt) => {
  console.log('[Service Worker] Install');
  evt.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(filesToCache))
      .then(self.skipWaiting())
  );
});

/*remove other old caches */
self.addEventListener('activate', (evt) => {
  console.log('[Service Worker] Activate');
  evt.waitUntil(
    caches.keys().then((cacheList) =>
      Promise.all(
        cacheList
          .filter(
            (cacheName) =>
              cacheName.startsWith('restaurantReviews-') &&
              ![CACHE_NAME, MAP_CACHE].includes(cacheName)
          )
          .map((cacheName) => {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            caches.delete(cacheName);
          })
      )
    )
  );
});

/* hijack fetch requests and serve from cache if available */
self.addEventListener('fetch', (evt) => {
  var url = new URL(evt.request.url);
  let request = evt.request;
  if (url.pathname === '/restaurant.html') {
    request = '/restaurant.html';
  }

  console.log('[Service Worker] Fetch', request.url);
  evt.respondWith(
    caches.match(request).then((res) => {
      console.log('[Service Worker] Response from cache', res);
      if (res) {
        console.log('[Service Worker] Found response in cache');
        return res;
      }
      console.log('[Service Worker] No response from cache. About to Fetch from Network...');
      return fetch(evt.request.clone())
        .then((res) => {
          const resClone = res.clone();
          if (url.hostname === 'unpkg.com') {
            caches.open(MAP_CACHE).then((cache) => cache.put(request, resClone));
          }
          if (url.hostname === 'api.tiles.mapbox.com') {
            caches.open(MAP_CACHE).then((cache) => cache.put(request, resClone));
          }
          return res;
        })
        .catch((error) => {
          console.log('[Service Worker] Network Error', error);
          return caches.match('404.html');
        });
    })
  );
});
