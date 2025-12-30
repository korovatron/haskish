const CACHE_NAME = 'haskish-cache-v83';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './haskish.js',
    './styles.css',
    './manifest.json',
    './sw.js',
    './headerLogo.png',
    './examples.txt',
    'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/monokai.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/eclipse.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/haskell/haskell.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Assets cached successfully');
                self.skipWaiting(); // Force activation
            })
            .catch((error) => {
                console.error('Cache failed:', error);
                throw error;
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker activated');
            return self.clients.claim(); // Take control immediately
        })
    );
});

// Fetch event - cache first with network fallback and timeout
self.addEventListener('fetch', (event) => {
    // For navigation requests (opening the app), use aggressive cache-first with short timeout
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Serve cached version immediately
                        // Update in background with timeout
                        fetchWithTimeout(event.request, 2000)
                            .then((freshResponse) => {
                                if (freshResponse.status === 200) {
                                    caches.open(CACHE_NAME).then((cache) => {
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
            .then((response) => {
                if (response) {
                    // Found in cache, return immediately
                    // But also update cache in background for next time
                    fetchWithTimeout(event.request, 5000)
                        .then((freshResponse) => {
                            if (freshResponse.status === 200 && event.request.method === 'GET') {
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, freshResponse.clone());
                                });
                            }
                        })
                        .catch(() => {}); // Ignore network errors in background update
                    
                    return response;
                }
                
                // Not in cache, fetch with timeout to handle slow networks
                return fetchWithTimeout(event.request, 5000)
                    .then((response) => {
                        const responseClone = response.clone();
                        
                        if (response.status === 200 && event.request.method === 'GET') {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        
                        return response;
                    });
            })
            .catch((error) => {
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
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});













