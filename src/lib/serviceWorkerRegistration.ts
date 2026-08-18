/**
 * Service Worker Registration & Academic Offline Caching Utilities
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] ServiceWorker registered with scope:', registration.scope);

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New academic dashboard version available. Update cached.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[SW] ServiceWorker registration failed (non-fatal):', error);
      });
  });
}

/**
 * Pre-caches essential academic data payload into the Service Worker Dynamic Cache
 * for immediate offline resilience during network outages.
 */
export function cacheAcademicDataForOffline(key: string, data: any): void {
  if (typeof window === 'undefined') return;

  // 1. Store in LocalStorage fallback
  try {
    localStorage.setItem(`edumaster_offline_cache_${key}`, JSON.stringify({
      data,
      cachedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Could not cache to localStorage:', e);
  }

  // 2. Dispatch to Service Worker Dynamic Cache
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PRECACHE_ACADEMIC_DATA',
      key,
      data
    });
  }
}

/**
 * Retrieve cached academic data during network dropouts
 */
export function getOfflineCachedAcademicData<T = any>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`edumaster_offline_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.data as T;
    }
  } catch (e) {
    console.warn('Could not read offline cache:', e);
  }
  return null;
}
