// AiToWords Service Worker
// 版本 1.0.0

const CACHE_NAME = 'aitowords-v1.0.0';
const OFFLINE_URL = '/offline.html';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    
    // Scripts
    '/scripts/error-handler.js',
    '/scripts/onboarding.js',
    '/scripts/templates.js',
    '/scripts/history.js',
    '/scripts/batch-processor.js',
    '/scripts/mobile-optimizer.js',
    '/scripts/data-exporter.js',
    '/scripts/performance.js',
    '/scripts/feedback.js',
    '/scripts/share.js',
    
    // Styles
    '/styles/onboarding.css',
    
    // Icons
    '/extension/icons/icon72.png',
    '/extension/icons/icon96.png',
    '/extension/icons/icon128.png',
    '/extension/icons/icon192.png',
    '/extension/icons/icon512.png',
    
    // External Libraries (from CDN)
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
    'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
];

// 安装事件
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// 激活事件
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => {
            console.log('[ServiceWorker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    // 只处理 GET 请求
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 缓存命中，返回缓存
                if (response) {
                    console.log('[ServiceWorker] Serving from cache:', event.request.url);
                    return response;
                }
                
                // 缓存未命中，从网络获取
                console.log('[ServiceWorker] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // 检查是否是有效响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // 克隆响应（因为响应是流，只能使用一次）
                        const responseToCache = response.clone();
                        
                        // 缓存新获取的资源
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // 网络失败，返回离线页面
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                    });
            })
    );
});

// 消息事件
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 后台同步
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sync event:', event.tag);
    
    if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

// 推送通知
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'AiToWords 有新功能更新！',
        icon: '/extension/icons/icon192.png',
        badge: '/extension/icons/icon72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '立即体验',
                icon: '/extension/icons/icon96.png'
            },
            {
                action: 'close',
                title: '关闭',
                icon: '/extension/icons/icon96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('AiToWords', options)
    );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification click:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 同步分析数据
async function syncAnalytics() {
    try {
        console.log('[ServiceWorker] Syncing analytics data');
        // 这里可以添加离线分析数据的同步逻辑
    } catch (error) {
        console.error('[ServiceWorker] Sync analytics failed:', error);
    }
}

console.log('[ServiceWorker] Service Worker loaded');
