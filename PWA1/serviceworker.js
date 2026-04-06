/**
 * This file implements the service worker
 * SW handles data (fetching and caching)
 * Noah Reeves
 */

const CACHE_NAME = 'torontobbq-pwa-v1';
const DATA_URL = './locations.json';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service worker- Currently installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service worker- Caching files');
            return cache.addAll([
                './',
                './index.html',
                './css/style.css',
                './js/appcontroller.js',
                './js/locations.js',
                './locations.json',
                './manifest.json',
                './images/icon-small.png',
                './images/icon-big.png'
            ]);
        })
    );
    
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service worker- Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service worker- Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    
    return self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Message event
self.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'FETCH_DATA') {
        console.log('Service Worker has recieve request to fetch data');
        
        try {
            // Fetch the json
            const response = await fetch(DATA_URL);
            const jason = await response.json();
            
            // Send data back to client for indexeddb storage
            event.ports[0].postMessage({
                type: 'DATA_FETCHED',
                data: jason.locations
            });
            
            console.log('Service Worker- Data has been fetched and sent to client');
        } catch (error) {
            console.error('Service Worker- Error fetching data: ', error);
            event.ports[0].postMessage({
                type: 'DATA_ERROR',
                error: error.message
            });
        }
    }
});