/* register service worker if supported*/

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('service-worker.js')
    .then(function() {
      console.log('Service Worker registered');
    })
    .catch(function(error) {
      console.log('Failed to register Service Worker');
    });
}
