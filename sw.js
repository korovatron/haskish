const CACHE_NAME = 'haskish-v1.0.18';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './haskish.js',
  './styles.css',
  './manifest.json',
  './data/examples.txt',
  './data/lessons.txt',
  './images/headerLogo.png',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/monokai.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/haskell/haskell.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-haskell.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  // Take control of all clients immediately
  event.waitUntil(
    self.clients.claim().then(() => {
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
});

// Fetch event - cache first with network fallback and timeout
self.addEventListener('fetch', event => {
  // For navigation requests (opening the app), use aggressive cache-first with short timeout
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Serve cached version immediately
            // Update in background with timeout
            fetchWithTimeout(event.request, 2000)
              .then(freshResponse => {
                if (freshResponse.status === 200) {
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, freshResponse.clone());
                  });
                }
              })
              .catch(() => {}); // Ignore timeout/errors in background
            
            return cachedResponse;
          }
          
          // No cache, try network with short timeout
          return fetchWithTimeout(event.request, 2000)
            .catch(() => caches.match('./index.html'));
        })
    );
    return;
  }
  
  // For other requests, use standard cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Found in cache, return immediately
          // But also update cache in background for next time
          fetchWithTimeout(event.request, 5000)
            .then(freshResponse => {
              if (freshResponse.status === 200 && event.request.method === 'GET') {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, freshResponse.clone());
                });
              }
            })
            .catch(() => {}); // Ignore network errors in background update
          
          return response;
        }
        
        // Not in cache, fetch with timeout to handle slow networks
        return fetchWithTimeout(event.request, 5000)
          .then(response => {
            const responseClone = response.clone();
            
            if (response.status === 200 && event.request.method === 'GET') {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            
            return response;
          });
      })
      .catch(error => {
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        throw error;
      })
  );
});

// Fetch with timeout helper
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
