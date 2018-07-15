const CACHE_NAME = 'restaurantReviews-v1';

const filesToCache = [
  '/',
  'index.html',
  'restaurant.html',
  '404.html',
  'js/main.js',
  'js/restaurant_info.js',
  'js/dbhelper.js',
  'css/styles.css',
  'css/404.css',
  'css/media.css',
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg',
  'img/error.jpg'
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
            (cacheName) => cacheName.startsWith('restaurantReviews-') && cacheName != CACHE_NAME
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
  console.log('[Service Worker] Fetch', evt.request.url);
  evt.respondWith(
    caches.match(evt.request).then((res) => {
      console.log('[Service Worker] Response from cache', res);
      if (res) {
        console.log('[Service Worker] Found response in cache');
        return res;
      }
      console.log('[Service Worker] No response from cache. About to Fetch from Network...');
      return fetch(evt.request.clone())
        .then((res) => {
          if (res.status === 404) {
            return caches.match('404.html');
          }
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, resClone));
          return res;
        })
        .catch((error) => {
          console.log('[Service Worker] Network Error', error);
          return caches.match('404.html');
        });
    })
  );
});
