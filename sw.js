const CACHE_NAME = 'scan-to-chess-v1';
// Add all local assets and key CDN assets to the cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/dist/bundle.js',
  '/styles/global.css',
  '/styles/components.css',
  '/styles/layouts.css',
  '/components/ui/CapturedPieces.css',
  '/components/Chessboard.css',
  '/components/views/InitialView.css',
  '/components/views/CameraView.css',
  '/components/views/ImagePreview.css',
  '/components/views/PdfView.css',
  '/components/views/LoadingView.css',
  '/components/views/ResultView.css',
  '/components/views/SolveView.css',
  '/components/ui/MoveHistory.css',
  '/components/views/LoginView.css',
  '/components/views/AdminView.css',
  '/components/ui/UserMenu.css',
  '/components/views/HistoryView.css',
  '/components/ui/ConfirmationDialog.css',
  '/components/views/SavedGamesView.css',
  '/components/result/EditorBoard.css',
  '/components/result/EditorControls.css',
  '/components/result/UserPanel.css',
  '/components/views/ProfileView.css',
  '/components/ui/PieceSetSelectorModal.css',
  'https://aistudiocdn.com/react-image-crop@^11.0.10/dist/ReactCrop.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap',
  'https://accounts.google.com/gsi/client',
  'https://apis.google.com/js/api.js',
  'https://aistudiocdn.com/react-dom@^19.1.1',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/@google/genai@^1.21.0',
  'https://aistudiocdn.com/pdfjs-dist@5.4.149/build/pdf.worker.mjs',
  'https://aistudiocdn.com/pdfjs-dist@5.4.149/build/pdf.mjs',
  'https://aistudiocdn.com/chess.js@^1.4.0',
  'https://aistudiocdn.com/react-image-crop@^11.0.10',
  // OpenCV is still needed for the real vision pipeline
  'https://docs.opencv.org/4.9.0/opencv.js'
];

// Install the service worker and cache all the app's content
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching assets');
        return cache.addAll(urlsToCache.map(url => new Request(url, { mode: 'no-cors' })));
      }).catch(err => {
        console.error('Failed to cache assets during install:', err);
      })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercept fetch requests and serve from cache first
self.addEventListener('fetch', (event) => {
  // We only cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache, fetch from network and cache it
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || (response.status !== 200 && response.type !== 'opaque' && response.type !== 'cors')) {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                 cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Listen for a message from the client to skip waiting and activate the new service worker.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
